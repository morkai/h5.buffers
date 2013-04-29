'use strict';

var toBits = require('./helpers').toBits;

/**
 * A class providing extended functionality for reading lists/streams of
 * `Buffer` instances.
 *
 * @constructor
 * @param {...Buffer} [bufferN] An optional buffer to push.
 * @throws {Error} If any of the specified buffers aren't instances of `Buffer`.
 * @property {number} length The remaining length of the reader.
 * @example
 * var reader = new BufferQueueReader(new Buffer(3), new Buffer(8));
 *
 * reader.push(new Buffer(10));
 * reader.push(new Buffer(5));
 * reader.push(new Buffer(16));
 *
 * console.log('int16=', reader.shiftInt16());
 * console.log('uint32=', reader.shiftUInt32());
 * console.log('bits=', reader.readBits(0, 12));
 *
 * reader.skip(2);
 *
 * console.log('double=', reader.shiftDouble());
 */
function BufferQueueReader()
{
  /**
   * @type {number}
   */
  this.length = 0;

  /**
   * @private
   * @type {number}
   */
  this.offset = 0;

  /**
   * @private
   * @type {Array.<Buffer>}
   */
  this.buffers = [];
  
  for (var i = 0, l = arguments.length; i < l; ++i)
  {
    this.push(arguments[i]);
  }
}

/**
 * Adds the specified buffers to the reader.
 *
 * Empty buffers are ignored.
 *
 * @param {...Buffer} bufferN An optional buffer to push.
 * @throws {Error} If any of the specified buffers aren't an instance
 * of `Buffer`.
 * @example
 * reader.push(new Buffer('Hello'), new Buffer(' '), new Buffer('World!'));
 */
BufferQueueReader.prototype.push = function()
{
  for (var i = 0, l = arguments.length; i < l; ++i)
  {
    var buffer = arguments[i];
    
    if (!Buffer.isBuffer(buffer))
    {
      throw new Error("The buffer must be an instance of Buffer.");
    }
    
    if (buffer.length === 0)
    {
      continue;
    }
    
    this.buffers.push(buffer);
    
    this.length += buffer.length;
  }
};

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
BufferQueueReader.prototype.skip = function(count)
{
  count = arguments.length ? parseInt(count, 10) : this.length;

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
  
  var buffer;
  
  while (this.buffers.length > 0
    && (buffer = this.buffers[0]).length <= this.offset)
  {
    this.buffers.shift();
    
    this.offset -= buffer.length;
  }
};

/**
 * Returns a position of the next occurence of the specified byte after
 * the specified starting index.
 *
 * @param {number} searchElement A byte value to search for.
 * @param {number} [fromIndex] A starting index. Defaults to 0 (the beginning).
 * @returns {number} A position of the found element (starting at 0)
 * or -1 if the search element was not found.
 * @throws {Error} If the search element is not a number between 0x00 and 0xFF.
 * @throws {Error} If the starting index is not a number between 0
 * and the reader's length.
 * @example
 * var index = reader.indexOf(0xFF, 20);
 */
BufferQueueReader.prototype.indexOf = function(searchElement, fromIndex)
{
  /*jshint maxstatements:22*/

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
      "The search starting index must be a number between 0 "
      + "and the reader's length."
    );
  }
  
  var offset = this.offset + fromIndex;
  var index = 0;
  var buffer = this.buffers[index];
  
  while (index < this.buffers.length && offset >= buffer.length)
  {
    offset -= buffer.length;
    buffer = this.buffers[++index];
  }

  var totalOffset = fromIndex;
  
  while (index < this.buffers.length)
  {
    if (buffer[offset] === searchElement)
    {
      return totalOffset;
    }
    
    offset += 1;
    totalOffset += 1;
    
    if (offset >= buffer.length)
    {
      offset = 0;
      buffer = this.buffers[++index];
    }
  }
  
  return -1;
};

/**
 * Copies bytes from the reader to the specified target buffer.
 *
 * @param {Buffer} targetBuffer A buffer to copy to.
 * @param {number} [targetStart] A position at which writing to the buffer
 * should begin. Defaults to 0 (the beginning).
 * @param {number} [sourceStart] A position from which writing from the reader
 * should begin. Defaults to 0 (the beginning).
 * @param {number} [sourceEnd] A position at which writing from
 * the reader should end. Defaults to the end (the reader's length).
 * @returns {number} A number of bytes written.
 * @throws {Error} If the specified target buffer is not an instance of Buffer.
 * @throws {Error} If the specified target start index is not a number between
 * 0 and the target buffer's length.
 * @throws {Error} If the specified source start index is not a number between
 * 0 and the reader's length (exclusive).
 * @throws {Error} If the specified source end index is not a number between
 * 0 (exclusive) and the reader's length.
 * @throws {Error} If the specified source start index is greater than
 * or equal to the source end index.
 * @example
 * var buffer = new Buffer(10);
 *
 * reader.copy(buffer, 5, 0, 5);
 */
BufferQueueReader.prototype.copy = function(
  targetBuffer, targetStart, sourceStart, sourceEnd)
{
  /*jshint maxstatements:32*/

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
      "The target starting index must be a number greater than or "
      + "equal to 0 and less than or equal to the target buffer's length."
    );
  }

  sourceStart = arguments.length >= 3 ? parseInt(sourceStart, 10) : 0;

  if (isNaN(sourceStart) || sourceStart < 0 || sourceStart >= this.length)
  {
    throw new Error(
      "The source starting index must be a number greater than or "
      + "equal to 0 and less than the reader's length."
    );
  }

  sourceEnd = arguments.length >= 4 ? parseInt(sourceEnd, 10) : this.length;

  if (isNaN(sourceEnd) || sourceEnd < 1 || sourceEnd > this.length)
  {
    throw new Error(
      "The source ending index must be a number greater than 0 and "
      + "less than or equal to the reader's length."
    );
  }

  if (sourceStart >= sourceEnd)
  {
    throw new Error(
      "The source start index must be less than the source end index."
    );
  }

  var offset = this.offset + sourceStart;
  var index = 0;
  var buffer;

  while ((buffer = this.buffers[index++]).length <= offset)
  {
    offset -= buffer.length;
  }

  var count = sourceEnd - sourceStart;

  if (buffer.length >= offset + count)
  {
    return buffer.copy(targetBuffer, targetStart, offset, offset + count);
  }

  var totalWritten = 0;

  while (count)
  {
    var written = buffer.copy(
      targetBuffer, targetStart, offset, Math.min(buffer.length, offset + count)
    );

    targetStart += written;
    totalWritten += written;
    count -= written;
    offset += written;

    if (offset >= buffer.length)
    {
      offset = 0;
      buffer = this.buffers[index++];
    }
  }

  return totalWritten;
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
BufferQueueReader.prototype.shiftBits = function(count)
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
BufferQueueReader.prototype.shiftByte = function()
{
  if (this.length === 0)
  {
    throw new Error("The reader is empty.");
  }

  var buffer = this.buffers[0];
  var byteValue = buffer[this.offset++];

  this.length -= 1;

  if (this.offset >= buffer.length)
  {
    this.buffers.shift();

    this.offset -= buffer.length;
  }

  return byteValue;
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
BufferQueueReader.prototype.shiftChar = function()
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
BufferQueueReader.prototype.shiftBytes = function(count)
{
  count = parseInt(count, 10);

  if (isNaN(count) || count < 1 || count > this.length)
  {
    throw new Error(
      "The byte count must be a number greater than 0 and "
      + "less than or equal to the reader's length."
    );
  }

  this.length -= count;

  var byteArray = [];

  while (count--)
  {
    var buffer = this.buffers[0];

    byteArray.push(buffer[this.offset++]);

    if (this.offset >= buffer.length)
    {
      this.buffers.shift();

      this.offset -= buffer.length;
    }
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
BufferQueueReader.prototype.shiftBuffer = function(count)
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
BufferQueueReader.prototype.shiftString = function(length, encoding)
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
BufferQueueReader.prototype.shiftZeroString = function(encoding)
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
BufferQueueReader.prototype.shiftInt8 = function()
{
  return toInt8(this.shiftByte());
};

/**
 * Shifts a signed 16 bit integer.
 *
 * Decreases the reader's length by two bytes.
 *
 * @param {boolean} littleEndian Whether to use little endian
 * instead of big endian.
 * @returns {number} A number between -32768 and 32767.
 * @throws {Error} If the reader's length is less than 2.
 * @example
 * var int16BE = reader.shiftInt16();
 * var int16LE = reader.shiftInt16(true);
 */
BufferQueueReader.prototype.shiftInt16 = function(littleEndian)
{
  return toInt16(shiftUInt(this, 2, littleEndian));
};

/**
 * Shifts a signed 32 bit integer.
 *
 * Decreases the reader's length by four bytes.
 *
 * @param {boolean} littleEndian Whether to use little endian
 * instead of big endian.
 * @returns {number} A number between -2147483648 and 2147483647.
 * @throws {Error} If the reader's length is less than 4.
 * @example
 * var int32BE = reader.shiftInt32();
 * var int32LE = reader.shiftInt32(true);
 */
BufferQueueReader.prototype.shiftInt32 = function(littleEndian)
{
  return toInt32(shiftUInt(this, 4, littleEndian));
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
BufferQueueReader.prototype.shiftUInt8 = function()
{
  return this.shiftByte();
};

/**
 * Shifts an unsigned 16 bit integer.
 *
 * Decreases the reader's length by two bytes.
 *
 * @param {boolean} littleEndian Whether to use little endian
 * instead of big endian.
 * @returns {number} A number between 0 and 65535.
 * @throws {Error} If the reader's length is less than 2.
 * @example
 * var uint16BE = reader.shiftUInt16();
 * var uint16LE = reader.shiftUInt16(true);
 */
BufferQueueReader.prototype.shiftUInt16 = function(littleEndian)
{
  return shiftUInt(this, 2, littleEndian);
};

/**
 * Shifts an unsigned 32 bit integer.
 *
 * Decreases the reader's length by four bytes.
 *
 * @param {boolean} littleEndian Whether to use little endian
 * instead of big endian.
 * @returns {number} A number between 0 and 4294967295.
 * @throws {Error} If the reader's length is less than 4.
 * @example
 * var uint32BE = reader.shiftUInt32();
 * var uint32LE = reader.shiftUInt32(true);
 */
BufferQueueReader.prototype.shiftUInt32 = function(littleEndian)
{
  return shiftUInt(this, 4, littleEndian);
};

/**
 * Shifts a signed 32 bit floating-point number as defined in IEEE 754.
 *
 * Decreases the reader's length by four bytes.
 *
 * @param {boolean} littleEndian Whether to use little endian
 * instead of big endian.
 * @returns {number} A 32 bit floating-point number.
 * @throws {Error} If the reader's length is less than 4.
 * @example
 * var floatBE = reader.shiftFloat();
 * var floatLE = reader.shiftFloat(true);
 */
BufferQueueReader.prototype.shiftFloat = function(littleEndian)
{
  var readFloat = littleEndian ? 'readFloatLE' : 'readFloatBE';

  return this.shiftBuffer(4)[readFloat](0, false);
};

/**
 * Shifts a signed 64 bit floating-point number as defined in IEEE 754.
 *
 * Decreases the reader's length by eight bytes.
 *
 * @param {boolean} littleEndian Whether to use little endian
 * instead of big endian.
 * @returns {number} A 64 bit floating-point number.
 * @throws {Error} If the reader's length is less than 8.
 * @example
 * var doubleBE = reader.shiftDouble();
 * var doubleLE = reader.shiftDouble(true);
 */
BufferQueueReader.prototype.shiftDouble = function(littleEndian)
{
  var readDouble = littleEndian ? 'readDoubleLE' : 'readDoubleBE';

  return this.shiftBuffer(8)[readDouble](0, false);
};

/**
 * Returns an array of bits (boolean values) starting at the specified offset.
 *
 * @param {number} offset A starting index.
 * Must be between 0 and the reader's length minus 1.
 * @param {number} count A number of bits to read. Must be between 1 and
 * the reader's length multiplied by 8 minus the starting index.
 * @returns {Array.<boolean>} An array of bits.
 * @throws {Error} If the specified count is not a number between 1 and the
 * reader's length multiplied by 8 minus the starting index.
 * @example
 * var bitsArray = reader.readBits(5, 13);
 */
BufferQueueReader.prototype.readBits = function(offset, count)
{
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
BufferQueueReader.prototype.readByte = function(offset)
{
  offset = parseInt(offset, 10);

  if (isNaN(offset) || offset < 0 || offset >= this.length)
  {
    throw new Error(
      "The offset must be a number between 0 and the reader's length minus one."
    );
  }

  offset += this.offset;

  var index = 0;
  var buffer;

  while ((buffer = this.buffers[index++]).length <= offset)
  {
    offset -= buffer.length;
  }

  return buffer[offset];
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
BufferQueueReader.prototype.readChar = function(offset)
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
BufferQueueReader.prototype.readBytes = function(offset, count)
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
      "A sum of the offset and byte count must be less than or "
      + "equal to the reader's length"
    );
  }

  offset += this.offset;

  var byteArray = [];
  var index = 0;
  var buffer;

  while ((buffer = this.buffers[index++]).length <= offset)
  {
    offset -= buffer.length;
  }

  while (count--)
  {
    byteArray.push(buffer[offset++]);
      
    if (offset >= buffer.length)
    {
      offset = 0;
      buffer = this.buffers[index++];
    }
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
BufferQueueReader.prototype.readBuffer = function(offset, count)
{
  /*jshint maxstatements:26*/

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
      "A sum of the offset and byte count must be less than or "
      + "equal to the reader's length"
    );
  }

  offset += this.offset;

  var index = 0;
  var buffer;

  while ((buffer = this.buffers[index++]).length <= offset)
  {
    offset -= buffer.length;
  }

  if (buffer.length >= offset + count)
  {
    return buffer.slice(offset, offset + count);
  }

  var resultBuffer = new Buffer(count);
  var resultOffset = 0;

  while (count)
  {
    var written = buffer.copy(
      resultBuffer,
      resultOffset,
      offset,
      Math.min(buffer.length, offset + count)
    );

    resultOffset += written;
    count -= written;
    offset += written;

    if (offset >= buffer.length)
    {
      offset = 0;
      buffer = this.buffers[index++];
    }
  }

  return resultBuffer;
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
BufferQueueReader.prototype.readString = function(offset, length, encoding)
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
 * @returns {string} A string constructed from the read bytes or empty string if
 * NULL character could not be found.
 * @throws {Error} If the specified offset exceeds the reader's boundries.
 * @throws {Error} If the specified encoding is not supported.
 * @example
 * var stringValue = reader.readZeroString(0, 'utf8');
 */
BufferQueueReader.prototype.readZeroString = function(offset, encoding)
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
BufferQueueReader.prototype.readInt8 = function(offset)
{
  return toInt8(this.readByte(offset));
};

/**
 * Returns a signed 16 bit integer starting from the specified position.
 *
 * @param {number} offset A starting index.
 * Must be between 0 and the reader's length minus 2.
 * @param {boolean} littleEndian Whether to use little endian
 * instead of big endian.
 * @returns {number} A number between -32768 and 32767.
 * @throws {Error} If the specified offset exceeds the reader's boundries.
 * @example
 * var int16BE = reader.readInt16(0);
 * var int16LE = reader.readInt16(2, true);
 */
BufferQueueReader.prototype.readInt16 = function(offset, littleEndian)
{
  return toInt16(readUInt(this, offset, 2, littleEndian));
};

/**
 * Returns a signed 32 bit integer starting from the specified position.
 *
 * @param {number} offset A starting index.
 * Must be between 0 and the reader's length minus 4.
 * @param {boolean} littleEndian Whether to use little endian
 * instead of big endian.
 * @returns {number} A number between -2147483648 and 2147483647.
 * @throws {Error} If the specified offset exceeds the reader's boundries.
 * @example
 * var int32BE = reader.readInt32(0);
 * var int32LE = reader.readInt32(4, true);
 */
BufferQueueReader.prototype.readInt32 = function(offset, littleEndian)
{
  return toInt32(readUInt(this, offset, 4, littleEndian));
};

/**
 * Returns an unsigned 8 bit integer at the specified position.
 *
 * @param {number} offset A starting index. Must be between 0 and
 * the reader's length minus 1.
 * @returns {number} A number between 0 and 255.
 * @throws {Error} If the specified offset exceeds the reader's boundries.
 * @example
 * var uint8 = reader.readUInt8(0);
 */
BufferQueueReader.prototype.readUInt8 = function(offset)
{
  return this.readByte(offset);
};

/**
 * Returns an unsigned 16 bit integer starting from the specified position.
 *
 * @param {number} offset A starting index.
 * Must be between 0 and the reader's length minus 2.
 * @param {boolean} littleEndian Whether to use little endian
 * instead of big endian.
 * @returns {number} A number between 0 and 65535.
 * @throws {Error} If the specified offset exceeds the reader's boundries.
 * @example
 * var uint16BE = reader.readUInt16(0);
 * var uint16LE = reader.readUInt16(2, true);
 */
BufferQueueReader.prototype.readUInt16 = function(offset, littleEndian)
{
  return readUInt(this, offset, 2, littleEndian);
};

/**
 * Returns an unsigned 32 bit integer starting from the specified position.
 *
 * @param {number} offset A starting index.
 * Must be between 0 and the reader's length minus 4.
 * @param {boolean} littleEndian Whether to use little endian
 * instead of big endian.
 * @returns {number} A number between 0 and 4294967295.
 * @throws {Error} If the specified offset exceeds the reader's boundries.
 * @example
 * var uint32BE = reader.readUInt32(0);
 * var uint32LE = reader.readUInt32(4, true);
 */
BufferQueueReader.prototype.readUInt32 = function(offset, littleEndian)
{
  return readUInt(this, offset, 4, littleEndian);
};

/**
 * Returns a signed 32 bit floating-point number as defined in IEEE 754.
 *
 * @param {number} offset A starting index.
 * Must be between 0 and the reader's length minus 4.
 * @param {boolean} littleEndian Whether to use little endian
 * instead of big endian.
 * @returns {number} A 32 bit floating-point number.
 * @throws {Error} If the specified offset exceeds the reader's boundries.
 * @example
 * var floatBE = reader.readFloat(0);
 * var floatLE = reader.readFloat(4, true);
 */
BufferQueueReader.prototype.readFloat = function(offset, littleEndian)
{
  var readFloat = littleEndian ? 'readFloatLE' : 'readFloatBE';

  return this.readBuffer(offset, 4)[readFloat](0, false);
};

/**
 * Returns a signed 64 bit floating-point number as defined in IEEE 754.
 *
 * @param {number} offset A starting index.
 * Must be between 0 and the reader's length minus 8.
 * @param {boolean} littleEndian Whether to use little endian
 * instead of big endian.
 * @returns {number} A 64 bit floating-point number.
 * @throws {Error} If the specified offset exceeds the reader's boundries.
 * @example
 * var doubleBE = reader.readDouble(0);
 * var doubleLE = reader.readDouble(8, true);
 */
BufferQueueReader.prototype.readDouble = function(offset, littleEndian)
{
  var readDouble = littleEndian ? 'readDoubleLE' : 'readDoubleBE';

  return this.readBuffer(offset, 8)[readDouble](0, false);
};

/**
 * @private
 * @param {BufferQueueReader} reader
 * @param {number} size
 * @param {boolean} littleEndian
 * @returns {number}
 */
function shiftUInt(reader, size, littleEndian)
{
  if (reader.length < size)
  {
    throw new Error("The reader's length is less than " + size + " bytes.");
  }

  reader.length -= size;

  var value = 0;
  var shift = -8;

  while (size--)
  {
    var buffer = reader.buffers[0];

    if (littleEndian)
    {
      value += ((buffer[reader.offset++] << (shift += 8)) >>> 0);
    }
    else
    {
      value = ((value << 8) >>> 0) + buffer[reader.offset++];
    }

    if (reader.offset >= buffer.length)
    {
      reader.offset -= reader.buffers.shift().length;
    }
  }

  return value;
}

/**
 * @private
 * @param {BufferQueueReader} reader
 * @param {number} offset
 * @param {number} size
 * @param {boolean} littleEndian
 * @returns {number}
 * @throws {Error}
 */
function readUInt(reader, offset, size, littleEndian)
{
  offset = parseInt(offset, 10);

  if (isNaN(offset) || offset < 0 || offset + size > reader.length)
  {
    throw new Error(
      "The offset must be a number between 0 and the reader's length minus 2."
    );
  }

  offset += reader.offset;

  var index = 0;
  var buffer;

  while ((buffer = reader.buffers[index++]).length <= offset)
  {
    offset -= buffer.length;
  }

  var value = 0;
  var shift = -8;

  while (size--)
  {
    if (littleEndian)
    {
      value += ((buffer[offset++] << (shift += 8)) >>> 0);
    }
    else
    {
      value = ((value << 8) >>> 0) + buffer[offset++];
    }

    if (offset >= buffer.length)
    {
      offset = 0;
      buffer = reader.buffers[index++];
    }
  }

  return value;
}

/**
 * @private
 * @param {number} uInt8
 * @returns {number}
 */
function toInt8(uInt8)
{
  return uInt8 & 0x80 ? (0x100 - uInt8) * -1 : uInt8;
}

/**
 * @private
 * @param {number} uInt16
 * @returns {number}
 */
function toInt16(uInt16)
{
  return uInt16 & 0x8000 ? (0x10000 - uInt16) * -1 : uInt16;
}

/**
 * @private
 * @param {number} uInt32
 * @returns {number}
 */
function toInt32(uInt32)
{
  return uInt32 & 0x80000000 ? (0x100000000 - uInt32) * -1 : uInt32;
}

module.exports = BufferQueueReader;
