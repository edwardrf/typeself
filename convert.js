var fs = require('fs');
var sys = require('sys');
var exec = require('child_process').exec;
var path = require('path');
var async = require('async');

var files = process.argv.slice(2);

console.log(files);

async.each(files, function(item, callback){
  // console.log('[' + process.argv[i] + ']');
  var basename = path.basename(item);

  basename = basename.substr(0, basename.lastIndexOf('.'));

  // console.log(item, fs.existsSync(item));
  var output = 'output/f2/' + basename + '.png';
  var outputTxt = 'output/txt/' + basename + '.txt';
  var font = './font';


  // exec('java -jar Converter.jar ' + item + )
  console.log('java -jar Converter.jar \'' + item + '\' \'' + output + '\' ' + font);
  exec('java -jar Converter.jar \'' + item + '\' \'' + output + '\' ' + font, function(err, stdout, stderr){
    fs.writeFileSync(outputTxt, stdout);
    console.log(basename, stderr);
  });
  callback(null);
}, function(err){
  console.log(err);
  console.log('Done');
});
