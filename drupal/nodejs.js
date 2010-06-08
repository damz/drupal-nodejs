var client = new Faye.Client(Drupal.settings.nodejs.bindingUrl, { timeout: 60 });

Drupal.behaviors.nodejs = function() {
  var nid = Drupal.settings.nodejs.nid;
  var process_message = function(message) {
    var tree = message[Drupal.settings.nodejs.page];
    var previous_item = false;

    // First, traverse the incoming tree to find new items that need to be
    // inserted into the DOM.
    for (i in tree) {
      var comment = tree[i];
      if ($('#comments a#comment-' + comment.cid).length > 0) {
        // The element already exists, skip it.
        continue;
      }

      // Fetch the full element via an AJAX request.
      var response = $.ajax({
        type: "GET",
        url: Drupal.settings.basePath + '?q=node/' + nid + '/comment/' + comment.cid + '/js',
        async: false,
        dataType: 'json'
      }).responseText;
      response = Drupal.parseJson(response);

      // Not sure it is completely necessary to wrap the comment inside
      // a <div>, but this is consistent with how ahah.js does it.
      var addedComment = $('<div></div>').html(response.data);

      if (i == 0) {
        // This is the first element, add it in the begining of the container.
        $('div#comments > h2.comments').after(addedComment);
      }
      else {
        // The <div> element of the previous comment.
        var previous_comment = $('#comments a#comment-' + tree[i-1].cid).next("div.comment");
        // The depth of the previous comment.
        var previous_depth = tree[i-1].depth;

        if (comment.depth > previous_depth) {
          // This comment is deeper then the previous one. We need to add
          // a indented container here if it doesn't exists yet.
          var wrapper = previous_comment.next(".indented");
          if (wrapper.length == 0) {
            wrapper = $('<div class="indented"></div>');
            previous_comment.after(wrapper);
          }
          // Insert this comment at the begining of the new container.
          wrapper.prepend(addedComment);
        }
        else {
          // This comment is less deep then the previous one, we need to close
          // indented containers and start over.
          if (comment.depth < previous_depth) {
            for (var i = 0; i < previous_depth - comment.depth; i++) {
              previous_comment = previous_comment.parent();
            }
          }
          // Insert this comment after the previous one in this container.
          previous_comment.after(addedComment);
        }
      }

      // Animate the insertion of the comment. This should be made pluggeable.
      addedComment.find('div.comment').hide().fadeIn(500, function() {
        $(this).animate({ backgroundColor: '#ffffe0' }, 3000, function() {
          $(this).animate({ backgroundColor: '#ffffff' }, 30000);
        });
      });
    }

    // Finally, remove from the DOM the comments that are no longer on this page.

    // For performance, prepare a hash of the visible comments.
    var visible_comments = {}
    for (i in tree) {
      visible_comments[tree[i].cid] = true;
    }

    // Iterate over the DOM and remove the comments that are not in the hash.
    $('#comments a[id^=comment-]').each(function() {
      var cid = $(this).attr('id').substr(8);
      if (!visible_comments[cid]) {
        // Remove everything between the <a id="comment-[id]" /> and the div.comment.
        var current = $('#comments a#comment-' + cid), next;
        while (current.filter('div.comment').length == 0) {
          next = current.next();
          current.remove();
          current = next;
        }
      }
    });
  }

  client.subscribe('/node/' + Drupal.settings.nodejs.nid, process_message);
};
