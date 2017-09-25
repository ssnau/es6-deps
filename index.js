const fs      = require('fs');
const path    = require('path');
const Resolve = require('resolve');
const builtin = require('builtin-modules');
// token
const rImport  = /import\s+(.+)\s+from\s+['"]([^'"]+)['"]/;
const rRequire = /require\s*\(['"]([^'")]+)['"]\)/;
/**
 * parse module dependencies
 * 解析某单一文件中的外部依赖项
 * @param {*} name filename 
 * @param {*} options
 */
const parseDeps = (filename, { 
  resolve = Resolve.sync,
  ignoreBuiltin = true,
  ignoreNotFound = false,
  ignorePattern = /^\s+$/,
} = {}) => {
  return fs.readFileSync(filename, 'utf8')
    .replace(/(?:[^\\])\/\*[\S\s]*?\*\//g, '') // block-comment
    .replace(/(import.*)(\{[\s\S]+\})(.*from)/gm, (m, $1, $2, $3) => {
      return $1 + $2.replace(/\n/g, '') + $3; // normalize
    })
    .split('\n')
    .map(line => {
       // line-comment
      if (/^\s*\/\//.test(line))
        return;
      if (rImport.test(line)) {
        return rImport.exec(line)[2];
      }
      if (rRequire.test(line)) {
        return rRequire.exec(line)[1];
      }
    })
    .filter(dep => {
      if(!dep) return false;
      if(ignoreBuiltin && ~builtin.indexOf(dep)) return false;
      if(ignorePattern && ignorePattern.test(dep)) return false;
      return true;
    })
    .map(dep => {
      try{
        return resolve(dep, {
          basedir: path.dirname(filename),
          extensions: [ '.js', '.jsx', '.es6' ]
        });
      }catch(e){
        if(ignoreNotFound) return;
        throw e;
      }
    }).filter(Boolean);
};
/**
 * find module dependencies
 * 查找指定 module 的所有依赖项
 * @param {*} name 
 * @param {*} options 
 */
const findDeps = (name, options) => {
  let f; // file name
  const c = {}; // cache
  const d = []; // deps
  const q = [ name ]; // pending queue
  while (f = q.pop()) {
    if (!c[f]) {
      let r = parseDeps(f, options);
      r = r.filter(m => !c[m]);
      d.push.apply(d, r);
      q.push.apply(q, r);
      c[f] = r;
    }
  }
  return d.filter((x, i) => d.indexOf(x) === i);
};

/**
 * ES6Deps
 * @param {*} options 
 */
function ES6Deps(options){
  if(!(this instanceof ES6Deps))
    return new ES6Deps(options || {});
  return Object.assign(this, options);
};

ES6Deps.prototype.clearCache = function(){
  // do nothing
};

ES6Deps.prototype.getDeps = function(filename) {
  const { resolve } = this;
  return findDeps(filename, { resolve });
};

module.exports = ES6Deps;