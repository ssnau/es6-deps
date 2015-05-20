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

Input the absolute path of your entry file and it will ouput a list of its dependencies for the provided callback.

Suppose you have 2 files, one is `a.js` while another is `b.js`. The content of  `a.js` is: `var b = require('b')` while `b.js` is empty.

```
var deps = require('es6-deps');
deps(__dirname + "/a.js", function (err, dependencies) {
  console.log(dependencies); // get ['{__dirname}/b.js', '{__dirname}/a.js']
});
```

License
-----

MIT
