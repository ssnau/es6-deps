'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var isdir = require('isdir');
var fs = require('fs');
var path = require('path');
var strip = require('strip-comments');

var builtin = require('builtin-modules');

var regs = [/import\s+.*"([^"]+)"/, /import\s+.*'([^']+)'/, /require\s*\("([^"]*)"\)/, /require\s*\('([^']*)'\)/];

var cache = {};

function _resolve(current, relpath) {
    var dirname = path.dirname(current);
    if (relpath.charAt(0) === '/') return relpath;
    if (relpath.charAt(0) === '.') return path.join(dirname, relpath);
    // find node_modules dir
    var parts = dirname.split('/');
    var nmdir;
    while (parts.length) {
        var p = parts.join('/');
        if (fs.existsSync(path.join(p, 'node_modules'))) {
            nmdir = path.join(p, 'node_modules');
            break;
        }
        parts.pop();
    }
    if (!nmdir) throw new Error('cannot find node_modules from ', current, ' when requiring ', relpath);

    var file = path.join(nmdir, relpath);
    if (!isdir(file)) return file;
    var pkg = require(path.join(file, 'package.json'));
    var main = pkg.main || "index";
    return path.join(file, main);
}

function resolve(current, filepath) {
    var p = _resolve(current, filepath);
    var pt;
    var _arr = ['', '.js', '.jsx', '.es6'];
    for (var _i = 0; _i < _arr.length; _i++) {
        var suffix = _arr[_i];
        var pt = p + suffix;
        if (fs.existsSync(pt)) return pt;
    }
    throw new Error(p + " not exist when processing " + current + " and requiring " + filepath);
}

var _default = (function () {
    function _default() {
        _classCallCheck(this, _default);

        this.cache = {};
    }

    _createClass(_default, [{
        key: 'clearCache',
        value: function clearCache() {
            this.cache = {};
        }
    }, {
        key: 'getDeps',
        value: function getDeps(filepath, content, opt) {
            opt = opt || {};
            var ignoreBuiltin = opt.ignoreBuiltin;
            var status = {};
            var cache = this.cache;
            status[filepath] = true;

            function _get(content, filepath) {
                var deps = [];
                strip(content).split('\n').filter(function (line) {
                    return line.indexOf('require') > -1 || line.indexOf('import') > -1;
                }).forEach(function (line) {
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = regs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var reg = _step.value;

                            var match = line.match(reg);
                            if (match && match[1]) {
                                if (builtin.indexOf(match[1]) > -1) {
                                    !ignoreBuiltin && deps.push(match[1]);
                                } else {
                                    var _name = resolve(filepath, match[1]);
                                    if (!fs.existsSync(_name)) {
                                        throw new Error(_name + ' not exist when processing ' + filepath + ' and requring ' + match[1]);
                                    }
                                    if (status[_name]) return; // cyclic, and ignore
                                    status[_name] = true;
                                    if (!cache[_name]) cache[_name] = _get(fs.readFileSync(_name, 'utf-8'), _name);
                                    deps.push.apply(deps, cache[_name].concat(_name));
                                }
                            }
                        }
                    } catch (err) {
                        _didIteratorError = true;
                        _iteratorError = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion && _iterator['return']) {
                                _iterator['return']();
                            }
                        } finally {
                            if (_didIteratorError) {
                                throw _iteratorError;
                            }
                        }
                    }
                });
                return deps;
            }
            content = content || fs.readFileSync(filepath, 'utf-8');
            return _get(content, filepath);
        }
    }]);

    return _default;
})();

exports['default'] = _default;
module.exports = exports['default'];
