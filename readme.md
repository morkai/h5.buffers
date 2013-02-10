# h5.buffers

A set of classes to simplify and extend reading from and writing to
node.js Buffers.

[![Build Status](https://travis-ci.org/morkai/h5.buffers.png?branch=master)](https://travis-ci.org/morkai/h5.buffers)

## Installation

```
npm install h5.buffers
```

The npm package includes only the bare minimum required to use the library
(i.e. the `lib/` directory). Clone or download the repository if you need
local access to `doc/`, `example/` or `spec/` directories.

## Usage

Require the module:

```javascript
var buffers = require('h5.buffers');
```

Instantiate any class and look up its API:

```javascript
var reader = new buffers.BufferReader(new Buffer(256));
var builder = new buffers.BufferBuilder();
var queueReader = new buffers.BufferQueueReader();
```

## API

Check out JSDoc comment in the source files or
[doc/](https://github.com/morkai/h5.buffers/tree/master/doc/api/)
directory for API generated from these comments.

## Examples

Check out [example/](https://github.com/morkai/h5.buffers/tree/master/example)
and [spec/](https://github.com/morkai/h5.buffers/tree/master/spec)
directories.

## Tests

To run the tests, clone the repository:

```
git clone git://github.com/morkai/h5.buffers.git
```

Make sure [Grunt](http://gruntjs.com/) is installed globally:
(if not, then check out the Grunt's
[Getting Started guide](https://github.com/gruntjs/grunt/wiki/Getting-started)).

```
grunt -V
```

Install the development dependencies:

```
cd h5.buffers/
npm install
```

And execute the `grunt test` command.

To generate the code coverage report, execute the `grunt coverage` command.
A detailed code coverage report will be generated in the `build/coverage/`
directory and can be viewed in the browser by opening the
`build/coverage/lcov-report/index.html` file.

## License

This project is released under the
[MIT License](https://raw.github.com/morkai/buffers/master/license.md).
