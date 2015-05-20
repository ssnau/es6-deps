es6-deps
-------

A simple util to get dependency list of a es6/jsx file.

Install
-----

```
npm install es6-deps
```

Example
-----

Suppose you have 2 files, one is `a.js` with content:

```
var b = require('b')
```
another is `b.js` whose content is empty. Below is how we get the dependencies list of `a.js`:

```
var deps = require('es6-deps');
deps(__dirname + "/a.js", function (err, dependencies) {
  console.log(dependencies); // get ['{__dirname}/b.js', '{__dirname}/a.js']
});
```

License
-----

MIT
