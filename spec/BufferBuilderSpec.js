var BufferBuilder = require('../lib/BufferBuilder');

describe("BufferBuilder", function()
{
  beforeEach(function()
  {
    this.addMatchers({
      toBeEqualToBuffer: function(expectedBuffer)
      {
        var actualBuffer = this.actual;
        
        if (actualBuffer.length !== expectedBuffer.length)
        {
          return false;
        }
        
        for (var i = 0, l = expectedBuffer.length; i < l; ++i)
        {
          if (expectedBuffer[i] !== actualBuffer[i])
          {
            return false;
          }
        }

        return true;
      }
    });
  });

  it("should be empty after instantiation", function()
  {
    expect(new BufferBuilder().length).toBe(0);
  });

  describe("pushBits", function()
  {
    it("should throw if the specified argument is not an array", function()
    {
      var builder = new BufferBuilder();

      expect(function() { builder.pushBits(1); }).toThrow();
    });

    it("should do nothing if empty array is pushed", function()
    {
      var builder = new BufferBuilder();

      builder.pushBits([]);

      expect(builder.length).toBe(0);
    });

    it("should return self", function()
    {
      var builder = new BufferBuilder();

      expect(builder.pushBits([1, 0, 1])).toBe(builder);
    });

    it("should increase the length of the builder by the number of bytes that can contain the pushed bits", function()
    {
      var builder = new BufferBuilder();

      expect(builder.pushBits([1]).length).toBe(1);
      expect(builder.pushBits([1, 0, 1]).length).toBe(1 + 1);
      expect(builder.pushBits([1, 0, 1, 1, 0, 0, 0, 1]).length).toBe(2 + 1);
      expect(builder.pushBits([1, 0, 1, 1, 0, 0, 0, 1, 1]).length).toBe(3 + 2);
    });

    it("should convert 8 zeros to 0 byte", function()
    {
      var builder = new BufferBuilder();

      builder.pushBits([0, 0, 0, 0, 0, 0, 0, 0]);

      expect(builder.toBuffer()).toBeEqualToBuffer([0]);
    });

    it("should convert 8 ones to 255 byte", function()
    {
      var builder = new BufferBuilder();

      builder.pushBits([1, 1, 1, 1, 1, 1, 1, 1]);

      expect(builder.toBuffer()).toBeEqualToBuffer([255]);
    });

    it("should treat each eight elements as reversed bits in a byte", function()
    {
      var builder = new BufferBuilder();

      builder.pushBits([
        1, 0, 1, 1, 0, 0, 0, 1,
        1, 0, 1, 1, 0, 1, 1, 0,
        1, 0, 1, 0
      ]);

      expect(builder.toBuffer()).toBeEqualToBuffer([
        parseInt('10001101', 2),
        parseInt('01101101', 2),
        parseInt('0101', 2)
      ]);
    });
  });

  describe("pushByte", function()
  {
    it("should throw if the specified argument is not a number between 0 and 255", function()
    {
      var builder = new BufferBuilder();

      expect(function() { builder.pushByte('one'); }).toThrow();
      expect(function() { builder.pushByte(-7); }).toThrow();
      expect(function() { builder.pushByte(1234); }).toThrow();
    });

    it("should return self", function()
    {
      var builder = new BufferBuilder();

      expect(builder.pushByte(0)).toBe(builder);
    });

    it("should increase the length of the builder by 1", function()
    {
      var builder = new BufferBuilder();

      expect(builder.pushByte(0xAB).length).toBe(1);
    });

    it("should append the specified byte to the end of the result buffer", function()
    {
      var builder = new BufferBuilder();

      builder
        .pushByte(0x00)
        .pushByte(0xAB)
        .pushByte(0xFF);

      expect(builder.toBuffer()).toBeEqualToBuffer([0x00, 0xAB, 0xFF]);
    });
  });

  describe("pushChar", function()
  {
    it("should throw if the specified argument is not an ASCII character", function()
    {
      var builder = new BufferBuilder();

      expect(function() { builder.pushChar(); }).toThrow();
      expect(function() { builder.pushChar(0); }).toThrow();
      expect(function() { builder.pushChar([]); }).toThrow();
      expect(function() { builder.pushChar(''); }).toThrow();
      expect(function() { builder.pushChar(String.fromCharCode(200)); }).toThrow();
    });

    it("should return self", function()
    {
      var builder = new BufferBuilder();

      expect(builder.pushChar('a')).toBe(builder);
    });

    it("should increase the length of the builder by 1", function()
    {
      var builder = new BufferBuilder();

      expect(builder.pushChar('b').length).toBe(1);
    });

    it("should append the specified character's code as byte to the end of the result buffer", function()
    {
      var builder = new BufferBuilder();

      builder
        .pushChar('2')
        .pushChar('+')
        .pushChar('2')
        .pushChar('=')
        .pushChar('4');

      expect(builder.toBuffer()).toBeEqualToBuffer([0x32, 0x2B, 0x32, 0x3D, 0x34]);
    });
  });

  describe("pushBytes", function()
  {
    it("should throw if the specified argument is not an array", function()
    {
      var builder = new BufferBuilder();

      expect(function() { builder.pushBytes(1); }).toThrow();
    });

    it("should do nothing if empty array is pushed", function()
    {
      var builder = new BufferBuilder();

      builder.pushBytes([]);

      expect(builder.length).toBe(0);
    });

    it("should return self", function()
    {
      var builder = new BufferBuilder();

      expect(builder.pushBytes([1, 0, 1])).toBe(builder);
    });

    it("should increase the length of the builder by the length of the specified array", function()
    {
      var builder = new BufferBuilder();

      expect(builder.pushBytes([1, 0, 1, 0]).length).toBe(4);
    });

    it("should append the specified bytes to the end of the result buffer", function()
    {
      var builder = new BufferBuilder();

      builder.pushBytes([0, 1, 2, 3, 4]);

      expect(builder.toBuffer()).toBeEqualToBuffer([0, 1, 2, 3, 4]);
    });
  });

  describe("pushBuffer", function()
  {
    it("should throw if the specified argument is not an instance of Buffer", function()
    {
      var builder = new BufferBuilder();

      expect(function() { builder.pushBuffer(1); }).toThrow();
    });

    it("should do nothing if the specified buffer is empty", function()
    {
      var builder = new BufferBuilder();

      builder.pushBuffer(new Buffer(0));

      expect(builder.length).toBe(0);
    });

    it("should return self", function()
    {
      var builder = new BufferBuilder();

      expect(builder.pushBuffer(new Buffer([1, 0, 1]))).toBe(builder);
    });

    it("should increase the length of the builder by the length of the specified array", function()
    {
      var builder = new BufferBuilder();

      expect(builder.pushBuffer(new Buffer([1, 0, 1, 0])).length).toBe(4);
    });

    it("should append the specified bytes to the end of the result buffer", function()
    {
      var builder = new BufferBuilder();

      builder.pushBuffer(new Buffer([0, 1, 2, 3, 4]));

      expect(builder.toBuffer()).toBeEqualToBuffer([0, 1, 2, 3, 4]);
    });
  });

  describe("pushString", function()
  {
    it("should throw if the specified argument is not a string", function()
    {
      var builder = new BufferBuilder();

      expect(function() { builder.pushString(1); }).toThrow();
    });

    it("should do nothing if the specified string is empty", function()
    {
      var builder = new BufferBuilder();

      builder.pushString('');

      expect(builder.length).toBe(0);
    });

    it("should return self", function()
    {
      var builder = new BufferBuilder();

      expect(builder.pushString('123')).toBe(builder);
    });

    it("should increase the length of the builder by the length of the specified ASCII string", function()
    {
      var builder = new BufferBuilder();

      expect(builder.pushString('0123456789').length).toBe(10);
    });

    it("should increase the length of the builder by the byte length of the specified string", function()
    {
      var builder = new BufferBuilder();

      expect(builder.pushString('Łukąśź').length).toBe(Buffer.byteLength('Łukąśź'));
    });

    it("should append the specified bytes to the end of the result buffer", function()
    {
      var builder = new BufferBuilder();

      builder.pushString('Łukasz').pushString('Walukiewicz');

      expect(builder.toBuffer()).toBeEqualToBuffer(new Buffer('ŁukaszWalukiewicz'));
    });
  });

  describe("pushZeroString", function()
  {
    it("should throw if the specified argument is not a string", function()
    {
      var builder = new BufferBuilder();

      expect(function() { builder.pushZeroString(1); }).toThrow();
    });

    it("should only append byte 0 if the specified string is empty", function()
    {
      var builder = new BufferBuilder();

      builder.pushZeroString('');

      expect(builder.toBuffer()).toBeEqualToBuffer([0]);
    });

    it("should return self", function()
    {
      var builder = new BufferBuilder();

      expect(builder.pushZeroString('123')).toBe(builder);
    });

    it("should increase the length of the builder by the byte length of the specified string plus 1", function()
    {
      var builder = new BufferBuilder();

      expect(builder.pushZeroString('Łukąśź').length).toBe(Buffer.byteLength('Łukąśź') + 1);
    });

    it("should append the specified string followed by byte 0 to the end of the result buffer", function()
    {
      var builder = new BufferBuilder();

      builder.pushZeroString('Łukasz').pushZeroString('Walukiewicz');

      expect(builder.toBuffer()).toBeEqualToBuffer(new Buffer('Łukasz\0Walukiewicz\0'));
    });
  });

  describe("pushInt8", function()
  {
    it("should throw if the specified argument is not an 8-bit integer", function()
    {
      var builder = new BufferBuilder();

      expect(function() { builder.pushInt8(271); }).toThrow();
      expect(function() { builder.pushInt8('a'); }).toThrow();
      expect(function() { builder.pushInt8(-666); }).toThrow();
    });

    it("should return self", function()
    {
      var builder = new BufferBuilder();

      expect(builder.pushInt8(1)).toBe(builder);
    });

    it("should increase the length of the builder by 1", function()
    {
      var builder = new BufferBuilder();

      builder.pushInt8(10);
      
      expect(builder.length).toBe(1);
    });

    it("should work with minimum value of -128", function()
    {
      var builder = new BufferBuilder();

      builder.pushInt8(-128);

      expect(builder.toBuffer()).toBeEqualToBuffer([0x80]);
    });

    it("should work with maximum value of 127", function()
    {
      var builder = new BufferBuilder();

      builder.pushInt8(127);

      expect(builder.toBuffer()).toBeEqualToBuffer([0x7F]);
    });

    it("should append the specified numbers to the end of the result buffer", function()
    {
      var builder = new BufferBuilder();

      builder
        .pushInt8(-50)
        .pushInt8(50);

      expect(builder.toBuffer()).toBeEqualToBuffer([0xCE, 0x32]);
    });

    it("should convert floats to integers by dropping fraction", function()
    {
      var builder = new BufferBuilder();

      builder.pushInt8(12.34);

      expect(builder.toBuffer()).toBeEqualToBuffer([0x0C]);
    });
  });

  describe("pushInt16", function()
  {
    it("should throw if the specified argument is not a 16-bit integer", function()
    {
      var builder = new BufferBuilder();

      expect(function() { builder.pushInt16(33167); }).toThrow();
      expect(function() { builder.pushInt16('abc'); }).toThrow();
      expect(function() { builder.pushInt16(-66666); }).toThrow();
    });

    it("should return self", function()
    {
      var builder = new BufferBuilder();

      expect(builder.pushInt16(1)).toBe(builder);
    });

    it("should increase the length of the builder by 2", function()
    {
      var builder = new BufferBuilder();

      builder.pushInt16(10);

      expect(builder.length).toBe(2);
    });

    it("should work with minimum value of -32768", function()
    {
      var builder = new BufferBuilder();

      builder.pushInt16(-32768);

      expect(builder.toBuffer()).toBeEqualToBuffer([0x80, 0x00]);
    });

    it("should work with maximum value of 32767", function()
    {
      var builder = new BufferBuilder();

      builder.pushInt16(32767);

      expect(builder.toBuffer()).toBeEqualToBuffer([0x7F, 0xFF]);
    });

    it("should append the specified numbers in big endian to the end of the result buffer", function()
    {
      var builder = new BufferBuilder();

      builder
        .pushInt16(-500)
        .pushInt16(500);

      expect(builder.toBuffer()).toBeEqualToBuffer([0xFE, 0x0C, 0x01, 0xF4]);
    });

    it("should append the specified numbers in little endian to the end of the result buffer", function()
    {
      var builder = new BufferBuilder();

      builder
        .pushInt16(-500, true)
        .pushInt16(500, true);

      expect(builder.toBuffer()).toBeEqualToBuffer([0x0C, 0xFE, 0xF4, 0x01]);
    });

    it("should convert floats to integers by dropping fraction", function()
    {
      var builder = new BufferBuilder();

      builder.pushInt16(12.34);

      expect(builder.toBuffer()).toBeEqualToBuffer([0x00, 0x0C]);
    });
  });

  describe("pushInt32", function()
  {
    it("should throw if the specified argument is not a 32-bit integer", function()
    {
      var builder = new BufferBuilder();

      expect(function() { builder.pushInt32(0x7FFFFFFF + 1); }).toThrow();
      expect(function() { builder.pushInt32('abc'); }).toThrow();
      expect(function() { builder.pushInt32(-0x80000000 - 1); }).toThrow();
    });

    it("should return self", function()
    {
      var builder = new BufferBuilder();

      expect(builder.pushInt32(1)).toBe(builder);
    });

    it("should increase the length of the builder by 4", function()
    {
      var builder = new BufferBuilder();

      builder.pushInt32(10);

      expect(builder.length).toBe(4);
    });

    it("should work with minimum value of -2147483648", function()
    {
      var builder = new BufferBuilder();

      builder.pushInt32(-2147483648);

      expect(builder.toBuffer()).toBeEqualToBuffer([0x80, 0x00, 0x00, 0x00]);
    });

    it("should work with maximum value of 2147483647", function()
    {
      var builder = new BufferBuilder();

      builder.pushInt32(2147483647);

      expect(builder.toBuffer()).toBeEqualToBuffer([0x7F, 0xFF, 0xFF, 0xFF]);
    });

    it("should append the specified numbers in big endian to the end of the result buffer", function()
    {
      var builder = new BufferBuilder();

      builder
        .pushInt32(-50000)
        .pushInt32(50000);

      expect(builder.toBuffer()).toBeEqualToBuffer([0xFF, 0xFF, 0x3C, 0xB0, 0x00, 0x00, 0xC3, 0x50]);
    });

    it("should append the specified numbers in little endian to the end of the result buffer", function()
    {
      var builder = new BufferBuilder();

      builder
        .pushInt32(-50000, true)
        .pushInt32(50000, true);

      expect(builder.toBuffer()).toBeEqualToBuffer([0xB0, 0x3C, 0xFF, 0xFF, 0x50, 0xC3, 0x00, 0x00]);
    });

    it("should convert floats to integers by dropping fraction", function()
    {
      var builder = new BufferBuilder();

      builder.pushInt32(12.34);

      expect(builder.toBuffer()).toBeEqualToBuffer([0x00, 0x00, 0x00, 0x0C]);
    });
  });

  describe("pushUInt8", function()
  {
    it("should throw if the specified argument is not an 8-bit unsigned integer", function()
    {
      var builder = new BufferBuilder();

      expect(function() { builder.pushUInt8(271); }).toThrow();
      expect(function() { builder.pushUInt8('a'); }).toThrow();
      expect(function() { builder.pushUInt8(-666); }).toThrow();
    });

    it("should return self", function()
    {
      var builder = new BufferBuilder();

      expect(builder.pushUInt8(1)).toBe(builder);
    });

    it("should increase the length of the builder by 1", function()
    {
      var builder = new BufferBuilder();

      builder.pushUInt8(10);

      expect(builder.length).toBe(1);
    });

    it("should work with minimum value of 0", function()
    {
      var builder = new BufferBuilder();

      builder.pushUInt8(0);

      expect(builder.toBuffer()).toBeEqualToBuffer([0x00]);
    });

    it("should work with maximum value of 255", function()
    {
      var builder = new BufferBuilder();

      builder.pushUInt8(255);

      expect(builder.toBuffer()).toBeEqualToBuffer([0xFF]);
    });

    it("should append the specified numbers to the end of the result buffer", function()
    {
      var builder = new BufferBuilder();

      builder
        .pushUInt8(0)
        .pushUInt8(50);

      expect(builder.toBuffer()).toBeEqualToBuffer([0x00, 0x32]);
    });

    it("should convert floats to integers by dropping fraction", function()
    {
      var builder = new BufferBuilder();

      builder.pushUInt8(12.34);

      expect(builder.toBuffer()).toBeEqualToBuffer([0x0C]);
    });
  });

  describe("pushUInt16", function()
  {
    it("should throw if the specified argument is not a 16-bit unsigned integer", function()
    {
      var builder = new BufferBuilder();

      expect(function() { builder.pushUInt16(0xFFFF + 1); }).toThrow();
      expect(function() { builder.pushUInt16('abc'); }).toThrow();
      expect(function() { builder.pushUInt16(-1); }).toThrow();
    });

    it("should return self", function()
    {
      var builder = new BufferBuilder();

      expect(builder.pushUInt16(1)).toBe(builder);
    });

    it("should increase the length of the builder by 2", function()
    {
      var builder = new BufferBuilder();

      builder.pushUInt16(10);

      expect(builder.length).toBe(2);
    });

    it("should work with minimum value of 0", function()
    {
      var builder = new BufferBuilder();

      builder.pushUInt16(0);

      expect(builder.toBuffer()).toBeEqualToBuffer([0x00, 0x00]);
    });

    it("should work with maximum value of 32767", function()
    {
      var builder = new BufferBuilder();

      builder.pushUInt16(0xFFFF);

      expect(builder.toBuffer()).toBeEqualToBuffer([0xFF, 0xFF]);
    });

    it("should append the specified numbers in big endian to the end of the result buffer", function()
    {
      var builder = new BufferBuilder();

      builder
        .pushUInt16(0)
        .pushUInt16(500);

      expect(builder.toBuffer()).toBeEqualToBuffer([0x00, 0x00, 0x01, 0xF4]);
    });

    it("should append the specified numbers in little endian to the end of the result buffer", function()
    {
      var builder = new BufferBuilder();

      builder
        .pushUInt16(0, true)
        .pushUInt16(500, true);

      expect(builder.toBuffer()).toBeEqualToBuffer([0x00, 0x00, 0xF4, 0x01]);
    });

    it("should convert floats to integers by dropping fraction", function()
    {
      var builder = new BufferBuilder();

      builder.pushUInt16(12.34);

      expect(builder.toBuffer()).toBeEqualToBuffer([0x00, 0x0C]);
    });
  });

  describe("pushUInt32", function()
  {
    it("should throw if the specified argument is not a 32-bit unsigned integer", function()
    {
      var builder = new BufferBuilder();

      expect(function() { builder.pushUInt32(0xFFFFFFFF + 1); }).toThrow();
      expect(function() { builder.pushUInt32('abc'); }).toThrow();
      expect(function() { builder.pushUInt32(-1); }).toThrow();
    });

    it("should return self", function()
    {
      var builder = new BufferBuilder();

      expect(builder.pushUInt32(1)).toBe(builder);
    });

    it("should increase the length of the builder by 4", function()
    {
      var builder = new BufferBuilder();

      builder.pushUInt32(10);

      expect(builder.length).toBe(4);
    });

    it("should work with minimum value of 0", function()
    {
      var builder = new BufferBuilder();

      builder.pushUInt32(0);

      expect(builder.toBuffer()).toBeEqualToBuffer([0x00, 0x00, 0x00, 0x00]);
    });

    it("should work with maximum value of 2147483647", function()
    {
      var builder = new BufferBuilder();

      builder.pushUInt32(0xFFFFFFFF);

      expect(builder.toBuffer()).toBeEqualToBuffer([0xFF, 0xFF, 0xFF, 0xFF]);
    });

    it("should append the specified numbers in big endian to the end of the result buffer", function()
    {
      var builder = new BufferBuilder();

      builder
        .pushUInt32(0)
        .pushUInt32(50000);

      expect(builder.toBuffer()).toBeEqualToBuffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC3, 0x50]);
    });

    it("should append the specified numbers in little endian to the end of the result buffer", function()
    {
      var builder = new BufferBuilder();

      builder
        .pushUInt32(0, true)
        .pushUInt32(50000, true);

      expect(builder.toBuffer()).toBeEqualToBuffer([0x00, 0x00, 0x00, 0x00, 0x50, 0xC3, 0x00, 0x00]);
    });

    it("should convert floats to integers by dropping fraction", function()
    {
      var builder = new BufferBuilder();

      builder.pushUInt32(12.34);

      expect(builder.toBuffer()).toBeEqualToBuffer([0x00, 0x00, 0x00, 0x0C]);
    });
  });

  describe("pushFloat", function()
  {
    it("should throw if the specified argument is not a 32-bit floating-point number", function()
    {
      var builder = new BufferBuilder();

      expect(function() { builder.pushFloat(10.402e40); }).toThrow();
      expect(function() { builder.pushFloat('abc'); }).toThrow();
      expect(function() { builder.pushFloat(-10.204e39); }).toThrow();
    });

    it("should return self", function()
    {
      var builder = new BufferBuilder();

      expect(builder.pushFloat(1.0)).toBe(builder);
    });

    it("should increase the length of the builder by 4", function()
    {
      var builder = new BufferBuilder();

      builder.pushFloat(10.10);

      expect(builder.length).toBe(4);
    });

    it("should work with minimum value of -3.4028234663852886e+38", function()
    {
      var builder = new BufferBuilder();

      builder.pushFloat(-3.4028234663852886e+38);

      expect(builder.toBuffer()).toBeEqualToBuffer([0xFF, 0x7F, 0xFF, 0xFF]);
    });

    it("should work with maximum value of 3.4028234663852886e+38", function()
    {
      var builder = new BufferBuilder();

      builder.pushFloat(3.4028234663852886e+38);

      expect(builder.toBuffer()).toBeEqualToBuffer([0x7F, 0x7F, 0xFF, 0xFF]);
    });

    it("should append the specified numbers in big endian to the end of the result buffer", function()
    {
      var builder = new BufferBuilder();

      builder
        .pushFloat(-1.23)
        .pushFloat(0)
        .pushFloat(4.56);

      expect(builder.toBuffer()).toBeEqualToBuffer(
        [0xBF, 0x9D, 0x70, 0xA4, 0x00, 0x00, 0x00, 0x00, 0x40, 0x91, 0xEB, 0x85]
      );
    });

    it("should append the specified numbers in little endian to the end of the result buffer", function()
    {
      var builder = new BufferBuilder();

      builder
        .pushFloat(-1.23, true)
        .pushFloat(0, true)
        .pushFloat(4.56, true);

      expect(builder.toBuffer()).toBeEqualToBuffer(
        [0xA4, 0x70, 0x9D, 0xBF, 0x00, 0x00, 0x00, 0x00, 0x85, 0xEB, 0x91, 0x40]
      );
    });
  });

  describe("pushDouble", function()
  {
    it("should throw if the specified argument is not a 64-bit floating-point number", function()
    {
      var builder = new BufferBuilder();

      expect(function() { builder.pushDouble(10.402e308); }).toThrow();
      expect(function() { builder.pushDouble('abc'); }).toThrow();
      expect(function() { builder.pushDouble(-10.204e308); }).toThrow();
    });

    it("should return self", function()
    {
      var builder = new BufferBuilder();

      expect(builder.pushDouble(1.0)).toBe(builder);
    });

    it("should increase the length of the builder by 8", function()
    {
      var builder = new BufferBuilder();

      builder.pushDouble(10.10);

      expect(builder.length).toBe(8);
    });

    it("should work with minimum value of -1.7976931348623157e+308", function()
    {
      var builder = new BufferBuilder();

      builder.pushDouble(-1.7976931348623157e+308);

      expect(builder.toBuffer()).toBeEqualToBuffer([0xFF, 0xEF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
    });

    it("should work with maximum value of 1.7976931348623157e+308", function()
    {
      var builder = new BufferBuilder();

      builder.pushDouble(1.7976931348623157e+308);

      expect(builder.toBuffer()).toBeEqualToBuffer([0x7F, 0xEF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
    });

    it("should append the specified numbers in big endian to the end of the result buffer", function()
    {
      var builder = new BufferBuilder();

      builder
        .pushDouble(-1.23)
        .pushDouble(0)
        .pushDouble(4.56);

      expect(builder.toBuffer()).toBeEqualToBuffer([
        0xBF, 0xF3, 0xAE, 0x14, 0x7A, 0xE1, 0x47, 0xAE,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x40, 0x12, 0x3D, 0x70, 0xA3, 0xD7, 0x0A, 0x3D
      ]);
    });

    it("should append the specified numbers in little endian to the end of the result buffer", function()
    {
      var builder = new BufferBuilder();

      builder
        .pushDouble(-1.23, true)
        .pushDouble(0, true)
        .pushDouble(4.56, true);

      expect(builder.toBuffer()).toBeEqualToBuffer([
        0xAE, 0x47, 0xE1, 0x7A, 0x14, 0xAE, 0xF3, 0xBF,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x3D, 0x0A, 0xD7, 0xA3, 0x70, 0x3D, 0x12, 0x40
      ]);
    });
  });
});
