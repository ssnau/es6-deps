var assert = require('assert');
var deps = require('../');
var file = function (name) {
  return __dirname + "/files/" + name;
}

describe('should get deps', function () {
  this.timeout(20*1000);

  it('basic', function(done) {
    deps(file('simple.js'), function(err, data) {
      assert.ok(Array.isArray(data));
      assert.ok(data.length > 3);
      done();
    });
  });

  it('require b', function (done) {
    deps(file('r-b.js'), function (err, data) {
      assert.equal(data.length, 2);
      assert.deepEqual([
        file('b.js'),
        file('r-b.js')
        ], data);
      done();
    });
  });
  it('import b', function (done) {
    deps(file('i-b.js'), function (err, data) {
      assert.equal(data.length, 2);
      assert.deepEqual([
        file('b.js'),
        file('i-b.js')
        ], data);
      done();
    });
  });

  it('parse error', function (done) {
    deps(file('error.js'), function (err, data) {
      console.log('called me');
      done();
    });
  });

});
