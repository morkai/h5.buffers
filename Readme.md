# h5.buffers

A set of classes to simplify and extend reading from and writing to
node.js Buffers.

## How to install

    $ npm install h5.buffers

## How to use

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

To run tests, you'll need
[jasmine-node](https://github.com/mhevery/jasmine-node).

    $ npm install -g jasmine-node

Run tests by executing the following command:

    $ npm test h5.buffers

## License

See [License.md](https://raw.github.com/morkai/h5.buffers/master/License.md)
(it's MIT).
