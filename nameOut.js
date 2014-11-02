require('string.prototype.startswith');
var sp = require("serialport");
var SerialPort = sp.SerialPort;
var async = require("async");
var started = false;
var fs = require('fs');

var serialPort;
var data;
var cmdBuf = '';
var pauseFlag = false;
var inputFilename;

var rollUnit = 1500; // For picture print, it is 495/50?
var moveUnit = 360;

var finishedHandler = null;

if(process.argv[2]) name = process.argv[2];
if(process.argv[3]) rollUnit = parseInt(process.argv[3]);
if(process.argv[4]) moveUnit = parseInt(process.argv[4]);

console.log(name);
console.log('Unit : ', rollUnit, moveUnit);

async.waterfall([
  function(callback) {
    // Build the name content.
    var nameWidth = (name.length + 4) * moveUnit + 120;
    cmdBuf = 'Crr0 1500Em1 ' + nameWidth;
    for(var i = 0; i < name.length; i++) {
      cmdBuf += 'p' + name.charAt(i);
      cmdBuf += 'm0 ' + moveUnit;
    }
    cmdBuf += 'Rr1 21000';
    callback();
  },
  sp.list,
  function(ports, callback){
    console.log(ports);
    serialPort = new SerialPort(ports[ports.length - 1].comName, {
      baudrate: 115200,
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
        if(data.startsWith('Ready')) {
          console.log('Printer ready');
          started = true;
        }
      }
      if(started) {
        var bufLen = 30;
        if(data.startsWith('Ready')){
          bufLen = 0;
        }

        if(data.startsWith('OK')){
          bufLen = parseInt(data.substr(2));
          console.log('BUF:', bufLen);
        }

        var margin = 30 - bufLen;
        while(margin > 0 && cmdBuf.length > 0) {
          var char = cmdBuf.charAt(0);
          cmdBuf = cmdBuf.substr(1);
          console.log("Writting", char);
          serialPort.write(char);
          margin --;
        }
        console.log('done');
        if(cmdBuf.length == 0 && bufLen == 0){
          finishedHandler = setTimeout(callback, 3000);
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
