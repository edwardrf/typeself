var fs      = require('fs');
var PNG     = require('pngjs').PNG;
var Q       = require('q');

module.exports = Raster = function(width, height){
  this.width = width;
  this.height = height;
  this.buf = [];
  for(var i = 0; i < width * height; i++) {
    this.buf.push(0);
  }
}

Raster.prototype.get = function(x, y) {
  return this.buf[y * this.width + x];
}

Raster.prototype.set = function(x, y, color) {
  this.buf[y * this.width + x] = color;
}

Raster.prototype.add = function(x, y, color) {
  this.buf[y * this.width + x] += color;
}

Raster.prototype.paint = function(x, y, raster) {
  for(var i = 0; i < raster.height; i++) {
    for(var j = 0; j < raster.width; j++) {
      var lx = x + j;
      var ly = y + i;
      this.buf[ly * this.width + lx] += raster.buf[i * raster.width + j];
    }
  }
}

Raster.prototype.unpaint = function(x, y, raster) {
  if(!raster){
    console.trace(raster);
  }
  for(var i = 0; i < raster.height; i++) {
    for(var j = 0; j < raster.width; j++) {
      var lx = x + j;
      var ly = y + i;
      this.buf[ly * this.width + lx] -= raster.buf[i * raster.width + j];
    }
  }
}

Raster.prototype.sample = function(x, y, size) {
  var sum = 0;
  for(var i = 0; i < size; i++) {
    for(var j = 0; j < size; j++) {
      val = this.get(x + j, y + i);
      sum += val > 255 ? 255 : val;
    }
  }
  return sum;
}

Raster.read = function(filename) {
  var deferred = Q.defer();
  fs.createReadStream(filename)
    .pipe(new PNG())
    .on('parsed', function(data) {
      var raster = new Raster(this.width, this.height);
      for(var i = 0; i < this.height; i++) {
        for(var j = 0; j < this.width; j++) {
          var offset = (this.width * i + j) << 2;
          var val = 255 - Math.round((0.2126 * data[offset] + 0.7152 * data[offset + 1] + 0.0722 * data[offset + 2]) * data[offset + 3] / 255);
          raster.set(j, i, val);
        }
      }
      deferred.resolve(raster);
    })
    .on('error', function(err) {
      deferred.reject(err);
    });
  return deferred.promise;
}

Raster.diff = function(ra, rb, x, y, w, h, size) {
  var plus = 0, minus = 0;
  for(var i = 0; i < h; i++) {
    for(var j = 0; j < w; j++) {
      var a = ra.sample(x + j, y + i, size);
      var b = rb.sample(x + j, y + i, size);
      if(a > b) {
        plus += a - b;
      }else {
        minus += b - a;
      }
    }
  }
  return [plus, minus];
}

Raster.prototype.print = function() {
  for(var i = 0; i < this.height; i++) {
    var buf = '';
    for(var j = 0; j < this.width; j++) {
      buf += this.get(j, i) + '\t';
    }
    console.log(buf);
  }
}

Raster.prototype.write = function(filename) {
  var deferred = Q.defer();
  var out = new PNG({width: this.width, height: this.height});
  var offset = 0;
  for(var i = 0; i < this.width * this.height; i++) {
      out.data[offset++] = 255 - this.buf[i];
      out.data[offset++] = 255 - this.buf[i];
      out.data[offset++] = 255 - this.buf[i];
      out.data[offset++] = 255;
  }

  var output = fs.createWriteStream(filename)
  output.on('finish', function(){
    deferred.resolve(output);
  });
  output.on('error', function(err){
    deferred.reject(err);
  });
  out.pack().pipe(output);
  return deferred.promise;
}
