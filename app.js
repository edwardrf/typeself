var Q       = require('q');
var Font    = require('./modules/font');
var Raster  = require('./modules/raster');

var hStep = 4;
var vStep = 4;

if(process.argv.length < 4) {
  console.log('Usage: node ' + __filename + ' INPUT.png OUTPUT.png');
  process.exit(-1);
}

Font.whenReady().then(function(){
  var inputfile = process.argv[2];
  var outputfile = process.argv[3];
  Raster.read(inputfile).then(function(inImg){
    var sampleSize = Math.min(Font.width, Font.height);

    // Initialize the charmap
    var charMap = [];
    var charCount = 0;
    for(var i = 0; i + sampleSize < inImg.height; i += vStep){
      var l = [];
      for(var j = 0; j + sampleSize < inImg.width; j += hStep){
        l.push('_');
      }
      charMap.push(l);
    }

  // console.log(charMap.length, charMap[0].length);

    // Start estimation
    var target = new Raster(inImg.width, inImg.height);

    for(var k = 0; k < 4; k++) {
      for(var i = 0; i < (inImg.height - sampleSize) / vStep; i++){
        if(i % 10 == 0) console.log('I ', i);
        for(var j = 0; j < (inImg.width - sampleSize) / hStep; j++){
          fitChar(i,j);
        }
      }
    }
    console.log('done middle');
    // target.write("output/middle.png");

    for(var r = 0; r < 10000; r++) {
      if(r % 100 == 0) console.log('R ', r);
      var i = Math.floor(Math.random() * (inImg.width - sampleSize) / vStep);
      var j = Math.floor(Math.random() * (inImg.height - sampleSize) / hStep);
      fitChar(i, j);
    }

    console.log('Total char count : ' + charCount);
    target.write(outputfile);

    function fitChar(i, j){
      var bestChar = charMap[i][j];


      // Ignore low color blocks
      var sampleSize = Math.max(Font.width, Font.height);
      var sampleValue = bestChar == '_' ? inImg.sample(j * hStep, i * vStep, sampleSize) : Infinity;
      // if(sampleValue > 0) console.log(sampleValue, j * hStep, i * vStep, sampleSize);
      if(sampleValue / sampleSize / sampleSize > 0) {
        var bestScore = Infinity;
        if(!Font[bestChar]) console.log(j * hStep, i * vStep, bestChar);
        target.unpaint(j * hStep, i * vStep, Font[bestChar]);
        if(bestChar != '_') charCount --;

        for(var k in Font.chars) {
          var c = Font.chars[k];
          var score = 0;

          target.paint(j * hStep, i * vStep, Font[c]);
          var sizeLimit = 4;//Math.min(hStep, vStep);
          for(var size = 1; size < sizeLimit; size += 2) {
            var diff = Raster.diff(inImg, target, j * hStep, i * vStep, Font.width, Font.height, size);
            // console.log(diff);
            score += (diff[0] + diff[1]);// * Math.pow(1, (sizeLimit - size));
            // score += (diff[0] + diff[1]);
          }
          // console.log('y', j * hStep, i * vStep, c);
          target.unpaint(j * hStep, i * vStep, Font[c]);
          if(score < bestScore){
            bestScore = score;
            bestChar = c
          }
        }
      }else {
        bestChar = '_';
      }

      if(bestChar != '_') {
        target.paint(j * hStep, i * vStep, Font[bestChar]);
        charMap[i][j] = bestChar;
        charCount ++;
      }
    }

  });
}).fail(function(err) {
  console.log(err);
});
