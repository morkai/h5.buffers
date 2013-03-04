'use strict';

/**
 * A builder of dynamically sized `Buffer`s.
 *
 * @constructor
 * @property {number} length A number of pushed bytes.
 * @example
 * var builder = new BufferBuilder();
 *
 * builder
 *   .pushByte(0x01)
 *   .pushUInt16(12)
 *   .pushString('Hello World!');
 *
 * var buffer = builder.toBuffer();
 *
 * console.log(buffer);
 */
function BufferBuilder()
{
  /**
   * @type {number}
   */
  this.length = 0;

  /**
   * @private
   * @type {Array.<function(Buffer, number): number>}
   */
  this.data = [];
}

/**
 * Returns a new `Buffer` with all data pushed to this builder.
 *
 * The new `Buffer` will have the same length as the builder.
 *
 * @returns {Buffer} An instance of `Buffer` filled with all bytes pushed to
 * this builder.
 * @example
 * var buffer = builder.toBuffer();
 */
BufferBuilder.prototype.toBuffer = function()
{
  var buffer = new Buffer(this.length);

  this.data.reduce(function(offset, push)
  {
    return offset + push(buffer, offset);
  }, 0);

  return buffer;
};

/**
 * Appends the specified bits to this builder.
 *
 * A number of bytes corresponding to the following formula will be appended
 * to the builder:
 *
 *     var byteCount = Math.ceil(bitsArray.length / 8);
 *
 * If the number of bits is not a multiple of 8, then the remaining bits will
 * be set to `0`.
 *
 * Each 8 values from the array correspond to the 8 bits being appended to the
 * buffer as bytes. First value of the each octet is the least significant bit,
 * last value - the most significant bit.
 *
 * Truthy values become `1`'s and falsy values become `0`'s.
 *
 * For example, pushing the following array of 11 values:
 * ```
 *     [0, 1, 1, 0, 0, 1, 1, 1,
 *                     0, 1, 1]
 * ```
 * will result in 2 bytes being appended to the builder:
 * `0xE6`, because its bit representation is `11100110` and
 * `0x06`, because its bit representation is `00000011`.
 *
 * @param {Array.<boolean>} bitsArray An array of truthy and falsy values.
 * @returns {BufferBuilder} Self.
 * @throws {Error} If the specified argument is not an array.
 * @example
 * builder.pushBits([0, 0, 0, 0, 1, 1, 0, 1, 0, 1])
 * builder.pushBits((0xABCD).toString(2).split('').map(Number))
 */
BufferBuilder.prototype.pushBits = function(bitsArray)
{
  if (!Array.isArray(bitsArray))
  {
    throw new Error('Expected an array.');
  }

  var bitsCount = bitsArray.length;
  
  if (bitsCount === 0)
  {
    return this;
  }

  var byteCount = Math.ceil(bitsCount / 8);

  this.data.push(function(buffer, offset)
  {
    var bitIndex = 0;
    var byteValue = 0;

    for (var i = 0; i < bitsCount; ++i)
    {
      if (bitIndex !== 0 && bitIndex % 8 === 0)
      {
        buffer[offset++] = byteValue;

        bitIndex = 0;
        byteValue = bitsArray[i] ? 1 : 0;
      }
      else if (bitsArray[i])
      {
        byteValue |= Math.pow(2, bitIndex);
      }

      bitIndex += 1;
    }

    buffer[offset] = byteValue;

    return byteCount;
  });

  this.length += byteCount;

  return this;
};

/**
 * Appends the specified byte to this builder.
 *
 * Increases the length of the builder by 1.
 *
 * @param {number} byteValue A number between 0 and 255.
 * @returns {BufferBuilder} Self.
 * @throws {Error} If the specified argument is not a number between 0 and 255.
 * @example
 * builder.pushByte(0xFE);
 */
BufferBuilder.prototype.pushByte = function(byteValue)
{
  byteValue = parseInt(byteValue, 10);

  if (isNaN(byteValue) || byteValue < 0 || byteValue > 255)
  {
    throw new Error('Expected a number between 0 and 255.');
  }

  this.data.push(function(buffer, offset)
  {
    buffer[offset] = byteValue;

    return 1;
  });

  this.length += 1;

  return this;
};

/**
 * Appends the specified ASCII character to this builder.
 *
 * Increases the length of the builder by 1.
 *
 * @param {string} charValue An ASCII character.
 * @returns {BufferBuilder} Self.
 * @throws {ReferenceError} If no char value was specified.
 * @throws {TypeError} If the specified argument is not a string.
 * @throws {Error} If the specified argument is not an ASCII character.
 * @example
 * builder.pushChar('!');
 */
BufferBuilder.prototype.pushChar = function(charValue)
{
  var byteValue = charValue.charCodeAt(0);

  if (isNaN(byteValue) || byteValue < 0 || byteValue > 127)
  {
    throw new Error('Expected an ASCII character.');
  }

  return this.pushByte(byteValue);
};

/**
 * Appends the specified bytes to this builder.
 *
 * Increases the length of the builder by the length of the specified array.
 *
 * @param {Array.<number>} bytesArray An array of numbers between 0 and 255.
 * @returns {BufferBuilder} Self.
 * @throws {Error} If the specified argument is not an array.
 * @example
 * builder.pushBytes([0x00, 0x01, 0xAB, 0xCD]);
 */
BufferBuilder.prototype.pushBytes = function(bytesArray)
{
  if (!Array.isArray(bytesArray))
  {
    throw new Error('Expected an array.');
  }

  var bytesCount = bytesArray.length;

  if (bytesCount === 0)
  {
    return this;
  }

  this.data.push(function(buffer, offset)
  {
    for (var i = 0; i < bytesCount; ++i)
    {
      buffer[offset + i] = bytesArray[i];
    }

    return bytesCount;
  });

  this.length += bytesCount;

  return this;
};

/**
 * Appends bytes from the specified source `Buffer` to this builder.
 *
 * Increases the length of the builder by the specified source buffer.
 *
 * @param {Buffer} sourceBuffer An instance of `Buffer`.
 * @returns {BufferBuilder} Self.
 * @throws {Error} If the specified argument is not an instance of `Buffer`.
 * @example
 * builder.pushBuffer(new Buffer([0, 1, 2]));
 * builder.pushBuffer(new Buffer('Hello!'));
 */
BufferBuilder.prototype.pushBuffer = function(sourceBuffer)
{
  if (!Buffer.isBuffer(sourceBuffer))
  {
    throw new Error('Expected an instance of Buffer.');
  }

  if (sourceBuffer.length === 0)
  {
    return this;
  }

  this.data.push(function(targetBuffer, offset)
  {
    return sourceBuffer.copy(targetBuffer, offset, 0, sourceBuffer.length);
  });

  this.length += sourceBuffer.length;

  return this;
};

/**
 * Appends the specified string in the specified encoding to this builder.
 *
 * Increases the length of the builder by the byte length of the specified
 * string. Byte length is calculated using `Buffer.byteLength()` function.
 *
 * @param {string} stringValue A string value in the specified encoding.
 * @param {string} [encoding] An encoding of the specified string value.
 * Defaults to `utf8`.
 * @returns {BufferBuilder} Self.
 * @throws {Error} If the specified value is not a string.
 * @example
 * builder.pushString('Hęłłó!');
 * builder.pushString('Hello!', 'ascii');
 */
BufferBuilder.prototype.pushString = function(stringValue, encoding)
{
  if (typeof stringValue !== 'string')
  {
    throw new Error('Expected a string.');
  }

  if (stringValue.length === 0)
  {
    return this;
  }

  if (!encoding)
  {
    encoding = 'utf8';
  }

  this.data.push(function(buffer, offset)
  {
    return buffer.write(stringValue, offset, encoding);
  });

  this.length += Buffer.byteLength(stringValue, encoding);

  return this;
};

/**
 * Appends the specified string followed by NULL character (`\0`)
 * to this builder.
 *
 * Increases the length of the builder by the byte length of the specified
 * string value plus 1. Byte length is calculated using `Buffer.byteLength()`
 * function.
 *
 * @param {string} stringValue A string value in the specified encoding.
 * @param {string} [encoding] An encoding of the specified string value.
 * Defaults to `utf8`.
 * @returns {BufferBuilder} Self.
 * @throws {Error} If the specified value is not a string.
 * @example
 * builder.pushZeroString('Hęłłó!');
 * builder.pushZeroString('Hello!', 'ascii');
 */
BufferBuilder.prototype.pushZeroString = function(stringValue, encoding)
{
  return this.pushString(stringValue, encoding).pushByte(0);
};

/**
 * Appends the specified number as a signed 8-bit integer to this builder.
 *
 * Increases the length of the builder by 1.
 *
 * @param {number} numberValue A number between -128 and 127.
 * @returns {BufferBuilder} Self.
 * @throws {Error} If the specified value is not an 8-bit signed integer.
 * @example
 * builder.pushInt8(-100);
 * builder.pushInt8(10, true);
 */
BufferBuilder.prototype.pushInt8 = function(numberValue)
{
  numberValue = parseIntValue(numberValue, 0x7F, -0x80);

  this.data.push(function(buffer, offset)
  {
    buffer.writeInt8(numberValue, offset, true);

    return 1;
  });

  this.length += 1;

  return this;
};

/**
 * Appends the specified number as a signed 16-bit integer to this builder.
 *
 * Increases the length of the builder by 2.
 *
 * @param {number} numberValue A number between -32768 and 32767.
 * @param {boolean} [littleEndian] `TRUE` for little endian byte order;
 * `FALSE` for big endian. Defaults to `FALSE`.
 * @returns {BufferBuilder} Self.
 * @throws {Error} If the specified value is not a 16-bit signed integer.
 * @example
 * builder.pushInt16(12345);
 * builder.pushInt16(-12345, true);
 */
BufferBuilder.prototype.pushInt16 = function(numberValue, littleEndian)
{
  numberValue = parseIntValue(numberValue, 0x7FFF, -0x8000);

  this.data.push(function(buffer, offset)
  {
    buffer[littleEndian ? 'writeInt16LE' : 'writeInt16BE'](
      numberValue, offset, true
    );

    return 2;
  });

  this.length += 2;

  return this;
};

/**
 * Appends the specified number as a signed 32-bit integer to this builder.
 *
 * Increases the length of the builder by 4.
 *
 * @param {number} numberValue A number between -2147483648 and 2147483647.
 * @param {boolean} [littleEndian] `TRUE` for little endian byte order;
 * `FALSE` for big endian. Defaults to `FALSE`.
 * @returns {BufferBuilder} Self.
 * @throws {Error} If the specified value is not a 32-bit signed integer.
 * @example
 * builder.pushInt32(-123456789);
 * builder.pushInt32(123456789, true);
 */
BufferBuilder.prototype.pushInt32 = function(numberValue, littleEndian)
{
  numberValue = parseIntValue(numberValue, 0x7FFFFFFF, -0x80000000);

  this.data.push(function(buffer, offset)
  {
    buffer[littleEndian ? 'writeInt32LE' : 'writeInt32BE'](
      numberValue, offset, true
    );

    return 4;
  });

  this.length += 4;

  return this;
};

/**
 * Appends the specified number as an unsigned 8-bit integer to this builder.
 *
 * Increases the length of the builder by 1.
 *
 * @param {number} numberValue A number between 0 and 255.
 * @returns {BufferBuilder} Self.
 * @throws {Error} If the specified value is not an 8-bit unsigned integer.
 * @example
 * builder.pushUInt8(255);
 * builder.pushUInt8(66, true);
 */
BufferBuilder.prototype.pushUInt8 = function(numberValue)
{
  numberValue = parseIntValue(numberValue, 0xFF, 0x00);

  this.data.push(function(buffer, offset)
  {
    buffer.writeUInt8(numberValue, offset, true);

    return 1;
  });

  this.length += 1;

  return this;
};

/**
 * Appends the specified number as an unsigned 16-bit integer to this builder.
 *
 * Increases the length of the builder by 2.
 *
 * @param {number} numberValue A number between 0 and 65535.
 * @param {boolean} [littleEndian] `TRUE` for little endian byte order;
 * `FALSE` for big endian. Defaults to `FALSE`.
 * @returns {BufferBuilder} Self.
 * @throws {Error} If the specified value is not a 16-bit unsigned integer.
 * @example
 * builder.pushUInt16(256);
 * builder.pushUInt16(1, true);
 */
BufferBuilder.prototype.pushUInt16 = function(numberValue, littleEndian)
{
  numberValue = parseIntValue(numberValue, 0xFFFF, 0x0000);

  this.data.push(function(buffer, offset)
  {
    buffer[littleEndian ? 'writeUInt16LE' : 'writeUInt16BE'](
      numberValue, offset, true
    );

    return 2;
  });

  this.length += 2;

  return this;
};

/**
 * Appends the specified number as an unsigned 32-bit integer to this builder.
 *
 * Increases the length of the builder by 4.
 *
 * @param {number} numberValue A number between 0 and 4294967295.
 * @param {boolean} [littleEndian] `TRUE` for little endian byte order;
 * `FALSE` for big endian. Defaults to `FALSE`.
 * @returns {BufferBuilder} Self.
 * @throws {Error} If the specified value is not a 32-bit unsigned integer.
 * @example
 * builder.pushUInt32(4000111222);
 * builder.pushUInt32(4000111222, true);
 */
BufferBuilder.prototype.pushUInt32 = function(numberValue, littleEndian)
{
  numberValue = parseIntValue(numberValue, 0xFFFFFFFF, 0x00000000);

  this.data.push(function(buffer, offset)
  {
    buffer[littleEndian ? 'writeUInt32LE' : 'writeUInt32BE'](
      numberValue, offset, true
    );

    return 4;
  });

  this.length += 4;

  return this;
};

/**
 * Appends the specified number as a signed 32 bit floating-point number
 * defined in IEEE 754.
 *
 * Increases the length of the builder by 4.
 *
 * @param {number} numberValue A number between -3.4028234663852886e+38
 * and 3.4028234663852886e+38.
 * @param {boolean} [littleEndian] `TRUE` for little endian byte order;
 * `FALSE` for big endian. Defaults to `FALSE`.
 * @returns {BufferBuilder} Self.
 * @throws {Error} If the specified value is not a float.
 * @example
 * builder.pushFloat(123.456);
 * builder.pushFloat(-123.456);
 */
BufferBuilder.prototype.pushFloat = function(numberValue, littleEndian)
{
  numberValue = parseFloatValue(
    numberValue, 3.4028234663852886e+38, -3.4028234663852886e+38
  );

  this.data.push(function(buffer, offset)
  {
    buffer[littleEndian ? 'writeFloatLE' : 'writeFloatBE'](
      numberValue, offset, true
    );

    return 4;
  });

  this.length += 4;

  return this;
};

/**
 * Appends the specified number as a signed 64 bit floating-point number
 * defined in IEEE 754.
 *
 * Increases the length of the builder by 8.
 *
 * @param {number} numberValue A number between -1.7976931348623157e+308
 * and 1.7976931348623157e+308.
 * @param {boolean} [littleEndian] `TRUE` for little endian byte order;
 * `FALSE` for big endian. Defaults to `FALSE`.
 * @returns {BufferBuilder} Self.
 * @throws {Error} If the specified value is not a double.
 * @example
 * builder.pushDouble(12345.6789);
 * builder.pushDouble(-12345.99999);
 */
BufferBuilder.prototype.pushDouble = function(numberValue, littleEndian)
{
  numberValue = parseFloatValue(
    numberValue, 1.7976931348623157e+308, -1.7976931348623157e+308
  );

  this.data.push(function(buffer, offset)
  {
    buffer[littleEndian ? 'writeDoubleLE' : 'writeDoubleBE'](
      numberValue, offset, true
    );

    return 8;
  });

  this.length += 8;

  return this;
};

/**
 * @private
 * @param {number} value
 * @param {number} max
 * @param {number} min
 * @returns {number}
 * @throws {Error}
 */
function parseIntValue(value, max, min)
{
  value = parseInt(value, 10);

  if (isNaN(value) || value < min || value > max)
  {
    throw new Error('Expected an integer between ' + min + ' and ' + max + '.');
  }

  return value;
}

/**
 * @private
 * @param {number} value
 * @param {number} max
 * @param {number} min
 * @returns {number}
 * @throws {Error}
 */
function parseFloatValue(value, max, min)
{
  value = parseFloat(value, 10);

  if (isNaN(value) || value < min || value > max)
  {
    throw new Error(
      'Expected a floating-point number between ' + min + ' and ' + max + '.'
    );
  }

  return value;
}

module.exports = BufferBuilder;
