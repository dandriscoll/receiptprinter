var express = require('express');
var azure = require('azure-storage');
var https = require('https');

var app = express();

var queuename = 'QUEUENAME';
var qs = azure.createQueueService('AZURE_QUEUE_CONNECTION_STRING');
// Self-pinging keepalive, set URL to final deployed URL to enable
var keepaliveUrl;
// var keepaliveUrl = 'http://URL_WHERE_SITE_IS_HOSTED';

function queue(req, res, correctForIfttt, queue) {
  var postBody = '';

  req.on('data', function(data) {
    postBody += data;
  });

  req.on('end', function() {
    if (correctForIfttt) {
      postBody = postBody.charAt(0).toUpperCase() + text.slice(1) + '\n\n\n\n';
    }
    
    var contents = Buffer.from(postBody).toString('base64');

    qs.createMessage(queue, contents, function(err) {
      if (err) {
        res.sendStatus(500);
      }
      
      res.sendStatus(200);
    });
  });
}

// Set up URLs for a single queue. If you want to run multiple queues off this site, just copy/paste this with additional queue names
// Or write a loop, like I care
app.use('/receipt/' + queuename, express.static(__dirname + '/' + queuename));
app.post('/receipt/queue/' + queuename, function(req, res) { queue(req, res, false, queuename ); } );
app.post('/receipt/queue/' + queuename + '/ifttt', function(req, res) { queue(req, res, true, queuename ); } );

// Start keepalive

if (keepaliveUrl) {
  setInterval(function() {
    https.get(keepaliveUrl, function (res) {
      res.on('data', function(chunk) {});
      res.on('end', function() {});
    });
  }, 3 * 60 * 1000);
}

app.listen(process.env.PORT || 80, function() {
});