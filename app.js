var async = require('async');
var fs    = require('fs');
var PNG   = require('pngjs').PNG;

var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_!#$%^&()-+=';
var charMap = {};

var paperWidth = 640; //12 * 10;
var paperHeight = 640; //16 * 10;
var dx = 8;//12 / 3;
var dy = 8;//8;//5;

var debug = false;
var target, canvas, charvas, fontWidth = 0, fontHeight = 0;

async.map(chars.split(''), function(c, cb){
  fs.createReadStream('font/' + c + '.png')
    .pipe(new PNG())
    .on('parsed', function(data) {
      this.grayData = [];
      for(var i = 0; i < this.height; i++) {
        var l = [];
        for(var j = 0; j < this.width; j++) {
          if(c == '_'){
            l.push(0);
          }else {
            l.push(getGrayScale(data, this.width, j, i));
          }
        }
        this.grayData.push(l);
      }
      charMap[c] = this;
      cb(null, this);
    });
}, function(err, result) {
  for(var i in charMap) {
    var w = charMap[i].width;
    var h = charMap[i].height;
    if(w > fontWidth) fontWidth = w;
    if(h > fontHeight) fontHeight = h;
  }
  // return;
  console.log(process.argv[2]);
  fs.createReadStream(process.argv[2])
    .pipe(new PNG())
    .on('parsed', function(data) {
      target = [];
      canvas = [];
      for(var i = 0; i < paperHeight; i++) {
        var line = [];
        var cline = [];
        for(var j = 0; j < paperWidth; j++) {
          var val = getGrayScale(data, this.width, j, i);
          if(val < 50) val = 0;
          line.push(val);
          cline.push(0);
        }
        target.push(line);
        canvas.push(cline);
      }
// outputTarget();
// return;
      charvas = [];
      for(var i = 0; i < Math.floor((paperHeight - fontHeight) / dy); i++) {
        var l = [];
        for(var j = 0; j < Math.floor((paperWidth - fontWidth) / dx); j++) {
          // if(target[i * dy][j * dx] > 200) debug = true; else debug = false;
          var bc = findBestChar(j * dx, i * dy);
          if(debug) console.log(j * dx, i * dy, bc);
          l.push(bc);
          type(j * dx, i * dy, bc);
        }
        charvas.push(l);
      }
//      render();
      outputCanvas();

      // var t = (new Date()).getTime();
      // for(var k = 0; k < 1000; k++) {
      //   render();
      // }
      // var te = (new Date()).getTime();
      // console.log(te - t);

    });
});

function findBestChar(x, y) {
  var min = Infinity, minC = '_';
  for(var i = 0; i < chars.length; i++) {
    var c = chars.charAt(i);
    var score = test(x, y, c);
    if(debug) console.log(c, score);
    if(score < min) {
      min = score;
      minC = c;
    }
  }
  return minC;
}

var stage = 'tl';
function test(x, y, c) {
  var ch = charMap[c];
  var score = 0;
  var maxSize = Math.min(Math.min(ch.width, ch.height), Math.min(dy, dx));
  // Top left, minimize white space
  for(var size = 1; size < maxSize; size++) {
    for(var i = 0; i < dy - size && i < ch.height - size; i++) {
      for(var j = 0; j < dx - size && j < ch.width - size; j ++) {
        var ts = sumArea(target, x + j, y + i, size);
        var cs = sumAreaCanvasWithChar(ch, x, y, j, i, size);
        if(debug) console.log("SCORE", x+j, y+i, size, target[y+i][x+j], ts, cs);
        var ls = (ts - cs) * Math.pow(1, maxSize - size - 1);
        if(ls > 0) {
          score += ls * 200;
        }else {
          score += (-ls);
        }
      }
    }
  }
  stage = 'bl';
  // Bottom left, banlance white space
  for(var size = 1; size < maxSize; size++) {
    for(var i = dy; i < ch.height - size; i++) {
      for(var j = 0; j < dx - size && j < ch.width - size; j ++) {
        var ts = sumArea(target, x + j, y + i, size);
        var cs = sumAreaCanvasWithChar(ch, x, y, j, i, size);
        if(debug) console.log("SCORE", ts, cs);
        var ls = (ts - cs) * Math.pow(1, maxSize - size - 1);
        // score += Math.abs(ls);
        if(ls > 0) {
          score += ls;
        }else {
          score += (-ls);
        }
      }
    }
  }
  stage = 'tr';
  // Top right, banlance white space
  for(var size = 1; size < maxSize; size++) {
    for(var i = 0; i < dy - size && i < ch.height - size; i++) {
      for(var j = dx; j < ch.width - size; j ++) {
        var ts = sumArea(target, x + j, y + i, size);
        var cs = sumAreaCanvasWithChar(ch, x, y, j, i, size);
        if(debug) console.log("SCORE", ts, cs);
        var ls = (ts - cs) * Math.pow(1, maxSize - size - 1);
        // score += Math.abs(ls);
        if(ls > 0) {
          score += ls;
        }else {
          score += (-ls);
        }
      }
    }
  }
  stage = 'br';
  // Bottom right, minimize extra ink
  for(var size = 1; size < maxSize; size++) {
    for(var i = 0; i < dy - size && i < ch.height - size; i++) {
      for(var j = 0; j < dx - size; j ++) {
        var ts = sumArea(target, x + j, y + i, size);
        var cs = sumAreaCanvasWithChar(ch, x, y, j, i, size);
        if(debug) console.log("SCORE", ts, cs);
        var ls = (ts - cs) * Math.pow(1, maxSize - size - 1);
        if(ls > 0) {
          score += ls;
        }else {
          score += (-ls) * 800;
        }
      }
    }
  }
  return score;
}

function sumArea(d, x, y, size) {
  var sum = 0;
  for(var i = 0; i < size; i++) {
    for(var j = 0; j < size; j++) {

      sum += d[y + i][x + j];
    }
  }
  return sum;
}

function sumAreaCanvasWithChar(ch, x, y, lx, ly, size) {
  var sum = 0;
  for(var i = 0; i < size; i++) {
    for(var j = 0; j < size; j++) {
      // console.log(stage, ly + i, lx + j, ly, i, lx, j);
      var v = ch.grayData[ly + i][lx + j] + canvas[y + ly + i][x + lx + j];
      sum += v > 255 ? 255 : v;
    }
  }
  return sum;
}

function render() {
  for(var i = 0; i < paperHeight / dy; i++) {
    for(var j = 0; j < paperWidth / dx; j++) {
      type(j * dx, i * dy, charvas[i][j]);
    }
  }
}

function type(x, y, c) {
  var ch = charMap[c];
  if(ch) {
    for(var i = 0; i < ch.height; i++) {
      for(var j = 0; j < ch.width; j++) {
        if(y + i >= paperHeight || x + i >= paperWidth) continue;
        // console.log(y+i, x + j);
        canvas[y + i][x + j] += ch.grayData[i][j];
        if(canvas[y + i][x + j] > 255) canvas[y + i][x + j] = 255;
      }
    }
  }
}


function outputTarget() {
  var out = new PNG({width: paperWidth, height: paperHeight});
  for(var i = 0; i < paperHeight; i++) {
    for(var j = 0; j < paperWidth; j++) {
      var offset = (paperWidth * i + j) << 2;
      out.data[offset++] = 255 - target[i][j];
      out.data[offset++] = 255 - target[i][j];
      out.data[offset++] = 255 - target[i][j];
      out.data[offset++] = 255;
    }
  }
  out.pack().pipe(fs.createWriteStream('target.png'));
}


function outputCanvas() {
  var out = new PNG({width: paperWidth, height: paperHeight});
  for(var i = 0; i < paperHeight; i++) {
    for(var j = 0; j < paperWidth; j++) {
      var offset = (paperWidth * i + j) << 2;
      out.data[offset++] = 255 - canvas[i][j];
      out.data[offset++] = 255 - canvas[i][j];
      out.data[offset++] = 255 - canvas[i][j];
      out.data[offset++] = 255;
    }
  }
  out.pack().pipe(fs.createWriteStream('out.png'));
}

function getGrayScale(data, width, x, y) {
  var offset = (width * y + x) << 2;
  return 255 - Math.floor((0.2126 * data[offset] + 0.7152 * data[offset + 1] + 0.0722 * data[offset + 2]) * data[offset + 3] / 255);
}

function print(chr) {
  var c = charMap[chr];
  var buf = '';
  for(var i = 0; i < c.height; i++) {
    for(var j = 0; j < c.width; j++) {
      // var val = getGrayScale(c.data, c.width, j, i);
      if(c.grayData[i][j] > 128){
        buf += ' ';
      }else {
        buf += '#';
      }
    }
    buf += '\n';
  }
  console.log(buf);
}

function clone(a) {
   return JSON.parse(JSON.stringify(a));
}
