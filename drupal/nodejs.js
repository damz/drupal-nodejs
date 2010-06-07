var client = new Faye.Client('http://nodejs.dev.c--g.net:3000/comet', { timeout: 60 });

Drupal.behaviors.nodejs = function() {
  
  var nid = Drupal.settings.nodejs.nid;
  var process_message = function(message) {
    var tree = message[Drupal.settings.nodejs.page];
    var previous_item = false;
    for (i in tree) {
      var comment = tree[i];
      if ($('#comments a#comment-' + comment.cid).length == 0) {
        var response = $.ajax({
          type: "GET",
          url: Drupal.settings.basePath + '?q=node/' + nid + '/comment/' + comment.cid + '/js',
          async: false,
          dataType: 'json'
        }).responseText;
        response = Drupal.parseJson(response);
        var addedComment = $('<div></div>').html(response.data);
        if (i == 0) {
          $('div#comments > h2.comments').after(addedComment);
        }
        else {
          var previous_comment = $('#comments a#comment-' + tree[i-1].cid).next("div.comment");
          var parent_depth = tree[i-1].depth;
          if (comment.depth > parent_depth) {
            var wrapper;
            if(previous_comment.next(".indented").length > 0) {
              wrapper = previous_comment.next(".indented");
            }
            else {
              wrapper = $('<div class="indented"></div>');
              previous_comment.after(wrapper);
            }
            wrapper.prepend(addedComment);
          }
          else {
            if (comment.depth < parent_depth) {
              for (var i = 0; i < parent_depth - comment.depth; i++) {
                previous_comment = previous_comment.parent();
              }
            }
            previous_comment.after(addedComment);
          }
        }
        addedComment.find('div.comment').hide().fadeIn(500, function() {
          $(this).animate({ backgroundColor: '#ffffe0' }, 3000, function() {
            $(this).animate({ backgroundColor: '#ffffff' }, 30000);
          });
        });
      }
    } 
    $('#comments a[id^=comment-]').each(function() {
      var cid = $(this).attr('id').substr(8);
      var found = false;
      for(i in tree) {
        if (tree[i].cid == cid) {
          found = true;
          break;
        }
      }
      if (!found) {
        $('#comments a#comment-' + cid).next("div.comment").remove().end().remove();
      }
    });
  }
  
//  process_message([[]]);
  client.subscribe('/node/' + Drupal.settings.nodejs.nid, process_message);
  // var response = $.ajax({
  //   type: "GET",
  //   url: Drupal.settings.basePath + '?q=node/' + nid + '/comment/json',
  //   async: false,
  //   dataType: 'json'
  // }).responseText;
//  response = Drupal.parseJson(response);
//  process_message(response.data);
};
