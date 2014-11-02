require('string.prototype.startswith');
var sp = require("serialport");
var SerialPort = sp.SerialPort;
var async = require("async");
var started = false;
var fs = require('fs');

var serialPort;
var data;
var content = '';
var pauseFlag = false;
var inputFilename;
var cmdBuf = '';

var rollUnit = 1200; // For picture print, it is 425/90
var moveUnit = 200;
var finishedHandler = null;

// Ascii :  !, ", #, $, %, &, ', (, ), *, +, ,, -, ., /, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, :, ;, <, =, >, ?, @, A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z, [, \, ], ^, _, `, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w, x, y, z, {, |, }, ~
var krow = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4, 1, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 2, 1, 2, 4, 3, 3, 4, 4, 3, 2, 3, 3, 3, 2, 3, 3, 3, 4, 4, 2, 2, 2, 2, 3, 2, 2, 4, 2, 4, 2, 4,-1, 3,-1,-1, 1,-1, 3, 4, 4, 3, 2, 3, 3, 3, 2, 3, 3, 3, 4, 4, 2, 2, 2, 2, 3, 2, 2, 4, 2, 4, 2, 4,-1, 4,-1,-1];
var kcol = [1, 2, 3, 4, 5, 7, 8, 9,10,11,12, 8,11, 9,10,10, 1, 2, 3, 4, 5, 6, 7, 8, 9,10,10,11,12,11,10,11, 1, 5, 3, 3, 3, 4, 5, 6, 8, 7, 8, 9, 7, 6, 9,10, 1, 4, 2, 5, 7, 4, 2, 2, 6, 1,-1,11,-1,-1, 6,-1, 1, 5, 3, 3, 3, 4, 5, 6, 8, 7, 8, 9, 7, 6, 9,10, 1, 4, 2, 5, 7, 4, 2, 2, 6, 1,-1,10,-1,-1];
var ksft = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,-1, 0,-1,-1, 1,-1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,-1, 0,-1,-1];

if(process.argv[2]) inputFilename = process.argv[2];
if(process.argv[3]) rollUnit = parseInt(process.argv[3]);
if(process.argv[4]) moveUnit = parseInt(process.argv[4]);

console.log(inputFilename);
console.log('Unit : ', rollUnit, moveUnit);

if(!inputFilename || !fs.existsSync(inputFilename)) {
  console.log('Input file not specified or not exist.');
  process.exit(0);
}

var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', function(line){
  if(line == 'p') {
    pauseFlag = true;
  }else if(line == 'r') {
    pauseFlag = false;
    serialPort.write('x'); // This is a hack to reinitiate a callback from the serial port, there is no 'x' command
  }
})

async.waterfall([
  function(callback) {
    // process.stdin.resume();
    // process.stdin.on('data', function(buf) { content += buf.toString(); });
    // process.stdin.on('end', callback);
    fs.readFile(inputFilename, 'utf8', callback);
  },
  function(fcontent, callback) {
    console.log(fcontent);
    cmdBuf += 'CrR';
    var lines = fcontent.split('\n');
    for(var i = 0; i < lines.length; i++) {
      var line = lines[i].trimRight();
      var cap = '', low = '';
      if(line.startsWith('~Cr')) continue;
      while(line.length > 0) {
        var char = line.charAt(0);
        var idx = line.charCodeAt(0) - 33;
        if(ksft[idx] == 1){
          cap += char;
          low += ' ';
        }else if(ksft[idx] == 0){
          cap += ' ';
          low += char;
        }else {
          cap += ' ';
          low += ' ';
        }
        line = line.substr(1);
      }
      while(low.length > 0) {
        var ch = low.charAt(0);
        if(ksft[ch.charCodeAt(0) - 33] != -1){
          cmdBuf += 'p' + ch;
        }
        cmdBuf += 'm0 ' + moveUnit;
        low = low.substr(1);
      }
      while(cap.length > 0) {
        var ch = cap.charAt(cap.length - 1);
        cmdBuf += 'm1 ' + moveUnit;
        if(ksft[ch.charCodeAt(0) - 33] != -1){
          cmdBuf += 'p' + ch;
        }
        cap = cap.substr(0, cap.length - 1);
      }
      cmdBuf += 'r1 ' + rollUnit + 'R';
    }
    callback();
  },
  sp.list,
  function(ports, callback){
    console.log(ports);
    serialPort = new SerialPort(ports[ports.length - 1].comName, {
      baudrate: 9600,
      parser: sp.parsers.readline("\r\n")
    });
    setTimeout(function(){
      callback(null, serialPort);
    }, 1000);
  },
  function(serialPort, callback){
    serialPort.open(callback);
  },
  function(callback){
    console.log('Port opened');
    serialPort.write('x');// Dummy command to initiate communicate for MAC
    serialPort.on('data', function(data) {
      if(finishedHandler) clearTimeout(finishedHandler);
      console.log('DATA : ', data);
      if(!started) {
        // Wait for the printer to be ready;
        if(data.startsWith('Ready') || data.startsWith('OK')) {
          console.log('Printer ready');
          started = true;
        }
      }
      if(started) {
        var bufLen = 30;
        if(data.startsWith('Ready')){
          serialPort.write('R');
          bufLen = 0;
        }

        if(data.startsWith('OK')){
          bufLen = parseInt(data.substr(2));
          console.log('BUF:', bufLen);
        }

        var margin = 30 - bufLen;
        // console.log('PF', !pauseFlag, content, 'C');
        while(margin > 0 && cmdBuf.length > 0) {
          var char = cmdBuf.charAt(0);
          cmdBuf = cmdBuf.substr(1);
          console.log("Writting", char);
          serialPort.write(char);
          margin --;
        }
        console.log('done');
        if(cmdBuf.length == 0 && bufLen == 0){
          finishedHandler = setTimeout(callback, 10000);
        }
      }
    });
  }
  // serialPort.close
], function(err) {
  console.log(err);
  console.log("All Done");
  serialPort.close(function(err) {
    console.log('Port closed');
  });
});
