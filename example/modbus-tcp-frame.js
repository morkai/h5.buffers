/**
 * Run:
 *
 *     $ node modbus-tcp-frame.js
 *
 * Builds a MODBUS TCP frame buffer using `BufferBuilder` and then feeds
 * it to `BufferReader` to extract the variables pushed to the builder.
 */

var BufferBuilder = require('../lib/BufferBuilder');
var BufferReader = require('../lib/BufferReader');

var transactionId = 0xABCD;
var protocolId = 0x0000;
var length = 6;
var unitId = 0x0F;
var functionCode = 0x03;
var address = 0x1000;
var quantity = 0x0001;

console.log();
console.log('Transaction ID  : %d', transactionId);
console.log('Protocol ID     : %d', protocolId);
console.log('Remaining length: %d', length);
console.log('Unit ID         : %d', unitId);
console.log('Function code   : %d', functionCode);
console.log('Starting address: %d', address);
console.log('Quantity        : %d', quantity);

var builder = new BufferBuilder();

builder
  .pushUInt16(transactionId)
  .pushUInt16(protocolId)
  .pushUInt16(length)
  .pushByte(unitId)
  .pushByte(functionCode)
  .pushUInt16(address)
  .pushUInt16(quantity);

var frame = builder.toBuffer();

console.log();
console.log('Frame (%d bytes):', frame.length, frame);
console.log();

var reader = new BufferReader(frame);

console.log('Transaction ID  : %d', reader.shiftUInt16());
console.log('Protocol ID     : %d', reader.shiftUInt16());
console.log('Remaining length: %d', reader.shiftUInt16());
console.log('Unit ID         : %d', reader.shiftByte());
console.log('Function code   : %d', reader.shiftByte());
console.log('Starting address: %d', reader.shiftUInt16());
console.log('Quantity        : %d', reader.shiftUInt16());

console.log();
console.log('Number of bytes remaining in the reader: %d', reader.length);
