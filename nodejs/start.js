
require.paths.unshift('../vendor/expressjs/lib');
require.paths.unshift('../vendor/faye/build');

var http = require('http');
var sys = require('sys');
var path = require('path');
var fs = require('fs');
var faye = require('faye');
var PUBLIC_DIR = path.dirname(__filename);

var comet = new faye.NodeAdapter({
  mount: '/comet',
  timeout: 45
});

http.createServer(function(request, response) {
  sys.puts(request.method + ' ' + request.url);
  if (comet.call(request, response)) return;

  var path = (request.url === '/') ? '/index.html' : request.url;

  var matches;
  if (matches = /^\/publish\/(\d+)\/(\d+)/.exec(path)) {
    var client = comet.getClient();
    client.publish('/node/' + matches[1], { comment_id: matches[2] });
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end();
  }

  fs.readFile(PUBLIC_DIR + path, function(err, content) {
    if (!err) {
      response.writeHead(200, {'Content-Type': 'text/html'});
      response.write(content);
      response.end();
    }
    else {
      response.writeHead(404, {'Content-Type': 'text/html'});
      response.end();
    }
  });
}).listen(3000);

setInterval(function() {
  var client = comet.getClient();
  client.publish('/foo', { date: (new Date()).getTime() });
}, 10000);
