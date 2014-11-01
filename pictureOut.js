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

var rollUnit = 1200; // For picture print, it is 495/50?
var moveUnit = 200;

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
    var lines = fcontent.split('\n');
    for(var i = 0; i < lines.length; i++) {
      lines[i] = lines[i].trimRight();
    }

    content = lines.join('\n');
    callback();
  },
  sp.list,
  function(ports, callback){
    console.log(ports);
    serialPort = new SerialPort(ports[0].comName, {
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
    serialPort.on('data', function(data) {
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
          serialPort.write('R');
          bufLen = 0;
        }

        if(data.startsWith('OK')){
          bufLen = parseInt(data.substr(2));
          console.log('BUF:', bufLen);
        }

        var margin = 30 - bufLen;
        // console.log('PF', !pauseFlag, content, 'C');
        while(margin > 0 && content.length > 0 && !pauseFlag) {
          var char = content.charAt(0);
          var cmd = '';
          if(char == '\n'){
            cmd += 'r1 ' + rollUnit + 'R';
          }else if("\r\t".indexOf(char) >= 0) {
            continue;
          }else if(char == ' '){
            // var i = 1;
            // while(content.charAt(1) == ' ') {
            //   i++;
            //   content = content.substr(1);
            // }
            // cmd += 'm0 ' + (i * moveUnit);
            cmd += 'm0 ' + (1 * moveUnit);
          }else if(char == '~'){
            var scmd = '';
            var c = content.charAt(1);
            while(c != '\n'){
              scmd += c;
              content = content.substr(1);
              c = content.charAt(1);
            }
            console.log("SPECIAL : ", scmd);
            serialPort.write(scmd);
            content = content.substr(2);
            continue;
          }else {
            // console.log(char)k;
            cmd += 'p' + char + 'm0 ' + moveUnit;
          }
          margin -= cmd.length;
          console.log('CMD : ', cmd, margin);
          serialPort.write(cmd);
          content = content.substr(1);
          // console.log('d');
        }
        console.log('done');
        if(content.length == 0 && bufLen == 0) callback(null);
      }
    });
  }
  // serialPort.close
], function(err) {
  console.log(err);
  console.log("All Done");
  setTimeout(function(){
    serialPort.close();
    process.exit(0);
  }, 3000);
});
