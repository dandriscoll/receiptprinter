var express = require('express');
var dateformat = require('dateformat');
var fs = require('fs');
var exec = require('child_process').exec;
var path = require('path');
var azure = require('azure-storage');
var ip = require('ip');

var app = express();
var qs;
var port = 80;

// Set queueName and azureQueueConnectionString to enable reading from Azure queue
var queueName;
var azureQueueConnectionString;
// var queueName = 'QUEUENAME';
// var azureQueueConnectionString = 'CONNECTION_STRING_HERE';

if (queueName) {
  qs = azure.createQueueService(azureQueueConnectionString);
}

//
// Static webpage
//
app.use('/receipt', express.static(path.join(__dirname, 'web')));

//
// Print to printer
//
function print(data) {
  var devNode = fs.createWriteStream('/dev/usb/lp0');
  devNode.write(data);
  devNode.end();
  console.log(data);
}

//
// Consume and print HTTP request
//
function consume(req, res, format) {
  var postBody = '';

  req.on('data', function(data) {
    postBody += data;
  });

  req.on('end', function() {
    print(format(postBody));
    res.sendStatus(200);
  });
}

//
// Consume and discard HTTP request
//
function discard(req, res, callback) {
  req.on('data', function(data) {
  });

  req.on('end', function() {
    callback();
    res.sendStatus(200);
  });
}


function queue(req, res, queue) {
  var postBody = '';

  req.on('data', function(data) {
    postBody += data;
  });

  req.on('end', function() {
    qs.createMessage(queue, postBody, function(err) {
      if (err) {
        res.sendStatus(500);
      }
      
      res.sendStatus(200);
    });
  });
}

function formatPlain(data) {
  data = '\u001B@' + data + '\n\u001DV\u0041\u0000';
  return data;
}

function formatPlainForIfttt(data) {
  data = data.charAt(0).toUpperCase() + data.slice(1);
  data = '\u001B@' + data + '\n\n\n\n\n\u001DV\u0041\u0000';
  return data;
}

//
// Fancy print things: date and quotes
//
function formatToday(data) {
  return formatDateInt(new Date());
}

function formatDateInt(date) {
  var formatted = dateformat(date, 'dddd, mmmm d, yyyy ');
  if (formatted.length == 12 || formatted.length == 24 || formatted.length == 48) {
    formatted = formatted + ' ';
  }
  var todays = Array(48).join(formatted);
  todays = todays.substring(0, 384);
  return formatPlain(todays);
}

function printQuote() {
  fs.readFile('./quotes/quotes.txt', 'utf8', function(err, data) {
    if(err) throw err;
    var lines = data.split('\n');
    print(formatPlain(lines[Math.floor(Math.random() * lines.length)] + '\n\n\n'));
  });
}

//
// Queue code
//
function checkQueue() {
  qs.getMessages(queueName, function(err, res, response) {
    if (err) return;

    for (var i = 0; i < res.length; i++) {
      var message = res[i];
      print(formatPlain(message.messageText));
      qs.deleteMessage(queueName, message.messageId, message.popReceipt);
    }
  });
}

if (queueName) {
  setTimeout(function() {
    qs.doesQueueExist(queueName, function(err, res, response) {
      if (err) return;

      if (res) {
        setInterval(checkQueue, 5000);
      }
    });
  }, 10000);
}

app.post('/receipt', function(req, res) { consume(req, res, formatPlain); } );
app.post('/receipt/ifttt', function(req, res) { consume(req, res, formatPlainForIfttt); } );
app.post('/receipt/today', function(req, res) { consume(req, res, formatToday); } );
app.post('/receipt/quote', function(req, res) { discard(req, res, printQuote); });
app.post('/receipt/queue/post', function(req, res) { queue(req, res, 'queue'); });
app.post('/receipt/reload', function(req, res) {
  var proc = exec('./reload.sh', function(err, stdout, stderr) {
    if (err)
      res.send(500, stderr);
    else
      res.sendStatus(200);
  });
});
app.post('/receipt/restart', function(req, res) {
  var proc = exec('./restart', function(err, stdout, stderr) {
    if (err)
      res.send(500, stderr)
    else
      res.sendStatus(500);
  });
});

setTimeout(function() {
  // Startup diag
  print(formatPlain('Starting up.\n' + new Date() + '\n' + ip.address() + '\n\n\n'));
}, 20000);

app.listen(port, function() {
});
