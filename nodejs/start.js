
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
  if (request.method === "POST" && ((matches = /^\/publish\/(\d+)/.exec(path)))) {
    request.body = '';
    request
      .addListener('data', function (chunk) {
        request.body += chunk;
      })
      .addListener('end', function () {
        var client = comet.getClient();
        var data = JSON.parse(request.body);
        sys.puts(request.body);
        client.publish('/node/' + matches[1], data);
        sys.puts(sys.inspect(data));
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end();
      });
    return;
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
