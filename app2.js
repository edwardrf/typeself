var Q       = require('q');
var Font    = require('./modules/font');
var Raster  = require('./modules/raster');

var hStep = 8;
var vStep = 8;

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
    for(var i = 0; i + sampleSize < inImg.height; i += vStep){
      for(var j = 0; j + sampleSize < inImg.width; j += hStep){
        var bestChar = charMap[i / vStep][j / hStep];
        var bestScore = Infinity;
        // console.log(j, i);
        // console.log('x', j, i, bestChar);
        target.unpaint(j, i, Font[bestChar]);
        for(var k in Font.chars) {
          var c = Font.chars[k];
          var score = 0;

          if(!Font[c]) console.log(c);

          target.paint(j, i, Font[c]);
          var sizeLimit = 5;//Math.min(hStep, vStep);
          for(var size = 4; size < sizeLimit; size += 2) {
            var diff = Raster.diff(inImg, target, j, i, Font.width, Font.height, size);
            // console.log(diff);
            // score += (diff[0] + diff[1] * 100) * Math.pow(1, (sizeLimit - size));
            score += (diff[0] + diff[1]);
          }
          // console.log('y', j, i, c);
          target.unpaint(j, i, Font[c]);
          if(score < bestScore){
            bestScore = score;
            bestChar = c
          }
        }
        if(c != '_') {
          target.paint(j, i, Font[bestChar]);
          charMap[i/vStep][j/hStep] = bestChar;
        }
      }
    }

    target.write(outputfile).then(function(){
      for(var i = 0; i < charMap.length; i++) {
        // console.log(charMap.join());
      }
    });
  });
}).fail(function(err) {
  console.log(err);
});
