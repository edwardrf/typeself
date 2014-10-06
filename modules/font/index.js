var Q       = require('q');
var fs      = require('fs');
var Raster  = require('../raster');
var charMap = {};

var regFontFile = /.\.png/;
var ready = Q.defer();
var x = Q.defer();

var maxWidth = 0;
var maxHeight = 0;

module.exports = Font = {
  get: function(c) {
    if(!ready) return null;
  },
  whenReady: function() {
    return ready.promise;
  }
};

Font.chars = [];

Q.nfcall(fs.readdir, __dirname + '/images/').then(function(files) {
  return Q.all(files.map(function(filename){
    var c = filename.charAt(0);
    var r = Raster.read(__dirname + '/images/' + filename);
    r.then(function(red){
      Font[c] = red;
      Font.chars.push(c);
      if(red.width > maxWidth) maxWidth = red.width;
      if(red.height > maxHeight) maxHeight = red.height;
    })
    return r;
  }))
}).done(function(r){
  Font.width = maxWidth;
  Font.height = maxHeight;
  ready.resolve(r);
});
