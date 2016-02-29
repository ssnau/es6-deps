require('babel/register');
var assert = require('assert');
var Dep = require('../src');
var file = function (name) {
  return __dirname + "/files/" + name;
}
var dep = new Dep();
var deps = dep.getDeps.bind(dep);

describe('should get deps', function () {
   before(function() {
        dep.clearCache();
   });

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

  it('import b - multiline', function () {
    var data = deps(file('i-b2.js'));
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

  it('custom resolve', function () {
    var dep = new Dep({
        resolve: function (source, opt) {
            return require('resolve').sync(source.replace('@app', __dirname), opt);
        }
    });
    var data = dep.getDeps(file('alias.js'));
    assert.ok(data.indexOf(file('b.js')) > -1)
  });

  it('cylic', function () {
    var data = dep.getDeps(file('cylic.js'));
    assert.ok(data.indexOf(file('cylic2.js')) > -1)
    assert.ok(data.indexOf(file('cylic3.js')) > -1)
    assert.ok(data.length === 2);
  });
});
