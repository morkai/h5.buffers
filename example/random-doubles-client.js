/**
 * Run (random-doubles-server must be up):
 *
 *     $ node random-doubles-client.js <server-port>
 *
 * Every 100-500 ms 1-4 random bytes will be sent to the server.
 * Server pushes data from all clients to `BufferQueueReader` and upon
 * receiving at least 8 bytes, shifts and prints a double floating-point
 * number corresponding to those bytes.
 */

var net = require('net');
var BufferBuilder = require('../lib/BufferBuilder');

var client = net.createConnection(parseInt(process.argv[2] || 54321, 10), function()
{
  console.log('Connected to server on port %d', client.remotePort);
});

sendRandomBuffer();

function sendRandomBuffer()
{
  var buffer = generateBuffer();

  client.write(buffer, function()
  {
    console.log('Sent %d bytes:', buffer.length, buffer);
  });

  setTimeout(sendRandomBuffer, 100 + Math.round(Math.random() * 400));
}

function generateBuffer()
{
  var builder = new BufferBuilder();

  for (var i = 0, l = 1 + Math.round(Math.random() * 4); i < l; ++i)
  {
    builder.pushByte(Math.round(Math.random() * 0xFF));
  }

  return builder.toBuffer();
}
