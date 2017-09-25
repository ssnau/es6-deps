const assert = require('assert');
const Dep = require('..');
const file = function (name) {
  return __dirname + "/files/" + name;
}
const dep = new Dep();
const deps = dep.getDeps.bind(dep);

describe('should get deps', function () {
  before(function() {
      dep.clearCache();
  });

  it('basic', function() {
    const data = deps(file('simple.js'));
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 3);
  });

  it('complex deps', function () {
    const data = deps(file('complex.js'));
    assert.ok(data.length === 4);
  })

  it('comment deps', function () {
    const data = deps(file('comment.js'));
    assert.ok(data.length === 0);
  })

  it('require b', function () {
    const data = deps(file('r-b.js'));
    assert.equal(data.length, 1);
    assert.deepEqual([
      file('b.js'),
    ], data);
  });
  it('import b', function () {
    const data = deps(file('i-b.js'));
    assert.equal(data.length, 1);
    assert.deepEqual([
      file('b.js'),
    ], data);
  });

  it('import b - multiline', function () {
    const data = deps(file('i-b2.js'));
    assert.equal(data.length, 1);
    assert.deepEqual([
      file('b.js'),
    ], data);
  });
  it('parse error', function () {
      assert.throws(function(){
        const data = deps(file('error.js'));
      });
  });

  it('custom resolve', function () {
    const dep = new Dep({
        resolve: function (source, opt) {
            return require('resolve').sync(source.replace('@app', __dirname), opt);
        }
    });
    const data = dep.getDeps(file('alias.js'));
    assert.ok(data.indexOf(file('b.js')) > -1)
  });

  it('cylic', function () {
    const data = dep.getDeps(file('cylic.js'));
    assert.ok(data.indexOf(file('cylic2.js')) > -1)
    assert.ok(data.indexOf(file('cylic3.js')) > -1)
    assert.ok(data.length === 2);
  });

  it('cache not collide', function () {
    const dep = new Dep();
    const dataA = dep.getDeps(file('collide/a.js'));
    const dataB = dep.getDeps(file('collide/b.js'));
    assert.deepEqual(dataA.sort(), [
      file('collide/c.js'),
      file('collide/d.js'),
    ].sort());
    assert.deepEqual(dataA.sort(), dataB.sort());
  });
});
