'use strict';

var toBits = require('./helpers').toBits;

/**
 * A class providing extended functionality for reading `Buffer` instances.
 *
 * @constructor
 * @param {Buffer} buffer A buffer to wrap.
 * @throws {Error} If the specified `buffer` is not a `Buffer`.
 * @property {number} length The remaining length of the reader.
 * @example
 * var buffer = new Buffer(256);
 * var reader = new BufferReader(buffer);
 *
 * console.log('int16=', reader.shiftInt16());
 * console.log('uint32=', reader.shiftUInt32());
 * console.log('bits=', reader.readBits(0, 12));
 *
 * reader.skip(2);
 *
 * console.log('double=', reader.shiftDouble());
 */
function BufferReader(buffer)
{
  if (!Buffer.isBuffer(buffer))
  {
    throw new Error("Buffer reader expects an instance of Buffer.");
  }

  /**
   * @type {number}
   */
  this.length = buffer.length;

  /**
   * @private
   * @type {number}
   */
  this.offset = 0;

  /**
   * @private
   * @type {Buffer}
   */
  this.buffer = buffer;
}

/**
 * Skips the specified number of bytes.
 *
 * If the byte count was not specified or it's value is greater than the length
 * of the reader, skips all the bytes to the end.
 *
 * @param {number} [count] A number of bytes to skip.
 * Defaults to the reader's length.
 * @throws {Error} If the count is not a number greater than or equal to 0.
 * @example
 * reader.skip(10);
 */
BufferReader.prototype.skip = function(count)
{
  count = arguments.length === 0 ? this.length : parseInt(count, 10);

  if (isNaN(count) || count < 0)
  {
    throw new Error(
      "The byte count must be a number greater than or equal to 0."
    );
  }

  if (count > this.length)
  {
    count = this.length;
  }

  this.offset += count;
  this.length -= count;
};

/**
 * Returns a position of the next occurence of the specified byte after
 * the specified starting index.
 *
 * @param {number} searchElement A byte value to search for.
 * @param {number=0} fromIndex A starting index. Defaults to 0 (the beginning).
 * @returns {number} A position of the found element (starting at 0) or
 * -1 if the search element was not found.
 * @throws {Error} If the search element is not a number between 0x00 and 0xFF.
 * @throws {Error} If the starting index is not a number between 0 and
 * the reader's length.
 * @example
 * var index = reader.indexOf(0xAB, 10);
 */
BufferReader.prototype.indexOf = function(searchElement, fromIndex)
{
  searchElement = parseInt(searchElement, 10);

  if (isNaN(searchElement) || searchElement < 0x00 || searchElement > 0xFF)
  {
    throw new Error(
      "The search element must be a number between 0x00 and 0xFF."
    );
  }

  fromIndex = arguments.length >= 2 ? parseInt(fromIndex, 10) : 0;

  if (isNaN(fromIndex) || fromIndex < 0 || fromIndex > this.length)
  {
    throw new Error(
      "The search starting index must be a number " +
      "between 0 and the reader's length."
    );
  }

  for (var i = this.offset + fromIndex; i < this.length; ++i)
  {
    if (this.buffer[i] === searchElement)
    {
      return i - this.offset;
    }
  }

  return -1;
};

/**
 * Copies bytes from the reader to the specified target buffer.
 *
 * @param {Buffer} targetBuffer A buffer to copy to.
 * @param {number=0} targetStart A position at which writing to the buffer
 * should begin. Defaults to 0 (the beginning).
 * @param {number=0} sourceStart A position from which writing from the reader
 * should begin. Defaults to 0 (the beginning).
 * @param {number=this.length} sourceEnd A position at which writing from
 * the reader should end. Defaults to the end (the reader's length).
 * @returns {number} A number of bytes written.
 * @throws {Error} If the specified target buffer is not an instance of Buffer.
 * @throws {Error} If the specified target start index is not a number between
 * 0 and the target buffer's length.
 * @throws {Error} If the specified source start index is not a number between
 * 0 and the reader's length (exclusive).
 * @throws {Error} If the specified source end index is not a number between
 * 0 (exclusive) and the reader's length.
 * @throws {Error} If the specified source start index is greater than or
 * equal to the source end index.
 * @example
 * var buffer = new Buffer(10);
 *
 * reader.copy(buffer, 0);
 * reader.copy(buffer, 5, 4, 9);
 */
BufferReader.prototype.copy = function(
  targetBuffer, targetStart, sourceStart, sourceEnd)
{
  if (!Buffer.isBuffer(targetBuffer))
  {
    throw new Error("The target buffer must be an instance of Buffer.");
  }

  targetStart = arguments.length >= 2 ? parseInt(targetStart, 10) : 0;

  if (isNaN(targetStart)
    || targetStart < 0
    || targetStart > targetBuffer.length)
  {
    throw new Error(
      "The target starting index must be a number greater than " +
      "or equal to 0 and less than or equal to the target buffer's length."
    );
  }

  sourceStart = arguments.length >= 3 ? parseInt(sourceStart, 10) : 0;

  if (isNaN(sourceStart) || sourceStart < 0 || sourceStart >= this.length)
  {
    throw new Error(
      "The source starting index must be a number greater than " +
      "or equal to 0 and less than the reader's length."
    );
  }

  sourceEnd = arguments.length >= 4 ? parseInt(sourceEnd, 10) : this.length;

  if (isNaN(sourceEnd) || sourceEnd < 1 || sourceEnd > this.length)
  {
    throw new Error(
      "The source ending index must be a number greater than 0 " +
      "and less than or equal to the reader's length."
    );
  }

  if (sourceStart >= sourceEnd)
  {
    throw new Error(
      "The source start index must be less than the source end index."
    );
  }

  return this.buffer.copy(
    targetBuffer,
    targetStart,
    this.offset + sourceStart,
    this.offset + sourceEnd
  );
};

/**
 * Shifts an array of bits (boolean values) from the reader.
 *
 * Decreases the reader's length by a number of bytes that is needed to
 * extract the specified number of bits
 * (e.g. 4, 8 bits=1 byte, 9, 13, 16 bits=2 bytes etc.).
 *
 * @param {number} count A number of bits to shift.
 * Must be between 1 and the reader's length multiplied by 8.
 * @returns {Array.<boolean>} An array of bits.
 * @throws {Error} If the specified count is not a number between 1 and
 * the reader's length multiplied by 8.
 * @example
 * var bitsArray = reader.shiftBits(13);
 */
BufferReader.prototype.shiftBits = function(count)
{
  return toBits(this.shiftBytes(Math.ceil(count / 8)), count);
};

/**
 * Shifts a byte from the reader.
 *
 * Decreases the reader's length by 1.
 *
 * @returns {number} A number between 0x00 and 0xFF.
 * @throws {Error} If the reader is empty.
 * @example
 * var byteValue = reader.shiftByte();
 */
BufferReader.prototype.shiftByte = function()
{
  if (this.length === 0)
  {
    throw new Error("The reader is empty.");
  }

  this.length -= 1;

  return this.buffer[this.offset++];
};

/**
 * Shifts an ASCII character from the reader.
 *
 * Decreases the reader's length by 1.
 *
 * @returns {string} An ASCII character.
 * @throws {Error} If the reader is empty.
 * @example
 * var charValue = reader.shiftChar();
 */
BufferReader.prototype.shiftChar = function()
{
  return String.fromCharCode(this.shiftByte());
};

/**
 * Shifts the specified number of bytes from the reader.
 *
 * Decreases the reader's length by the specified byte count.
 *
 * @param {number} count A number of bytes to shift.
 * Must be between 1 and the reader's length.
 * @returns {Array.<number>} An array of bytes.
 * @throws {Error} If the specified count is not a number between 1 and
 * the reader's length.
 * @example
 * var bytesArray = reader.shiftBytes(6);
 */
BufferReader.prototype.shiftBytes = function(count)
{
  count = parseInt(count, 10);

  if (isNaN(count) || count < 1 || count > this.length)
  {
    throw new Error(
      "The byte count must be a number greater than 0 " +
      "and less than or equal to the reader's length."
    );
  }
  
  this.length -= count;

  var byteArray = [];

  while (count--)
  {
    byteArray.push(this.buffer[this.offset++]);
  }

  return byteArray;
};

/**
 * Shifts the specified number of bytes as an instance of Buffer.
 *
 * Decreases the reader's length by the specified byte count.
 *
 * @param {number} count A number of bytes to shift.
 * Must be between 1 and the reader's length.
 * @returns {Buffer} A buffer of the specified size.
 * @throws {Error} If the specified count is not a number between 1 and
 * the reader's length.
 * @example
 * var buffer = reader.shiftBuffer(10);
 */
BufferReader.prototype.shiftBuffer = function(count)
{
  return new Buffer(this.shiftBytes(count));
};

/**
 * Shifts the specified number of bytes as a string with
 * the specified encoding.
 *
 * Decreases the reader's length by the specified byte count.
 *
 * @param {number} length A number of bytes to shift.
 * Must be between 1 and the reader's length.
 * @param {string} [encoding] An encoding of the string. Defaults to `utf8`.
 * @returns {string} A string of the specified length.
 * @throws {Error} If the specified length is not a number between 1 and
 * the reader's length.
 * @throws {Error} If the specified encoding is not supported.
 * @example
 * var stringValue = reader.shiftString(12, 'ascii');
 */
BufferReader.prototype.shiftString = function(length, encoding)
{
  return this.shiftBuffer(length).toString(encoding || 'utf8');
};

/**
 * Shifts a string from the beginning of the reader until the first
 * occurence of the NULL character (\0).
 *
 * Decreases the reader's length by the returned string's length plus one.
 *
 * @param {string} [encoding] An encoding of the string. Defaults to `utf8`.
 * @returns {string} A string constructed from the shifted bytes or empty string
 * if NULL character could not be found.
 * @throws {Error} If the specified encoding is not supported.
 * @example
 * var stringValue = reader.shiftZeroString('utf8');
 */
BufferReader.prototype.shiftZeroString = function(encoding)
{
  var zeroIndex = this.indexOf(0);

  if (zeroIndex === -1)
  {
    return '';
  }

  var zeroString = this.shiftString(zeroIndex, encoding);

  this.skip(1);

  return zeroString;
};

/**
 * Shifts a signed 8 bit integer.
 *
 * Decreases the reader's length by one byte.
 *
 * @returns {number} A number between -128 and 127.
 * @throws {Error} If the reader is empty.
 * @example
 * var int8 = reader.shiftInt8();
 */
BufferReader.prototype.shiftInt8 = function()
{
  var value = this.readInt8(0);

  this.skip(1);
  
  return value;
};

/**
 * Shifts a signed 16 bit integer.
 *
 * Decreases the reader's length by two bytes.
 *
 * @param {boolean} [littleEndian] Whether to use little endian
 * instead of big endian.
 * @returns {number} A number between -32768 and 32767.
 * @throws {Error} If the reader's length is less than 2.
 * @example
 * var int16BE = reader.shiftInt16();
 * var int16LE = reader.shiftInt16(true);
 */
BufferReader.prototype.shiftInt16 = function(littleEndian)
{
  var value = this.readInt16(0, littleEndian);

  this.skip(2);

  return value;
};

/**
 * Shifts a signed 32 bit integer.
 *
 * Decreases the reader's length by four bytes.
 *
 * @param {boolean} [littleEndian] Whether to use little endian
 * instead of big endian.
 * @returns {number} A number between -2147483648 and 2147483647.
 * @throws {Error} If the reader's length is less than 4.
 * @example
 * var int32BE = reader.shiftInt32();
 * var int32LE = reader.shiftInt32(true);
 */
BufferReader.prototype.shiftInt32 = function(littleEndian)
{
  var value = this.readInt32(0, littleEndian);

  this.skip(4);

  return value;
};

/**
 * Shifts an unsigned 8 bit integer.
 *
 * Decreases the reader's length by one byte.
 *
 * @returns {number} A number between 0 and 255.
 * @throws {Error} If the reader is empty.
 * @example
 * var uint8 = reader.shiftUInt8();
 */
BufferReader.prototype.shiftUInt8 = function()
{
  var value = this.readUInt8(0);

  this.skip(1);

  return value;
};

/**
 * Shifts an unsigned 16 bit integer.
 *
 * Decreases the reader's length by two bytes.
 *
 * @param {boolean} [littleEndian] Whether to use little endian
 * instead of big endian.
 * @returns {number} A number between 0 and 65535.
 * @throws {Error} If the reader's length is less than 2.
 * @example
 * var uint16BE = reader.shiftUInt16();
 * var uint16LE = reader.shiftUInt16(true);
 */
BufferReader.prototype.shiftUInt16 = function(littleEndian)
{
  var value = this.readUInt16(0, littleEndian);

  this.skip(2);

  return value;
};

/**
 * Shifts an unsigned 32 bit integer.
 *
 * Decreases the reader's length by four bytes.
 *
 * @param {boolean} [littleEndian] Whether to use little endian
 * instead of big endian.
 * @returns {number} A number between 0 and 4294967295.
 * @throws {Error} If the reader's length is less than 4.
 * @example
 * var uint32BE = reader.shiftUInt32();
 * var uint32LE = reader.shiftUInt32(true);
 */
BufferReader.prototype.shiftUInt32 = function(littleEndian)
{
  var value = this.readUInt32(0, littleEndian);

  this.skip(4);

  return value;
};

/**
 * Shifts a signed 32 bit floating-point number as defined in IEEE 754.
 *
 * Decreases the reader's length by four bytes.
 *
 * @param {boolean} [littleEndian] Whether to use little endian
 * instead of big endian.
 * @returns {number} A 32 bit floating-point number.
 * @throws {Error} If the reader's length is less than 4.
 * @example
 * var floatBE = reader.shiftFloat();
 * var floatLE = reader.shiftFloat(true);
 */
BufferReader.prototype.shiftFloat = function(littleEndian)
{
  var value = this.readFloat(0, littleEndian);

  this.skip(4);

  return value;
};

/**
 * Shifts a signed 64 bit floating-point number as defined in IEEE 754.
 *
 * Decreases the reader's length by eight bytes.
 *
 * @param {boolean} [littleEndian] Whether to use little endian
 * instead of big endian.
 * @returns {number} A 64 bit floating-point number.
 * @throws {Error} If the reader's length is less than 8.
 * @example
 * var doubleBE = reader.shiftDouble();
 * var doubleLE = reader.shiftDouble(true);
 */
BufferReader.prototype.shiftDouble = function(littleEndian)
{
  var value = this.readDouble(0, littleEndian);

  this.skip(8);

  return value;
};

/**
 * Returns an array of bits (boolean values) starting at the specified offset.
 *
 * @param {number} offset A starting index.
 * Must be between 0 and the reader's length minus 1.
 * @param {number} count A number of bits to read. Must be between 1 and
 * the reader's length multiplied by 8 minus the starting index.
 * @returns {Array.<boolean>} An array of bits.
 * @throws {Error} If the specified count is not a number between 1 and
 * the reader's length multiplied by 8 minus the starting index.
 * @example
 * var bitsArray = reader.readBits(5, 13);
 */
BufferReader.prototype.readBits = function(offset, count)
{
  // @todo bit or bytes offset
  return toBits(this.readBytes(offset, Math.ceil(count / 8)), count);
};

/**
 * Returns a byte at the specified position.
 *
 * @param {number} offset A starting index.
 * Must be between 0 and the reader's length minus 1.
 * @returns {number} A number between 0x00 and 0xFF.
 * @throws {Error} If the reader is empty.
 * @example
 * var byteValue = reader.readByte(1);
 */
BufferReader.prototype.readByte = function(offset)
{
  offset = parseInt(offset, 10);

  if (isNaN(offset) || offset < 0 || offset >= this.length)
  {
    throw new Error(
      "The offset must be a number between 0 and the reader's length minus one."
    );
  }

  return this.buffer[this.offset + offset];
};

/**
 * Returns an ASCII character at the specified position.
 *
 * @param {number} offset A starting index.
 * Must be between 0 and the reader's length minus 1.
 * @returns {string} An ASCII character.
 * @throws {Error} If the specified offset exceeds the reader's boundries.
 * @example
 * var charValue = reader.readChar(4);
 */
BufferReader.prototype.readChar = function(offset)
{
  return String.fromCharCode(this.readByte(offset));
};

/**
 * Returns the specified number of bytes starting from the specified position.
 *
 * @param {number} offset A starting index.
 * Must be between 0 and the reader's length minus the specified count.
 * @param {number} count A number of bytes to read.
 * Must be between 1 and the reader's length minus the offset.
 * @returns {Array.<number>} An array of bytes.
 * @throws {Error} If the specified offset exceeds the reader's boundries.
 * @throws {Error} If the specified count is not a number between 1 and
 * the reader's length minus the offset.
 * @example
 * var bytesArray = reader.readBytes(0, 6);
 */
BufferReader.prototype.readBytes = function(offset, count)
{
  offset = parseInt(offset, 10);

  if (isNaN(offset) || offset < 0)
  {
    throw new Error("The offset must be a number greater than 0.");
  }

  count = parseInt(count, 10);

  if (isNaN(count) || count < 1)
  {
    throw new Error("The byte count must be a number greater than 0.");
  }

  if (offset + count > this.length)
  {
    throw new Error(
      "A sum of the offset and byte count must be less than " +
      "or equal to the reader's length."
    );
  }
  
  offset += this.offset;

  var byteArray = [];

  while (count--)
  {
    byteArray.push(this.buffer[offset++]);
  }

  return byteArray;
};

/**
 * Returns the specified number of bytes as an instance of Buffer
 * starting from the specified position.
 *
 * @param {number} offset A starting index.
 * Must be between 0 and the reader's length minus the specified count.
 * @param {number} count A number of bytes to read.
 * Must be between 1 and the reader's length minus the offset.
 * @returns {Buffer} A Buffer of bytes.
 * @throws {Error} If the specified offset exceeds the reader's boundries.
 * @throws {Error} If the specified count is not a number between 1 and
 * the reader's length minus the offset.
 * @example
 * var buffer = reader.readBuffer(5, 10);
 */
BufferReader.prototype.readBuffer = function(offset, count)
{
  return new Buffer(this.readBytes(offset, count));
};

/**
 * Returns the specified number of bytes as a string with
 * the specified encoding.
 *
 * @param {number} offset A starting index.
 * Must be between 0 and the reader's length minus the specified length.
 * @param {number} length A number of bytes to read.
 * Must be between 1 and the reader's length minus the offset.
 * @param {string} [encoding] An encoding of the string. Defaults to `utf8`.
 * @returns {string} A string of the specified length.
 * @throws {Error} If the specified offset exceeds the reader's boundries.
 * @throws {Error} If the specified length is not a number between 1 and
 * the reader's length.
 * @throws {Error} If the specified encoding is not supported.
 * @example
 * var stringValue = reader.readString(1, 12, 'ascii');
 */
BufferReader.prototype.readString = function(offset, length, encoding)
{
  return this.readBuffer(offset, length).toString(encoding || 'utf8');
};

/**
 * Returns a string from the specified offset until the first
 * occurence of the NULL character (\0).
 *
 * @param {number} offset A starting index.
 * Must be between 0 and the reader's length.
 * @param {string} [encoding] An encoding of the string. Defaults to `utf8`.
 * @returns {string} A string constructed from the read bytes or empty string
 * if NULL character could not be found.
 * @throws {Error} If the specified offset exceeds the reader's boundries.
 * @throws {Error} If the specified encoding is not supported.
 * @example
 * var stringValue = reader.readZeroString(0, 'utf8');
 */
BufferReader.prototype.readZeroString = function(offset, encoding)
{
  var zeroIndex = this.indexOf(0, offset);

  if (zeroIndex === -1 || zeroIndex - offset === 0)
  {
    return '';
  }

  return this.readString(offset, zeroIndex - offset, encoding);
};

/**
 * Returns a signed 8 bit integer at the specified position.
 *
 * @param {number} offset A starting index.
 * Must be between 0 and the reader's length minus 1.
 * @returns {number} A number between -128 and 127.
 * @throws {Error} If the specified offset exceeds the reader's boundries.
 * @throws {Error} If the reader is empty.
 * @example
 * var int8 = reader.readInt8(5);
 */
BufferReader.prototype.readInt8 = function(offset)
{
  return this.buffer.readInt8(this.offset + offset);
};

/**
 * Returns a signed 16 bit integer starting from the specified position.
 *
 * @param {number} offset A starting index.
 * Must be between 0 and the reader's length minus 2.
 * @param {boolean} [littleEndian] Whether to use little endian
 * instead of big endian.
 * @returns {number} A number between -32768 and 32767.
 * @throws {Error} If the specified offset exceeds the reader's boundries.
 * @example
 * var int16BE = reader.readInt16(0);
 * var int16LE = reader.readInt16(2, true);
 */
BufferReader.prototype.readInt16 = function(offset, littleEndian)
{
  return this.buffer[littleEndian ? 'readInt16LE' : 'readInt16BE'](
    this.offset + offset
  );
};

/**
 * Returns a signed 32 bit integer starting from the specified position.
 *
 * @param {number} offset A starting index.
 * Must be between 0 and the reader's length minus 4.
 * @param {boolean} [littleEndian] Whether to use little endian
 * instead of big endian.
 * @returns {number} A number between -2147483648 and 2147483647.
 * @throws {Error} If the specified offset exceeds the reader's boundries.
 * @example
 * var int32BE = reader.readInt32(0);
 * var int32LE = reader.readInt32(4, true);
 */
BufferReader.prototype.readInt32 = function(offset, littleEndian)
{
  return this.buffer[littleEndian ? 'readInt32LE' : 'readInt32BE'](
    this.offset + offset
  );
};

/**
 * Returns an unsigned 8 bit integer at the specified position.
 *
 * @param {number} offset A starting index.
 * Must be between 0 and the reader's length minus 1.
 * @returns {number} A number between 0 and 255.
 * @throws {Error} If the specified offset exceeds the reader's boundries.
 * @example
 * var uint8 = reader.readUInt8(0);
 */
BufferReader.prototype.readUInt8 = function(offset)
{
  return this.buffer.readUInt8(this.offset + offset);
};

/**
 * Returns an unsigned 16 bit integer starting from the specified position.
 *
 * @param {number} offset A starting index.
 * Must be between 0 and the reader's length minus 2.
 * @param {boolean} [littleEndian] Whether to use little endian
 * instead of big endian.
 * @returns {number} A number between 0 and 65535.
 * @throws {Error} If the specified offset exceeds the reader's boundries.
 * @example
 * var uint16BE = reader.readUInt16(0);
 * var uint16LE = reader.readUInt16(2, true);
 */
BufferReader.prototype.readUInt16 = function(offset, littleEndian)
{
  return this.buffer[littleEndian ? 'readUInt16LE' : 'readUInt16BE'](
    this.offset + offset
  );
};

/**
 * Returns an unsigned 32 bit integer starting from the specified position.
 *
 * @param {number} offset A starting index.
 * Must be between 0 and the reader's length minus 4.
 * @param {boolean} [littleEndian] Whether to use little endian
 * instead of big endian.
 * @returns {number} A number between 0 and 4294967295.
 * @throws {Error} If the specified offset exceeds the reader's boundries.
 * @example
 * var uint32BE = reader.readUInt32(0);
 * var uint32LE = reader.readUInt32(4, true);
 */
BufferReader.prototype.readUInt32 = function(offset, littleEndian)
{
  return this.buffer[littleEndian ? 'readUInt32LE' : 'readUInt32BE'](
    this.offset + offset
  );
};

/**
 * Returns a signed 32 bit floating-point number as defined in IEEE 754.
 *
 * @param {number} offset A starting index.
 * Must be between 0 and the reader's length minus 4.
 * @param {boolean} [littleEndian] Whether to use little endian
 * instead of big endian.
 * @returns {number} A 32 bit floating-point number.
 * @throws {Error} If the specified offset exceeds the reader's boundries.
 * @example
 * var floatBE = reader.readFloat(0, );
 * var floatLE = reader.readFloat(4, true);
 */
BufferReader.prototype.readFloat = function(offset, littleEndian)
{
  return this.buffer[littleEndian ? 'readFloatLE' : 'readFloatBE'](
    this.offset + offset
  );
};

/**
 * Returns a signed 64 bit floating-point number as defined in IEEE 754.
 *
 * @param {number} offset A starting index.
 * Must be between 0 and the reader's length minus 8.
 * @param {boolean} [littleEndian] Whether to use little endian
 * instead of big endian.
 * @returns {number} A 64 bit floating-point number.
 * @throws {Error} If the specified offset exceeds the reader's boundries.
 * @example
 * var doubleBE = reader.readDouble(0);
 * var doubleLE = reader.readDouble(8, true);
 */
BufferReader.prototype.readDouble = function(offset, littleEndian)
{
  return this.buffer[littleEndian ? 'readDoubleLE' : 'readDoubleBE'](
    this.offset + offset
  );
};

module.exports = BufferReader;
