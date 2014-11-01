var fs = require('fs');
var sys = require('sys');
var exec = require('child_process').exec;
var path = require('path');


for(var i = 2; i < process.argv.length; i++) {
  // console.log('[' + process.argv[i] + ']');
  var input = process.argv[i];
  var basename = path.basename(input);

  basename = basename.substr(0, basename.lastIndexOf('.') - 1);

  // console.log(input, fs.existsSync(input));
  var output = 'output/f2/' + basename + '.png';
  var outputTxt = 'output/txt/' + basename + '.txt';
  var font = './font';


  // exec('java -jar Converter.jar ' + input + )
  console.log('java -jar Converter.jar \'' + input + '\' \'' + output + '\' ' + font);
  exec('java -jar Converter.jar \'' + input + '\' \'' + output + '\' ' + font, function(err, stdout, stderr){
    fs.writeFileSync(outputTxt, stdout);
    console.log(basename, stderr);
  });

}
