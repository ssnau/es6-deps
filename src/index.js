var isdir = require('isdir');
var fs = require('fs');
var path = require('path');
var strip = require('strip-comments');
var resolve = require('resolve');

var builtin = require('builtin-modules');

var regs = [
    /from\s+.*"([^"]+)"/,
    /from\s+.*'([^']+)'/,
    /require\s*\("([^"]*)"\)/,
    /require\s*\('([^']*)'\)/,
];

var cache = {};

function suffix_path(p) {
    var pt;
    for (let suffix of ['', '.js', '.jsx', '.es6']) {
        var pt = p + suffix;
        if (fs.existsSync(pt)) return pt;
    }
}

function safe(fn) {
    try {
        fn();
    } catch (e) {

    }
}
/*
 * 消除所有带*的字符串,保证不会因为*而破坏strip-comments
 */
function rm_star(str) {
  return str.split('\n')
    .map(line => {
      return line
        .replace(/'[^']+\*[^']*'/g, "''")
        .replace(/"[^"]+\*[^"]*"/g, '""')
        .replace(/\/\*+\//, '')
    })
    .join('\n');
}
export default class {
    constructor(opt) {
        this.cache = {};
        this.opt = opt || {};
    }

    clearCache() {
        this.cache = {};
    }

    resolve(source, option) {
        if (this.opt.resolve) return this.opt.resolve(source, option);
        return resolve.sync(source, option);
    }

    getDeps(filepath, content, opt) {
        opt = opt || {};
        const ignoreBuiltin = opt.ignoreBuiltin;
        const supressNotFound = opt.supressNotFound;
        const ignorePattern = opt.ignorePattern || /^\s+$/;
        var status = {};
        var cache = this.cache;
        var self = this;
        status[filepath] = true;

        function _get(content, filepath) {
            var deps = [];
            strip(rm_star(content))
                .split('\n')
                .filter(line => line.indexOf('require') > -1 || line.indexOf('from') > -1 ||  line.indexOf('import') > -1)
                .forEach(function(line) {
                    for (let reg of regs) {
                        let match = line.match(reg); 
                        if (match && match[1]) {
                            if (builtin.indexOf(match[1]) > -1) {
                                !ignoreBuiltin && deps.push(match[1]);
                            } else {
                                try {
                                    let name = self.resolve(match[1], {basedir: path.dirname(filepath), extensions: ['.js', '.jsx', '.es6']});

                                    if (ignorePattern.test(name)) return;
                                    if (!fs.existsSync(name)) {
                                        throw new Error(name + ' not exist when processing ' + filepath + ' and requring ' + match[1]);
                                    }
                                    if (status[name]) return; // cyclic, and ignore
                                    status[name] = true;
                                    if (!cache[name]) cache[name] = _get(fs.readFileSync(name, 'utf-8'), name);
                                    deps.push.apply(deps, cache[name].concat(name));
                                } catch (e) {
                                    if (supressNotFound) return;
                                    throw e;
                                }
                            }
                        }
                    }
                });
            return deps;
        }
        content = content || fs.readFileSync(filepath, 'utf-8');
        return _get(content, filepath);
    }
}
