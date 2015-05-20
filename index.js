var browserify = require('browserify');
var babelify = require('babelify');
var through = require('through2');
function run(cfg, callback) {
  var builder = browserify(cfg)
         .transform(babelify)
  var source = '';
  var deps = [];
  builder.pipeline.get('deps').push(through.obj(
     function write(row, enc, next) { deps.push(row.file);next();},
     function end() {callback(null, deps);}
  ));
  builder.bundle()
    .on('error', function (err) {callback(err); });
}

function go(cfg, cb) {
  switch (true) {
    case typeof cfg === 'string':
      return run({entries: [cfg]}, cb);
    break;
    case typeof cfg === 'object':
      return run(cfg, cb);
    break;
  }
};
module.exports = go;
