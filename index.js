'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var isdir = require('isdir');
var fs = require('fs');
var path = require('path');
var _resolve = require('resolve');

var builtin = require('builtin-modules');

var regs = [/from\s+.*"([^"]+)"/, /from\s+.*'([^']+)'/, /require\s*\("([^"]*)"\)/, /require\s*\('([^']*)'\)/];

var cache = {};

function suffix_path(p) {
    var pt;
    var _arr = ['', '.js', '.jsx', '.es6'];
    for (var _i = 0; _i < _arr.length; _i++) {
        var suffix = _arr[_i];
        var pt = p + suffix;
        if (fs.existsSync(pt)) return pt;
    }
}

function safe(fn) {
    try {
        fn();
    } catch (e) {}
}

/*
 * remove star and comments
 */
function removeStarAndComments(str) {
    var text = str.split('\n').map(function (line) {
        line = line.replace(/'[^']+\*[^']*'/g, "''").replace(/"[^"]+\*[^"]*"/g, '""')
        // remove line comment
        .replace(/^\/\/.*$/gm, '').replace(/(?:[^\\])\/\/.*$/gm, '');
        return line;
    }).join('\n');
    // remove block comment
    text = text.replace(/^\/\*[\S\s]*?\*\//g, '').replace(/(?:[^\\])\/\*[\S\s]*?\*\//g, '');
    return text;
}

var _default = (function () {
    function _default(opt) {
        _classCallCheck(this, _default);

        this.cache = {};
        this.opt = opt || {};
    }

    _createClass(_default, [{
        key: 'clearCache',
        value: function clearCache() {
            this.cache = {};
        }
    }, {
        key: 'resolve',
        value: function resolve(source, option) {
            if (this.opt.resolve) return this.opt.resolve(source, option);
            return _resolve.sync(source, option);
        }
    }, {
        key: 'getDeps',
        value: function getDeps(filepath, content, opt) {
            opt = opt || {};
            var ignoreBuiltin = opt.ignoreBuiltin;
            var supressNotFound = opt.supressNotFound;
            var ignorePattern = opt.ignorePattern || /^\s+$/;
            var cache = this.cache;
            var self = this;
            var stack = [];

            function _get(content, filepath) {
                var deps = [];
                removeStarAndComments(content).split('\n').filter(function (line) {
                    return line.indexOf('require') > -1 || line.indexOf('from') > -1 || line.indexOf('import') > -1;
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
                                    try {
                                        var _name = self.resolve(match[1], { basedir: path.dirname(filepath), extensions: ['.js', '.jsx', '.es6'] });

                                        if (ignorePattern.test(_name)) return;
                                        if (!fs.existsSync(_name)) {
                                            throw new Error(_name + ' not exist when processing ' + filepath + ' and requring ' + match[1]);
                                        }
                                        if (stack.indexOf(_name) > -1) {
                                            //console.log('found pontential cyclic error! @', stack.indexOf(name) ,stack.concat(name).join(' -> '));
                                            return; // cyclic, and ignore
                                        }
                                        stack.push(_name);
                                        try {
                                            if (!cache[_name]) cache[_name] = _get(fs.readFileSync(_name, 'utf-8'), _name);
                                        } catch (e) {
                                            // do nothing
                                        }
                                        stack.pop(_name);
                                        if (cache[_name]) {
                                            deps.push.apply(deps, cache[_name].concat(_name));
                                        }
                                    } catch (e) {
                                        if (supressNotFound) return;
                                        throw e;
                                    }
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
            stack.push(filepath);
            var deps = _get(content, filepath);
            return deps.filter(function (dep, i) {
                return deps.indexOf(dep) === i;
            });
        }
    }]);

    return _default;
})();

exports['default'] = _default;
module.exports = exports['default'];
