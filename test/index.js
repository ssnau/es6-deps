require('babel/register');
var assert = require('assert');
var deps = require('../');
var file = function (name) {
  return __dirname + "/files/" + name;
}

describe('should get deps', function () {

  it('basic', function() {
    var data = deps(file('simple.js'));
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 3);
  });

  it('require b', function () {
    var data = deps(file('r-b.js'));
    assert.equal(data.length, 1);
    assert.deepEqual([
      file('b.js'),
    ], data);
  });
  it('import b', function () {
    var data = deps(file('i-b.js'));
    assert.equal(data.length, 1);
    assert.deepEqual([
      file('b.js'),
    ], data);
  });

  it('parse error', function () {
      assert.throws(function(){
        var data = deps(file('error.js'));
      });
  });

});
