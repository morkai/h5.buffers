/**
 * Run:
 *
 *     $ node random-doubles-server.js <server-port>
 *
 * Pushes all received data to the instance of `BufferQueueReader`.
 * When the reader's length is at least 8 bytes, shifts its contents
 * as double floating-point numbers.
 */

var net = require('net');
var BufferQueueReader = require('../lib/BufferQueueReader');

var reader = new BufferQueueReader();

var server = net.createServer(function(client)
{
  var cid = 1 + Math.round(Math.random() * 123456789);

  console.log('Client %d connected', cid);

  client.on('data', function(buffer)
  {
    reader.push(buffer);

    process.nextTick(printDoubles);
  });
});

server.listen(parseInt(process.argv[2] || 54321, 10), function()
{
  console.log('Listening for random bytes at port %d...', server.address().port);
});

function printDoubles()
{
  while (reader.length >= 8)
  {
    console.log(reader.shiftDouble());
  }
}
