/**
 * Run:
 *
 *     $ node bits.js
 *
 * Converts 0xABCD number to bit array, uses it to build a buffer
 * with `BufferBuilder, then read those bits with `BufferReader` and
 * compare the input number to the read number.
 */
var BufferBuilder = require('../lib/BufferBuilder');
var BufferReader = require('../lib/BufferReader');

var number = 0xABCD;

console.log('number (10):', number.toString(10));
console.log('number (16):', number.toString(16));
console.log('number (2) :', number.toString(2));

var bitsString = number.toString(2);
var bitsArray = bitsString.split('').map(Number);

console.log('bits       :', bitsArray);

var buffer = new BufferBuilder().pushBits(bitsArray).toBuffer();

console.log('buffer     :', buffer);

var readBits = new BufferReader(buffer).readBits(0, 16).map(Number);

console.log('read bits  :', readBits);
console.log('read number:', parseInt(readBits.join(''), 2));
