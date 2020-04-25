var isdir = require('isdir');
var fs = require('fs');
var path = require('path');
var resolve = require('resolve');

var builtin = require('builtin-modules');

var regs = [
    /from\s+.*"([^"]+)"/,
    /from\s+.*'([^']+)'/,
    /require\s*\("([^"]*)"\)/,
    /require\s*\('([^']*)'\)/,
];

/*
 * remove star and comments
 */
function removeStarAndComments(str) {
    var text = str.split('\n')
        .map(function (line) {
            line = line
                .replace(/'[^']+\*[^']*'/g, "''")
                .replace(/"[^"]+\*[^"]*"/g, '""')
                // remove line comment
                .replace(/^\/\/.*$/gm, '')
                .replace(/(?:[^\\])\/\/.*$/gm, '')
            return line
        })
        .join('\n');
    // remove block comment
    text = text
        .replace(/^\/\*[\S\s]*?\*\//g, '')
        .replace(/(?:[^\\])\/\*[\S\s]*?\*\//g, '')
    return text
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
        var cache = this.cache;
        var self = this;
        var stack = [];

        function _get(content, filepath) {
            var deps = [];
            removeStarAndComments(content)
                .split('\n')
                .filter(line => line.indexOf('require') > -1 || line.indexOf('from') > -1 || line.indexOf('import') > -1)
                .forEach(function (line) {
                    for (let reg of regs) {
                        let match = line.match(reg);
                        if (!match) continue;
                        if (!match[1]) continue;
                        if (builtin.indexOf(match[1]) > -1) {
                            !ignoreBuiltin && deps.push(match[1]);
                            continue;
                        }
                        try {
                            let name = self.resolve(match[1], { basedir: path.dirname(filepath), extensions: ['.js', '.jsx', '.es6', '.ts', '.tsx'] });
                            if (ignorePattern.test(name)) return;
                            if (!fs.existsSync(name)) {
                                throw new Error(name + ' not exist when processing ' + filepath + ' and requring ' + match[1]);
                            }
                            if (stack.indexOf(name) > -1) {
                                //console.log('found pontential cyclic error! @', stack.indexOf(name) ,stack.concat(name).join(' -> '));
                                return; // cyclic, and ignore
                            }
                            stack.push(name);
                            try {
                                if (!cache[name]) cache[name] = _get(fs.readFileSync(name, 'utf-8'), name);
                            } catch (e) {
                                // do nothing
                            }
                            stack.pop(name);
                            if (cache[name]) {
                                deps.push.apply(deps, cache[name].concat(name));
                            }
                        } catch (e) {
                            if (supressNotFound) return;
                            throw e;
                        }
                    }
                });
            return deps;
        }
        content = content || fs.readFileSync(filepath, 'utf-8');
        stack.push(filepath);
        var deps = _get(content, filepath);
        return deps.filter((dep, i) => deps.indexOf(dep) === i);
    }
}

