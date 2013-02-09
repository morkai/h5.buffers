# h5.buffers

A set of classes to simplify and extend reading from and writing to
node.js Buffers.

[![Build Status](https://travis-ci.org/morkai/h5.buffers.png)](https://travis-ci.org/morkai/h5.buffers)

## Installation

```
npm install h5.buffers
```

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

Check out JSDoc comment in source files or
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

Install the development dependencies:

```
cd h5.buffers/
npm install
```

And execute the `test` script:

```
npm test
```

## License

This project is released under the
[MIT License](https://raw.github.com/morkai/oriental-node-plumber/master/license.md).
