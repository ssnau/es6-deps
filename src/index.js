var isdir = require('isdir');
var fs = require('fs');
var path = require('path');
var strip = require('strip-comments');

var builtin = require('builtin-modules');

var regs = [
    /import\s+.*"([^"]+)"/,
    /import\s+.*'([^']+)'/,
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

function _resolve(current, relpath) {
    var dirname = path.dirname(current);
    var nmdir;
    if (relpath.charAt(0) === '/') nmdir = relpath;
    if (relpath.charAt(0) === '.') nmdir = path.join(dirname, relpath);

    // find node_modules dir
    if (!nmdir) {
        var parts = dirname.split('/');
        while (parts.length) {
            var p = parts.join('/');
            var nmdir = suffix_path(path.join(p, 'node_modules', relpath));
            if (nmdir) {
                break;
            }
            parts.pop(); 
        }
    }

    if (!nmdir) throw new Error('cannot parse ' + relpath + ' when processing ' + current);
    if (!isdir(nmdir)) return nmdir;
    var pkg = require(path.join(nmdir, 'package.json'));
    var main = pkg.main || "index";
    return path.join(nmdir, main);
}

function resolve(current, filepath) {
    var p = _resolve(current, filepath);
    var pt = suffix_path(p);
    if (pt) return pt;
    throw new Error(p + " not exist when processing " + current + " and requiring " + filepath);
}

export default class {
    constructor() {
        this.cache = {};
    }

    clearCache() {
        this.cache = {};
    }

    getDeps(filepath, content, opt) {
        opt = opt || {};
        const ignoreBuiltin = opt.ignoreBuiltin;
        var status = {};
        var cache = this.cache;
        status[filepath] = true;

        function _get(content, filepath) {
            var deps = [];
            strip(content)
                .split('\n')
                .filter(line => line.indexOf('require') > -1 || line.indexOf('import') > -1)
                .forEach(function(line) {
                    for (let reg of regs) {
                        let match = line.match(reg); 
                        if (match && match[1]) {
                            if (builtin.indexOf(match[1]) > -1) {
                                !ignoreBuiltin && deps.push(match[1]);
                            } else {
                                let name = resolve(filepath, match[1]);
                                if (!fs.existsSync(name)) {
                                    throw new Error(name + ' not exist when processing ' + filepath + ' and requring ' + match[1]);
                                }
                                if (status[name]) return; // cyclic, and ignore
                                status[name] = true;
                                if (!cache[name]) cache[name] = _get(fs.readFileSync(name, 'utf-8'), name);
                                deps.push.apply(deps, cache[name].concat(name));
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
