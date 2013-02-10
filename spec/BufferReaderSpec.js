/*jshint maxlen:999,maxstatements:999*/
/*global describe:false,it:false,expect:false*/

'use strict';

var BufferReader = require(process.env.LIB_FOR_TESTS_DIR || '../lib').BufferReader;

describe("BufferReader", function()
{
  it("should throw if the specified argument is not a Buffer", function()
  {
    expect(function() { new BufferReader([1, 2, 3]); }).toThrow();
  });
  
  it("should throw if no buffer was specified", function()
  {
    expect(function() { new BufferReader(); }).toThrow();
  });

  it("should have the specified buffer's length", function()
  {
    var buffer = new Buffer([0, 1, 2, 3]);
    var reader = new BufferReader(buffer);

    expect(reader.length).toEqual(buffer.length);
  });

  describe("skip", function()
  {
    it("should throw if the specified byte count is not a number", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));
      
      expect(function() { reader.skip('ten'); }).toThrow();
    });
    
    it("should throw if the specified byte count is less than 0", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));
      
      expect(function() { reader.skip(-7); }).toThrow();
    });
    
    it("should not move if the specified byte count is 0", function()
    {
      var buffer = new Buffer([0, 1, 2, 3]);
      var reader = new BufferReader(buffer);
      
      reader.skip(0);
      
      expect(reader.readByte(0)).toEqual(buffer[0]);
    });
      
    it("should move by 1 byte if the specified byte count is 1", function()
    {
      var buffer = new Buffer([0, 1, 2, 3]);
      var reader = new BufferReader(buffer);
      
      reader.skip(1);
      
      expect(reader.readByte(0)).toEqual(buffer[1]);
    });
    
    it("should move by 5 if skipped 2 and 3 bytes", function()
    {
      var buffer = new Buffer([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      var reader = new BufferReader(buffer);
      
      reader.skip(2);
      reader.skip(3);
      
      expect(reader.readByte(0)).toEqual(buffer[5]);
    });
    
    it("should move to the end if the byte count was not specified", function()
    {
      var buffer = new Buffer([0, 1, 2, 3]);
      var reader = new BufferReader(buffer);
      
      reader.skip();
      
      expect(reader.length).toEqual(0);
    });
    
    it("should move to the end if the specified byte count is equal to the length of a reader", function()
    {
      var buffer = new Buffer([0, 1, 2, 3]);
      var reader = new BufferReader(buffer);
      
      reader.skip(buffer.length);
      
      expect(reader.length).toEqual(0);
    });
    
    it("should move to the end if the specified byte count is greater than the length of a reader", function()
    {
      var buffer = new Buffer([0, 1, 2, 3]);
      var reader = new BufferReader(buffer);
      
      reader.skip(buffer.length + 666);
      
      expect(reader.length).toEqual(0);
    });
  });

  describe("indexOf", function()
  {
    it("should throw if the specified search element is not a number", function()
    {
      var reader = new BufferReader(new Buffer([1]));
      
      expect(function() { reader.indexOf('ten'); }).toThrow();
    });
    
    it("should throw if the specified from index is not a number", function()
    {
      var reader = new BufferReader(new Buffer([1]));
      
      expect(function() { reader.indexOf(0, 'ten'); }).toThrow();
    });
    
    it("should throw if the specified from index is less than 0", function()
    {
      var reader = new BufferReader(new Buffer([1]));

      expect(function() { reader.indexOf(0, -10); }).toThrow();
    });

    it("should throw if the specified from index is greater than the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2, 3]));

      expect(function() { reader.indexOf(0, 5); }).toThrow();
    });

    it("should throw if the specified search element is not a byte value", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2]));

      expect(function() { reader.indexOf(0x00 - 10); }).toThrow();
      expect(function() { reader.indexOf(0xFF + 10); }).toThrow();
    });
    
    it("should return -1 if the searched element does not exist in the reader", function()
    {
      var reader = new BufferReader(new Buffer([1]));

      expect(reader.indexOf(100)).toEqual(-1);
    });
    
    it("should start searching from the specified index", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2, 3, 4, 5]));
      
      expect(reader.indexOf(0, 3)).toEqual(-1);
    });
    
    it("should return index of the first occurrence of the searched element", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 0, 0, 1, 1, 0]));
      
      expect(reader.indexOf(0)).toEqual(0);
    });
    
    it("should return index of the first occurrence of the searched element after the specified index", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 0, 0, 1, 1, 0]));
      
      expect(reader.indexOf(1, 2)).toEqual(4);
    });
  });

  describe("copy", function()
  {
    it("should throw if the specified target buffer is not a Buffer", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2]));
      
      expect(function() { reader.copy([]); }).toThrow();
    });
    
    it("should throw if the target start index is not a number", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2]));
      
      expect(function() { reader.copy(new Buffer(0), 'ten'); }).toThrow();
    });
    
    it("should throw if the target start index is less than 0", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2]));
      
      expect(function() { reader.copy(new Buffer(0), -6); }).toThrow();
    });
    
    it("should throw if the target start index is greater than the target's length", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2]));
      
      expect(function() { reader.copy(new Buffer(3), 5); }).toThrow();
    });
    
    it("should throw if the source start index is not a number", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2]));
      
      expect(function() { reader.copy(new Buffer(0), 0, 'ten'); }).toThrow();
    });
    
    it("should throw if the source start index is less than 0", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2]));
      
      expect(function() { reader.copy(new Buffer(0), 0, -3); }).toThrow();
    });
    
    it("should throw if the source start index is greater than the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2]));
      
      expect(function() { reader.copy(new Buffer(0), 0, 5); }).toThrow();
    });
    
    it("should throw if the source end index is not a number", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2]));
      
      expect(function() { reader.copy(new Buffer(0), 0, 0, 'ten'); }).toThrow();
    });
    
    it("should throw if the source end index is less than 1", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2]));
      
      expect(function() { reader.copy(new Buffer(0), 0, 0, 0); }).toThrow();
    });
    
    it("should throw if the source end index is greater than the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2]));
      
      expect(function() { reader.copy(new Buffer(0), 0, 0, 5); }).toThrow();
    });
    
    it("should throw if the source end index is greater than the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2, 3, 4, 5]));
      
      expect(function() { reader.copy(new Buffer(0), 0, 0, 10); }).toThrow();
    });
    
    it("should throw if the source start index is not less than source end index", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2, 3, 4, 5]));
      
      expect(function() { reader.copy(new Buffer(0), 0, 4, 2); }).toThrow();
    });
    
    it("should return the total number of copied bytes", function()
    {
      var targetBuffer = new Buffer([0, 0, 0, 0, 0]);
      var reader       = new BufferReader(new Buffer([0, 1, 2, 3, 4]));
      
      expect(reader.copy(targetBuffer)).toEqual(reader.length);
    });
    
    it("should copy the whole reader starting at the beginning of the target buffer", function()
    {
      var targetBuffer   = new Buffer([0, 0, 0, 0, 0]);
      var expectedBuffer = new Buffer([0, 1, 2, 3, 4]);
      var reader         = new BufferReader(new Buffer([0, 1, 2, 3, 4]));
      
      reader.copy(targetBuffer);
      
      expect(targetBuffer.toString()).toEqual(expectedBuffer.toString());
    });
    
    it("should copy the whole reader starting at the specified position in the target buffer", function()
    {
      var targetBuffer   = new Buffer([9, 9, 0, 0, 0, 0, 0]);
      var expectedBuffer = new Buffer([9, 9, 0, 1, 2, 3, 4]);
      var reader         = new BufferReader(new Buffer([0, 1, 2, 3, 4]));
      
      reader.copy(targetBuffer, 2);
      
      expect(targetBuffer.toString()).toEqual(expectedBuffer.toString());
    });
    
    it("should copy only as much as the target buffer can contain", function()
    {
      var targetBuffer   = new Buffer([0, 0, 0]);
      var expectedBuffer = new Buffer([0, 1, 2]);
      var reader         = new BufferReader(new Buffer([0, 1, 2, 3, 4]));
      
      reader.copy(targetBuffer);
      
      expect(targetBuffer.toString()).toEqual(expectedBuffer.toString());
    });
    
    it("should copy only the specified bytes from the reader", function()
    {
      var targetBuffer   = new Buffer([0, 0, 3, 4]);
      var expectedBuffer = new Buffer([1, 2, 3, 4]);
      var reader         = new BufferReader(new Buffer([9, 1, 2, 9]));
      
      reader.copy(targetBuffer, 0, 1, 3);
      
      expect(targetBuffer.toString()).toEqual(expectedBuffer.toString());
    });
  });

  describe("shiftBits", function()
  {
    it("should throw if the specified bit count is not a number", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2, 3]));

      expect(function() { reader.shiftBits('ten'); }).toThrow();
    });

    it("should throw if the specified bit count is less than 1", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2, 3]));

      expect(function() { reader.shiftBits(-10); }).toThrow();
    });

    it("should throw if the specified bit count is greater than the reader's length multiplied by 8", function()
    {
      var reader = new BufferReader(new Buffer([1]));

      expect(function() { reader.shiftBits(666); }).toThrow();
    });

    it("should return an array with the least significant bit from the next first byte if the specified bit count is 1", function()
    {
      var reader = new BufferReader(new Buffer([parseInt('00000001', 2)]));

      expect(reader.shiftBits(1)).toEqual([true]);
    });

    it("should return the specified number of the next bits as an array", function()
    {
      var reader = new BufferReader(new Buffer([parseInt('01010101', 2)]));

      expect(reader.shiftBits(8)).toEqual([true, false, true, false, true, false, true, false]);
    });

    it("should decrease the reader's length by the byte count needed to shift the specified amount of bits", function()
    {
      var buffer = new Buffer([
        parseInt('10101010', 2),
        parseInt('01010101', 2),
        parseInt('11100111', 2)
      ]);
      var reader = new BufferReader(buffer);

      reader.shiftBits(11);

      expect(reader.length).toEqual(1);
    });
  });

  describe("shiftByte", function()
  {
    it("should throw if the reader is empty", function()
    {
      var reader = new BufferReader(new Buffer([]));
      
      expect(function() { reader.shiftByte(); }).toThrow();
    });
    
    it("should return the first byte", function()
    {
      var buffer = new Buffer([3, 2, 1]);
      var reader = new BufferReader(buffer);
      
      expect(reader.shiftByte()).toEqual(buffer[0]);
    });

    it("should work after skipping the beginning", function()
    {
      var buffer = new Buffer([3, 2, 1]);
      var reader = new BufferReader(buffer);

      reader.skip(2);

      expect(reader.shiftByte()).toEqual(buffer[2]);
    });
    
    it("should decrease the reader's length by one", function()
    {
      var buffer = new Buffer([3, 2, 1]);
      var reader = new BufferReader(buffer);
      
      reader.shiftByte();
      
      expect(reader.length).toEqual(buffer.length - 1);
    });
  });

  describe("shiftChar", function()
  {
    it("should throw if the reader is empty", function()
    {
      var reader = new BufferReader(new Buffer([]));
      
      expect(function() { reader.shiftChar(); }).toThrow();
    });
    
    it("should return the first byte as an ASCII character", function()
    {
      var string = 'zyx';
      var reader = new BufferReader(new Buffer(string));
      
      expect(reader.shiftChar()).toEqual(string[0]);
    });

    it("should work after skipping the beginning", function()
    {
      var string = 'zyx';
      var reader = new BufferReader(new Buffer(string));

      reader.skip(2);

      expect(reader.shiftChar()).toEqual(string[2]);
    });
    
    it("should decrease the reader's length by one", function()
    {
      var buffer = new Buffer('xyz');
      var reader = new BufferReader(buffer);
      
      reader.shiftChar();
      
      expect(reader.length).toEqual(buffer.length - 1);
    });
  });

  describe("shiftBytes", function()
  {
    it("should throw if the specified byte count is not a number", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2, 3]));
      
      expect(function() { reader.shiftBytes('ten'); }).toThrow();
    });
    
    it("should throw if the specified byte count is less than 1", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2, 3]));
      
      expect(function() { reader.shiftBytes(-10); }).toThrow();
    });
    
    it("should throw if the specified byte count is greater than the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([1, 2]));
      
      expect(function() { reader.shiftBytes(666); }).toThrow();
    });
    
    it("should return the next first byte as an array if the specified byte count is 1", function()
    {
      var reader = new BufferReader(new Buffer([3, 2, 1]));
      
      expect(reader.shiftBytes(1)).toEqual([3]);
    });
    
    it("should return the specified number of the next bytes as an array", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2, 3, 4, 5]));
      
      expect(reader.shiftBytes(3)).toEqual([0, 1, 2]);
    });
    
    it("should decrease the reader's length by the specified byte count", function()
    {
      var buffer = new Buffer([0, 1, 2, 3, 4, 5]);
      var reader = new BufferReader(buffer);
      
      reader.shiftBytes(3);
      
      expect(reader.length).toEqual(buffer.length - 3);
    });

    it("should work after skipping the beginning", function()
    {
      var buffer = new Buffer([0, 1, 2, 3, 4, 5]);
      var reader = new BufferReader(buffer);

      reader.skip(2);
      
      expect(reader.shiftBytes(3)).toEqual([2, 3, 4]);
    });
  });

  describe("shiftBuffer", function()
  {
    it("should throw if the specified byte count is not a number", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2, 3]));
      
      expect(function() { reader.shiftBuffer('ten'); }).toThrow();
    });

    it("should throw if the specified byte count is less than 1", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2, 3]));
      
      expect(function() { reader.shiftBuffer(-10); }).toThrow();
    });
    
    it("should throw if the specified byte count is greater than the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2]));
      
      expect(function() { reader.shiftBuffer(666); }).toThrow();
    });

    it("should return the next first byte as an instance of Buffer if the specified byte count is 1", function()
    {
      var reader = new BufferReader(new Buffer([3, 2, 1]));

      var resultBuffer = reader.shiftBuffer(1);

      expect(resultBuffer instanceof Buffer).toBeTruthy();
      expect(Array.prototype.slice.call(resultBuffer)).toEqual([3]);
    });

    it("should return the specified number of the next bytes as an instance of Buffer", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2, 3, 4, 5]));

      var resultBuffer = reader.shiftBuffer(3);
      
      expect(resultBuffer instanceof Buffer).toBeTruthy();
      expect(Array.prototype.slice.call(resultBuffer)).toEqual([0, 1, 2]);
    });

    it("should decrease the reader's length by the specified byte count", function()
    {
      var buffer = new Buffer([0, 1, 2, 3, 4, 5]);
      var reader = new BufferReader(buffer);

      reader.shiftBuffer(3);

      expect(reader.length).toEqual(buffer.length - 3);
    });

    it("should work after skipping the beginning", function()
    {
      var buffer = new Buffer([0, 1, 2, 3, 4, 5]);
      var reader = new BufferReader(buffer);

      reader.skip(2);

      expect(Array.prototype.slice.call(reader.shiftBuffer(3))).toEqual([2, 3, 4]);
    });
  });

  describe("shiftString", function()
  {
    it("should throw if the specified length is not a number", function()
    {
      var reader = new BufferReader(new Buffer('omghi2u'));

      expect(function() { reader.shiftString('ten'); }).toThrow();
    });

    it("should throw if the specified length is less than 1", function()
    {
      var reader = new BufferReader(new Buffer('omghi2u'));

      expect(function() { reader.shiftString(-10); }).toThrow();
    });

    it("should throw if the specified length is greater than the reader's length", function()
    {
      var reader = new BufferReader(new Buffer('omghi2u'));

      expect(function() { reader.shiftString(666); }).toThrow();
    });

    it("should throw if the specified encoding is not supported", function()
    {
      var reader = new BufferReader(new Buffer('omghi2u'));

      expect(function() { reader.shiftString(3, 'utf-666'); }).toThrow();
    });

    it("should return a string of the specified length and in the UTF-8 encoding", function()
    {
      var reader = new BufferReader(new Buffer('omghi2u'));

      expect(reader.shiftString(3, 'utf8')).toEqual('omg');
    });

    it("should return a string of the specified length and in the ASCII encoding", function()
    {
      var reader = new BufferReader(new Buffer('ómgh€u', 'ascii'));

      expect(reader.shiftString(6, 'ascii')).toEqual('\uFFFDmgh\uFFFDu');
    });

    it("should decrease the reader's length by the shifted string's length", function()
    {
      var reader = new BufferReader(new Buffer('omghi2u'));

      reader.shiftString(5);

      expect(reader.length).toEqual(2);
    });

    it("should work after skipping the beginning", function()
    {
      var buffer = new Buffer('hello world');
      var reader = new BufferReader(buffer);

      reader.skip(6);

      expect(reader.shiftString(5)).toEqual('world');
    });
  });

  describe("shiftZeroString", function()
  {
    it("should throw if the specified encoding is not supported", function()
    {
      var reader = new BufferReader(new Buffer('omghi2u\0too'));

      expect(function() { reader.shiftZeroString('utf-666'); }).toThrow();
    });

    it("should return a string up to a NULL character in the specified encoding", function()
    {
      var reader = new BufferReader(new Buffer('omghi2u\0too'));

      expect(reader.shiftZeroString('utf8')).toEqual('omghi2u');
    });

    it("should decrease the reader's length by the shifted string's length plus one", function()
    {
      var reader = new BufferReader(new Buffer('omghi2u\0too'));

      reader.shiftZeroString();

      expect(reader.length).toEqual('too'.length);
    });

    it("should work after skipping the beginning", function()
    {
      var buffer = new Buffer('hello world\0hello world');
      var reader = new BufferReader(buffer);

      reader.skip(6);

      expect(reader.shiftZeroString()).toEqual('world');
    });

    it("should return an empty string if NULL character is not found", function()
    {
      var reader = new BufferReader(new Buffer('omghi2u'));

      expect(reader.shiftZeroString()).toEqual('');
    });
  });

  describe("shiftInt8", function()
  {
    it("should throw if the reader is empty", function()
    {
      var reader = new BufferReader(new Buffer([]));

      expect(function() { reader.shiftInt8(); }).toThrow();
    });

    it("should return the next positive 8 bit integer", function()
    {
      var reader = new BufferReader(new Buffer([0x42, 0x00]));

      expect(reader.shiftInt8()).toEqual(66);
    });

    it("should return the next negative 8 bit integer", function()
    {
      var reader = new BufferReader(new Buffer([0xBE, 0x00, 0x00]));

      expect(reader.shiftInt8()).toEqual(-66);
    });

    it("should return the lower bound value of -128 if the next byte is 0x80", function()
    {
      var reader = new BufferReader(new Buffer([0x80, 0x00, 0x00]));

      expect(reader.shiftInt8()).toEqual(-128);
    });

    it("should return the upper bound value of 127 if the next byte is 0x7F", function()
    {
      var reader = new BufferReader(new Buffer([0x7F, 0x00, 0x00]));

      expect(reader.shiftInt8()).toEqual(127);
    });

    it("should return a value of 0 if the next byte is 0x00", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x00]));

      expect(reader.shiftInt8()).toEqual(0);
    });

    it("should return a value of -1 if the next byte is 0xFF", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0x00, 0x00]));

      expect(reader.shiftInt8()).toEqual(-1);
    });

    it("should decrease the reader's length by one", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0x00, 0x00]));

      reader.shiftInt8();

      expect(reader.length).toEqual(2);
    });

    it("should work after skipping the beginning", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x01, 0x02]));

      reader.skip(2);

      expect(reader.shiftInt8()).toEqual(0x02);
    });
  });

  describe("shiftInt16", function()
  {
    it("should throw if the reader is empty", function()
    {
      var reader = new BufferReader(new Buffer([]));

      expect(function() { reader.shiftInt16(); }).toThrow();
    });

    it("should throw if the reader does not have at least 2 bytes", function()
    {
      var reader = new BufferReader(new Buffer([0x01]));

      expect(function() { reader.shiftInt16(); }).toThrow();
    });

    it("should return the next positive 16 bit integer", function()
    {
      var reader = new BufferReader(new Buffer([0x02, 0x9A, 0x00, 0x01, 0x00, 0x02]));

      expect(reader.shiftInt16()).toEqual(666);
    });

    it("should return the next negative 16 bit integer", function()
    {
      var reader = new BufferReader(new Buffer([0xFD, 0x66, 0x00, 0x01, 0x00, 0x02]));

      expect(reader.shiftInt16()).toEqual(-666);
    });

    it("should return the lower bound value of -32768 if the next two bytes are 0x8000", function()
    {
      var reader = new BufferReader(new Buffer([0x80, 0x00, 0x00, 0x01]));

      expect(reader.shiftInt16()).toEqual(-32768);
    });

    it("should return the upper bound value of 32767 if the next two bytes are 0x7FFF", function()
    {
      var reader = new BufferReader(new Buffer([0x7F, 0xFF, 0x00, 0x01]));

      expect(reader.shiftInt16()).toEqual(32767);
    });

    it("should return a value of 0 if the next byte two bytes are 0x0000", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x01, 0x01]));

      expect(reader.shiftInt16()).toEqual(0);
    });

    it("should return a value of -1 if the next two bytes are 0xFFFF", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0xFF, 0x00]));

      expect(reader.shiftInt16()).toEqual(-1);
    });

    it("should decrease the reader's length by two", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0x00, 0x00]));

      reader.shiftInt16();

      expect(reader.length).toEqual(1);
    });

    it("should use little endian if specified so", function()
    {
      var reader = new BufferReader(new Buffer([0x66, 0xFD, 0x00, 0x01, 0x00, 0x02]));

      expect(reader.shiftInt16(true)).toEqual(-666);
    });

    it("should work after skipping the beginning", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x01, 0x00, 0x02, 0x00, 0x03]));

      reader.skip(4);

      expect(reader.shiftInt16()).toEqual(0x0003);
    });
  });

  describe("shiftInt32", function()
  {
    it("should throw if the reader is empty", function()
    {
      var reader = new BufferReader(new Buffer([]));

      expect(function() { reader.shiftInt32(); }).toThrow();
    });

    it("should throw if the reader does not have at least 4 bytes", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x01, 0x02]));

      expect(function() { reader.shiftInt32(); }).toThrow();
    });

    it("should return the next positive 32 bit integer", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x02, 0x9A, 0x00, 0x01]));

      expect(reader.shiftInt32()).toEqual(666);
    });

    it("should return the next negative 32 bit integer", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0xFF, 0xFD, 0x66, 0x00, 0x01]));

      expect(reader.shiftInt32()).toEqual(-666);
    });

    it("should return the lower bound value of -2147483648 if the next four bytes are 0x80000000", function()
    {
      var reader = new BufferReader(new Buffer([0x80, 0x00, 0x00, 0x00, 0x01]));

      expect(reader.shiftInt32()).toEqual(-2147483648);
    });

    it("should return the upper bound value of 2147483647 if the next four bytes are 0x7FFFFFFF", function()
    {
      var reader = new BufferReader(new Buffer([0x7F, 0xFF, 0xFF, 0xFF, 0x01]));

      expect(reader.shiftInt32()).toEqual(2147483647);
    });

    it("should return a value of 0 if the next byte four bytes are 0x00000000", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x00, 0x00, 0x01]));

      expect(reader.shiftInt32()).toEqual(0);
    });

    it("should return a value of -1 if the next four bytes are 0xFFFFFFFF", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0xFF, 0xFF, 0xFF, 0x00]));

      expect(reader.shiftInt32()).toEqual(-1);
    });

    it("should decrease the reader's length by four", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0x00, 0x00, 0xFF, 0x01, 0x02]));

      reader.shiftInt32();

      expect(reader.length).toEqual(2);
    });

    it("should use little endian if specified so", function()
    {
      var reader = new BufferReader(new Buffer([0x66, 0xFD, 0xFF, 0xFF, 0x01, 0x00]));

      expect(reader.shiftInt32(true)).toEqual(-666);
    });

    it("should work after skipping the beginning", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x02]));

      reader.skip(4);

      expect(reader.shiftInt32()).toEqual(0x00000002);
    });
  });

  describe("shiftUInt8", function()
  {
    it("should throw if the reader is empty", function()
    {
      var reader = new BufferReader(new Buffer([]));

      expect(function() { reader.shiftUInt8(); }).toThrow();
    });

    it("should return the next unsigned 8 bit integer", function()
    {
      var reader = new BufferReader(new Buffer([0x42, 0x00, 0x00]));

      expect(reader.shiftUInt8()).toEqual(66);
    });

    it("should return the lower bound value of 0 if the next byte is 0x00", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x01, 0x02]));

      expect(reader.shiftUInt8()).toEqual(0);
    });

    it("should return the upper bound value of 255 if the next byte is 0xFF", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0x00, 0x00]));

      expect(reader.shiftUInt8()).toEqual(255);
    });

    it("should return a value of 0 if the next byte is 0x00", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x01, 0x02]));

      expect(reader.shiftUInt8()).toEqual(0);
    });

    it("should decrease the reader's length by one", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0x00, 0x00]));

      reader.shiftUInt8();

      expect(reader.length).toEqual(2);
    });

    it("should work after skipping the beginning", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x01]));

      reader.skip(1);

      expect(reader.shiftUInt8()).toEqual(0x01);
    });
  });

  describe("shiftUInt16", function()
  {
    it("should throw if the reader is empty", function()
    {
      var reader = new BufferReader(new Buffer([]));

      expect(function() { reader.shiftUInt16(); }).toThrow();
    });

    it("should throw if the reader does not have at least 2 bytes", function()
    {
      var reader = new BufferReader(new Buffer([0x01]));

      expect(function() { reader.shiftUInt16(); }).toThrow();
    });

    it("should return the next unsigned 16 bit integer", function()
    {
      var reader = new BufferReader(new Buffer([0x02, 0x9A, 0x00, 0x01]));

      expect(reader.shiftUInt16()).toEqual(666);
    });

    it("should return the lower bound value of 0 if the next two bytes are 0x0000", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x01, 0x01]));

      expect(reader.shiftUInt16()).toEqual(0);
    });

    it("should return the upper bound value of 65535 if the next two bytes are 0xFFFF", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0xFF, 0x00, 0x01]));

      expect(reader.shiftUInt16()).toEqual(65535);
    });

    it("should return a value of 0 if the next two bytes are 0x0000", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x01, 0x01]));

      expect(reader.shiftUInt16()).toEqual(0);
    });

    it("should decrease the reader's length by two", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0x00, 0x00]));

      reader.shiftUInt16();

      expect(reader.length).toEqual(1);
    });

    it("should use little endian if specified so", function()
    {
      var reader = new BufferReader(new Buffer([0x9A, 0x02, 0x00, 0x01]));

      expect(reader.shiftUInt16(true)).toEqual(666);
    });

    it("should work after skipping the beginning", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x02]));

      reader.skip(3);

      expect(reader.shiftUInt16()).toEqual(0x0100);
    });
  });

  describe("shiftUInt32", function()
  {
    it("should throw if the reader is empty", function()
    {
      var reader = new BufferReader(new Buffer([]));

      expect(function() { reader.shiftUInt32(); }).toThrow();
    });

    it("should throw if the reader does not have at least 4 bytes", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x01, 0x02]));

      expect(function() { reader.shiftUInt32(); }).toThrow();
    });

    it("should return the next unsigned 32 bit integer", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x02, 0x9A, 0x00, 0x01]));

      expect(reader.shiftUInt32()).toEqual(666);
    });

    it("should return the lower bound value of 0 if the next four bytes are 0x00000000", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x00, 0x00, 0x01]));

      expect(reader.shiftUInt32()).toEqual(0);
    });

    it("should return the upper bound value of 4294967295 if the next four bytes are 0xFFFFFFFF", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0xFF, 0xFF, 0xFF, 0x01]));

      expect(reader.shiftUInt32()).toEqual(4294967295);
    });

    it("should return a value of 0 if the next byte four bytes are 0x00000000", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x00, 0x00, 0x01]));

      expect(reader.shiftUInt32()).toEqual(0);
    });

    it("should decrease the reader's length by four", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0x00, 0x00, 0xFF, 0x01, 0x02]));

      reader.shiftUInt32();

      expect(reader.length).toEqual(2);
    });

    it("should use little endian if specified so", function()
    {
      var reader = new BufferReader(new Buffer([0x9A, 0x02, 0x00, 0x00, 0x01, 0x00]));

      expect(reader.shiftUInt32(true)).toEqual(666);
    });

    it("should work after skipping the beginning", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x02]));

      reader.skip(4);

      expect(reader.shiftUInt32()).toEqual(0x00000002);
    });
  });

  describe("shiftFloat", function()
  {
    it("should throw if the reader is empty", function()
    {
      var reader = new BufferReader(new Buffer([]));

      expect(function() { reader.shiftFloat(); }).toThrow();
    });

    it("should throw if the reader does not have at least 4 bytes", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x01, 0x02]));

      expect(function() { reader.shiftFloat(); }).toThrow();
    });

    it("should return the next positive float", function()
    {
      var reader = new BufferReader(new Buffer([0x42, 0x85, 0x51, 0xEC]));

      expect(reader.shiftFloat().toFixed(2)).toEqual('66.66');
    });

    it("should return the next negative float", function()
    {
      var reader = new BufferReader(new Buffer([0xC2, 0x85, 0x51, 0xEC]));

      expect(reader.shiftFloat().toFixed(2).toString()).toEqual('-66.66');
    });

    it("should return the lower bound value of -3.4028234663852886e+38 if the next four bytes are 0xFF7FFFFF", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0x7F, 0xFF, 0xFF]));

      expect(reader.shiftFloat()).toEqual(-3.4028234663852886e+38);
    });

    it("should return the upper bound value of 3.4028234663852886e+38 if the next four bytes are 0x7F7FFFFF", function()
    {
      var reader = new BufferReader(new Buffer([0x7F, 0x7F, 0xFF, 0xFF]));

      expect(reader.shiftFloat()).toEqual(3.4028234663852886e+38);
    });

    it("should return a value of 0 if the next two bytes are 0x00000000", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x00, 0x00]));

      expect(reader.shiftFloat()).toEqual(0);
    });

    it("should decrease the reader's length by four", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0x00, 0x00, 0x01]));

      reader.shiftFloat();

      expect(reader.length).toEqual(0);
    });

    it("should use little endian if specified so", function()
    {
      var reader = new BufferReader(new Buffer([0xEC, 0x51, 0x85, 0x42]));

      expect(reader.shiftFloat(true).toFixed(2)).toEqual('66.66');
    });

    it("should work after skipping the beginning", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x42, 0x85, 0x51, 0xEC]));

      reader.skip(2);

      expect(reader.shiftFloat().toFixed(2)).toEqual('66.66');
    });
  });

  describe("shiftDouble", function()
  {
    it("should throw if the reader is empty", function()
    {
      var reader = new BufferReader(new Buffer([]));

      expect(function() { reader.shiftDouble(); }).toThrow();
    });

    it("should throw if the reader does not have at least 8 bytes", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x01, 0x02, 0x03, 0x04]));

      expect(function() { reader.shiftDouble(); }).toThrow();
    });

    it("should return the next positive float", function()
    {
      var reader = new BufferReader(new Buffer([0x40, 0x50, 0xAA, 0x3D, 0x70, 0xA3, 0xD7, 0x0A]));

      expect(reader.shiftDouble().toFixed(2)).toEqual('66.66');
    });

    it("should return the next negative float", function()
    {
      var reader = new BufferReader(new Buffer([0xC0, 0x50, 0xAA, 0x3D, 0x70, 0xA3, 0xD7, 0x0A]));

      expect(reader.shiftDouble().toFixed(2).toString()).toEqual('-66.66');
    });

    it("should return the lower bound value of -1.7976931348623157E+308 if the next four bytes are 0xFFEFFFFFFFFFFFFF", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0xEF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]));

      expect(reader.shiftDouble()).toEqual(-1.7976931348623157E+308);
    });

    it("should return the upper bound value of 1.7976931348623157E+308 if the next eight bytes are 0x7FEFFFFFFFFFFFFF", function()
    {
      var reader = new BufferReader(new Buffer([0x7F, 0xEF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]));

      expect(reader.shiftDouble()).toEqual(1.7976931348623157E+308);
    });

    it("should return a value of 0 if the next two bytes are 0x0000000000000000", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));

      expect(reader.shiftDouble()).toEqual(0);
    });

    it("should decrease the reader's length by eight", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));

      reader.shiftDouble();

      expect(reader.length).toEqual(0);
    });

    it("should use little endian if specified so", function()
    {
      var reader = new BufferReader(new Buffer([0x0A, 0xD7, 0xA3, 0x70, 0x3D, 0xAA, 0x50, 0x40]));

      expect(reader.shiftDouble(true).toFixed(2)).toEqual('66.66');
    });

    it("should work after skipping the beginning", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x40, 0x50, 0xAA, 0x3D, 0x70, 0xA3, 0xD7, 0x0A]));

      reader.skip(2);

      expect(reader.shiftDouble().toFixed(2)).toEqual('66.66');
    });
  });

  describe("readBits", function()
  {
    it("should throw if the specified offset is not a number", function()
    {
      var reader = new BufferReader(new Buffer([]));

      expect(function() { reader.readBits('ten', 1); }).toThrow();
    });

    it("should throw if the specified offset is less than 0", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));

      expect(function() { reader.readBits(-10, 1); }).toThrow();
    });
    
    it("should throw if the specified offset is greater than the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));

      expect(function() { reader.readBits(5, 1); }).toThrow();
    });

    it("should throw if the specified bit count is not a number", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2, 3]));

      expect(function() { reader.readBits(0, 'ten'); }).toThrow();
    });

    it("should throw if the specified bit count is less than 1", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2, 3]));

      expect(function() { reader.readBits(0, -10); }).toThrow();
    });

    it("should throw if the specified bit count is greater than the reader's length multiplied by 8", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));

      expect(function() { reader.readBits(0, 666); }).toThrow();
    });

    it("should throw if the sum of the specified offset and count exceeds the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));

      expect(function() { reader.readBits(1, 24); }).toThrow();
    });

    it("should return an array with the least significat bit from the next first byte if the specified bit count is 1", function()
    {
      var reader = new BufferReader(new Buffer([parseInt('00000001', 2)]));

      expect(reader.readBits(0, 1)).toEqual([true]);
    });

    it("should return the specified number of the next bits as an array", function()
    {
      var reader = new BufferReader(new Buffer([parseInt('01010101', 2)]));

      expect(reader.readBits(0, 8)).toEqual([true, false, true, false, true, false, true, false]);
    });

    it("should return the specified number of bits starting at the specified offset", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x01, parseInt('01010101', 2)]));

      expect(reader.readBits(2, 4)).toEqual([true, false, true, false]);
    });

    it("should not decrease the reader's length", function()
    {
      var buffer = new Buffer([
        parseInt('10101010', 2),
        parseInt('01010101', 2),
        parseInt('11100111', 2)
      ]);
      var reader = new BufferReader(buffer);

      reader.readBits(0, 11);

      expect(reader.length).toEqual(3);
    });
  });

  describe("readByte", function()
  {
    it("should throw if the reader is empty", function()
    {
      var reader = new BufferReader(new Buffer([]));

      expect(function() { reader.readByte(0); }).toThrow();
    });

    it("should throw if the specified offset is not a number", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));

      expect(function() { reader.readByte('ten'); }).toThrow();
    });

    it("should throw if the specified offset is less than 0", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));

      expect(function() { reader.readByte(-10); }).toThrow();
    });

    it("should throw if the specified offset is greater than the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));

      expect(function() { reader.readByte(5); }).toThrow();
    });

    it("should return the first byte if the specified offset is 0", function()
    {
      var reader = new BufferReader(new Buffer([3, 2, 1]));

      expect(reader.readByte(0)).toEqual(3);
    });
    
    it("should return a byte at the specified position", function()
    {
      var reader = new BufferReader(new Buffer([3, 2, 1]));

      expect(reader.readByte(2)).toEqual(1);
    });

    it("should not decrease the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([3, 2, 1]));

      reader.readByte(0);

      expect(reader.length).toEqual(3);
    });
  });

  describe("readChar", function()
  {
    it("should throw if the reader is empty", function()
    {
      var reader = new BufferReader(new Buffer([]));

      expect(function() { reader.readChar(0); }).toThrow();
    });

    it("should throw if the specified offset is not a number", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));

      expect(function() { reader.readChar('ten'); }).toThrow();
    });

    it("should throw if the specified offset is less than 0", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));

      expect(function() { reader.readChar(-10); }).toThrow();
    });

    it("should throw if the specified offset is greater than the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));

      expect(function() { reader.readChar(5); }).toThrow();
    });

    it("should return the first byte as an ASCII character if the specified offset is 0", function()
    {
      var reader = new BufferReader(new Buffer('zyx'));

      expect(reader.readChar(0)).toEqual('z');
    });

    it("should return the byte at the specified offset as an ASCII character", function()
    {
      var reader = new BufferReader(new Buffer('zyx'));

      expect(reader.readChar(1)).toEqual('y');
    });

    it("should not decrease the reader's length", function()
    {
      var reader = new BufferReader(new Buffer('xyz'));

      reader.readChar(0);

      expect(reader.length).toEqual(3);
    });
  });

  describe("readBytes", function()
  {
    it("should throw if the specified offset is not a number", function()
    {
      var reader = new BufferReader(new Buffer([]));

      expect(function() { reader.readBytes('ten', 1); }).toThrow();
    });

    it("should throw if the specified offset is less than 0", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));

      expect(function() { reader.readBytes(-1, 1); }).toThrow();
    });

    it("should throw if the specified offset is greater than the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));

      expect(function() { reader.readBytes(5, 1); }).toThrow();
    });

    it("should throw if the specified byte count is not a number", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2, 3]));

      expect(function() { reader.readBytes(0, 'ten'); }).toThrow();
    });

    it("should throw if the specified byte count is less than 1", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2, 3]));

      expect(function() { reader.readBytes(0, 0); }).toThrow();
    });

    it("should throw if the specified byte count is greater than the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));

      expect(function() { reader.readBytes(0, 666); }).toThrow();
    });

    it("should return the next first byte as an array if the specified byte count is 1 and offset is 0", function()
    {
      var reader = new BufferReader(new Buffer([3, 2, 1]));

      expect(reader.readBytes(0, 1)).toEqual([3]);
    });

    it("should return the specified number of the next bytes as an array starting at the specified position", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2, 3, 4, 5]));

      expect(reader.readBytes(3, 3)).toEqual([3, 4, 5]);
    });

    it("should not decrease the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2, 3, 4, 5]));

      reader.readBytes(0, 3);

      expect(reader.length).toEqual(6);
    });
  });

  describe("readBuffer", function()
  {
    it("should throw if the specified offset is not a number", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));

      expect(function() { reader.readBuffer('ten', 1); }).toThrow();
    });

    it("should throw if the specified offset is less than 0", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));

      expect(function() { reader.readBuffer(-1, 1); }).toThrow();
    });

    it("should throw if the specified offset is greater than the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));

      expect(function() { reader.readBuffer(5, 1); }).toThrow();
    });

    it("should throw if the specified byte count is not a number", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2, 3]));

      expect(function() { reader.readBuffer(0, 'ten'); }).toThrow();
    });

    it("should throw if the specified byte count is less than 1", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2, 3]));

      expect(function() { reader.readBuffer(0, -10); }).toThrow();
    });

    it("should throw if the specified byte count is greater than the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));

      expect(function() { reader.readBuffer(0, 666); }).toThrow();
    });

    it("should return the next first byte as an instance of Buffer if the specified byte count is 1 and offset is 0", function()
    {
      var reader = new BufferReader(new Buffer([3, 2, 1]));

      var resultBuffer = reader.readBuffer(0, 1);

      expect(resultBuffer instanceof Buffer).toBeTruthy();
      expect(Array.prototype.slice.call(resultBuffer)).toEqual([3]);
    });

    it("should return the specified number of the next bytes as an instance of Buffer starting at the specified position", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2, 3, 4, 5]));
      
      var resultBuffer = reader.readBuffer(1, 3);

      expect(resultBuffer instanceof Buffer).toBeTruthy();
      expect(Array.prototype.slice.call(resultBuffer)).toEqual([1, 2, 3]);
    });

    it("should not decrease the reader's length by the specified byte count", function()
    {
      var buffer = new Buffer([0, 1, 2, 3, 4, 5]);
      var reader = new BufferReader(buffer);

      reader.readBuffer(0, 3);

      expect(reader.length).toEqual(buffer.length);
    });
  });

  describe("readString", function()
  {
    it("should throw if the specified offset is not a number", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));

      expect(function() { reader.readString('ten', 1); }).toThrow();
    });

    it("should throw if the specified offset is less than 0", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));

      expect(function() { reader.readString(-1, 1); }).toThrow();
    });

    it("should throw if the specified offset is greater than the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));

      expect(function() { reader.readString(5, 1); }).toThrow();
    });

    it("should throw if the specified length is not a number", function()
    {
      var reader = new BufferReader(new Buffer('omghi2u'));

      expect(function() { reader.readString(0, 'ten'); }).toThrow();
    });

    it("should throw if the specified length is less than 1", function()
    {
      var reader = new BufferReader(new Buffer('omghi2u'));

      expect(function() { reader.readString(0, -10); }).toThrow();
    });

    it("should throw if the specified length is greater than the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));

      expect(function() { reader.readString(0, 666); }).toThrow();
    });

    it("should throw if the specified encoding is not supported", function()
    {
      var reader = new BufferReader(new Buffer('omghi2u'));

      expect(function() { reader.readString(0, 3, 'utf-666'); }).toThrow();
    });

    it("should return a string of the specified length and in the UTF-8 encoding", function()
    {
      var reader = new BufferReader(new Buffer('omghi2u'));

      expect(reader.readString(0, 3, 'utf8')).toEqual('omg');
    });

    it("should return a string of the specified length and in the ASCII encoding", function()
    {
      var reader = new BufferReader(new Buffer('ómgh€u', 'ascii'));

      expect(reader.readString(0, 6, 'ascii')).toEqual('\uFFFDmgh\uFFFDu');
    });

    it("should not decrease the reader's length", function()
    {
      var reader = new BufferReader(new Buffer('omghi2u'));

      reader.readString(0, 5);

      expect(reader.length).toEqual('omghi2u'.length);
    });

    it("should read starting from the specified position", function()
    {
      var reader = new BufferReader(new Buffer('omg hi 2 u'));

      expect(reader.readString(4, 2)).toEqual('hi');
    });
  });

  describe("readZeroString", function()
  {
    it("should throw if the specified offset is not a number", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));

      expect(function() { reader.readZeroString('ten'); }).toThrow();
    });

    it("should throw if the specified offset is less than 0", function()
    {
      var reader = new BufferReader(new Buffer([1, 2, 3]));

      expect(function() { reader.readZeroString(-1); }).toThrow();
    });

    it("should throw if the specified offset is greater than the reader's length", function()
    {
      var reader = new BufferReader(new Buffer('o\0mg'));

      expect(function() { reader.readZeroString(5); }).toThrow();
    });

    it("should throw if the specified encoding is not supported", function()
    {
      var reader = new BufferReader(new Buffer('omghi2u\0too'));

      expect(function() { reader.readZeroString(0, 'utf-666'); }).toThrow();
    });

    it("should return a string up to a NULL character in the specified encoding", function()
    {
      var reader = new BufferReader(new Buffer('omghi2u\0too'));

      expect(reader.readZeroString(0, 'utf8')).toEqual('omghi2u');
    });

    it("should not decrease the reader's length", function()
    {
      var reader = new BufferReader(new Buffer('omghi2u\0too'));

      reader.readZeroString(0);

      expect(reader.length).toEqual('omghi2u\0too'.length);
    });

    it("should return an empty string if NULL character is not found", function()
    {
      var reader = new BufferReader(new Buffer('omghi2u'));

      expect(reader.readZeroString(0)).toEqual('');
    });

    it("should return an empty string if NULL character is at the specified offset", function()
    {
      var reader = new BufferReader(new Buffer('o\u0000mghi2u'));

      expect(reader.readZeroString(1)).toEqual('');
    });

    it("should read starting from the specified position", function()
    {
      var reader = new BufferReader(new Buffer('omg hi 2 u\u0000 2'));

      expect(reader.readZeroString(4)).toEqual('hi 2 u');
    });
  });

  describe("readInt8", function()
  {
    it("should throw if the reader is empty", function()
    {
      var reader = new BufferReader(new Buffer([]));

      expect(function() { reader.readInt8(0); }).toThrow();
    });

    it("should throw if the specified offset is out of reader's bounds", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2]));

      expect(function() { reader.readInt8(10); }).toThrow();
    });

    it("should return the next positive 8 bit integer", function()
    {
      var reader = new BufferReader(new Buffer([0x42, 0x00]));

      expect(reader.readInt8(0)).toEqual(66);
    });

    it("should return the next negative 8 bit integer", function()
    {
      var reader = new BufferReader(new Buffer([0xBE, 0x00, 0x00]));

      expect(reader.readInt8(0)).toEqual(-66);
    });

    it("should return the lower bound value of -128 if the next byte is 0x80", function()
    {
      var reader = new BufferReader(new Buffer([0x80, 0x00, 0x00]));

      expect(reader.readInt8(0)).toEqual(-128);
    });

    it("should return the upper bound value of 127 if the next byte is 0x7F", function()
    {
      var reader = new BufferReader(new Buffer([0x7F, 0x00, 0x00]));

      expect(reader.readInt8(0)).toEqual(127);
    });

    it("should return a value of 0 if the next byte is 0x00", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x00]));

      expect(reader.readInt8(0)).toEqual(0);
    });

    it("should return a value of -1 if the next byte is 0xFF", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0x00, 0x00]));

      expect(reader.readInt8(0)).toEqual(-1);
    });

    it("should not decrease the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0x00, 0x00]));

      reader.readInt8(0);

      expect(reader.length).toEqual(3);
    });

    it("should read starting from the specified position", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x01, 0x42]));

      expect(reader.readInt8(2)).toEqual(66);
    });
  });

  describe("readInt16", function()
  {
    it("should throw if the reader is empty", function()
    {
      var reader = new BufferReader(new Buffer([]));

      expect(function() { reader.readInt16(0); }).toThrow();
    });

    it("should throw if the reader does not have at least 2 bytes after the specified offset", function()
    {
      var reader = new BufferReader(new Buffer([0x01, 0x02]));

      expect(function() { reader.readInt16(1); }).toThrow();
    });

    it("should return the next positive 16 bit integer", function()
    {
      var reader = new BufferReader(new Buffer([0x02, 0x9A, 0x00, 0x01, 0x00, 0x02]));

      expect(reader.readInt16(0)).toEqual(666);
    });

    it("should return the next negative 16 bit integer", function()
    {
      var reader = new BufferReader(new Buffer([0xFD, 0x66, 0x00, 0x01, 0x00, 0x02]));
      
      expect(reader.readInt16(0)).toEqual(-666);
    });

    it("should return the lower bound value of -32768 if the next two bytes are 0x8000", function()
    {
      var reader = new BufferReader(new Buffer([0x80, 0x00, 0x00, 0x01]));

      expect(reader.readInt16(0)).toEqual(-32768);
    });

    it("should return the upper bound value of 32767 if the next two bytes are 0x7FFF", function()
    {
      var reader = new BufferReader(new Buffer([0x7F, 0xFF, 0x00, 0x01]));

      expect(reader.readInt16(0)).toEqual(32767);
    });

    it("should return a value of 0 if the next byte two bytes are 0x0000", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x01, 0x01]));

      expect(reader.readInt16(0)).toEqual(0);
    });

    it("should return a value of -1 if the next two bytes are 0xFFFF", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0xFF, 0x00]));

      expect(reader.readInt16(0)).toEqual(-1);
    });

    it("should not decrease the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0x00, 0x00]));

      reader.readInt16(0);

      expect(reader.length).toEqual(3);
    });

    it("should use little endian if specified so", function()
    {
      var reader = new BufferReader(new Buffer([0x66, 0xFD, 0x00, 0x01, 0x00, 0x02]));

      expect(reader.readInt16(0, true)).toEqual(-666);
    });

    it("should read starting from the specified position", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x01, 0x02, 0x9A, 0x01]));

      expect(reader.readInt16(2)).toEqual(666);
    });
  });

  describe("readInt32", function()
  {
    it("should throw if the reader is empty", function()
    {
      var reader = new BufferReader(new Buffer([]));

      expect(function() { reader.readInt32(0); }).toThrow();
    });

    it("should throw if the reader does not have at least 4 bytes after the specified position", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x01, 0x02, 0x03]));

      expect(function() { reader.readInt32(1); }).toThrow();
    });

    it("should return the next positive 32 bit integer", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x02, 0x9A, 0x00, 0x01]));

      expect(reader.readInt32(0)).toEqual(666);
    });

    it("should return the next negative 32 bit integer", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0xFF, 0xFD, 0x66, 0x00, 0x01]));

      expect(reader.readInt32(0)).toEqual(-666);
    });

    it("should return the lower bound value of -2147483648 if the next four bytes are 0x80000000", function()
    {
      var reader = new BufferReader(new Buffer([0x80, 0x00, 0x00, 0x00, 0x01]));

      expect(reader.readInt32(0)).toEqual(-2147483648);
    });

    it("should return the upper bound value of 2147483647 if the next four bytes are 0x7FFFFFFF", function()
    {
      var reader = new BufferReader(new Buffer([0x7F, 0xFF, 0xFF, 0xFF, 0x01]));

      expect(reader.readInt32(0)).toEqual(2147483647);
    });

    it("should return a value of 0 if the next byte four bytes are 0x00000000", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x00, 0x00, 0x01]));

      expect(reader.readInt32(0)).toEqual(0);
    });

    it("should return a value of -1 if the next four bytes are 0xFFFFFFFF", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0xFF, 0xFF, 0xFF, 0x00]));

      expect(reader.readInt32(0)).toEqual(-1);
    });

    it("should not decrease the reader's length by four", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0x00, 0x00, 0xFF, 0x01, 0x02]));

      reader.readInt32(0);

      expect(reader.length).toEqual(6);
    });

    it("should use little endian if specified so", function()
    {
      var reader = new BufferReader(new Buffer([0x66, 0xFD, 0xFF, 0xFF, 0x01, 0x00]));

      expect(reader.readInt32(0, true)).toEqual(-666);
    });

    it("should read starting from the specified position", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x01, 0x00, 0x00, 0x02, 0x9A, 0x01]));

      expect(reader.readInt32(2)).toEqual(666);
    });
  });

  describe("readUInt8", function()
  {
    it("should throw if the reader is empty", function()
    {
      var reader = new BufferReader(new Buffer([]));

      expect(function() { reader.readUInt8(0); }).toThrow();
    });

    it("should throw if the specified offset is out of the reader's bounds", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2]));

      expect(function() { reader.readUInt8(10); }).toThrow();
    });

    it("should return the next unsigned 8 bit integer", function()
    {
      var reader = new BufferReader(new Buffer([0x42, 0x00, 0x00]));

      expect(reader.readUInt8(0)).toEqual(66);
    });

    it("should return the lower bound value of 0 if the next byte is 0x00", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x01, 0x02]));

      expect(reader.readUInt8(0)).toEqual(0);
    });

    it("should return the upper bound value of 255 if the next byte is 0xFF", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0x00, 0x00]));

      expect(reader.readUInt8(0)).toEqual(255);
    });

    it("should return a value of 0 if the next byte is 0x00", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x01, 0x02]));

      expect(reader.readUInt8(0)).toEqual(0);
    });

    it("should not decrease the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0x00, 0x00]));

      reader.readUInt8(0);

      expect(reader.length).toEqual(3);
    });

    it("should read starting from the specified position", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x01, 0x42]));

      expect(reader.readUInt8(2)).toEqual(66);
    });
  });

  describe("readUInt16", function()
  {
    it("should throw if the reader is empty", function()
    {
      var reader = new BufferReader(new Buffer([]));

      expect(function() { reader.readUInt16(0); }).toThrow();
    });

    it("should throw if the specified offset is out of the reader's bounds", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2]));

      expect(function() { reader.readUInt16(10); }).toThrow();
    });

    it("should throw if the reader does not have at least 2 bytes after the specified position", function()
    {
      var reader = new BufferReader(new Buffer([0x01, 0x01]));

      expect(function() { reader.readUInt16(1); }).toThrow();
    });

    it("should return the next unsigned 16 bit integer", function()
    {
      var reader = new BufferReader(new Buffer([0x02, 0x9A, 0x00, 0x01]));

      expect(reader.readUInt16(0)).toEqual(666);
    });

    it("should return the lower bound value of 0 if the next two bytes are 0x0000", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x01, 0x01]));

      expect(reader.readUInt16(0)).toEqual(0);
    });

    it("should return the upper bound value of 65535 if the next two bytes are 0xFFFF", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0xFF, 0x00, 0x01]));

      expect(reader.readUInt16(0)).toEqual(65535);
    });

    it("should return a value of 0 if the next two bytes are 0x0000", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x01, 0x01]));

      expect(reader.readUInt16(0)).toEqual(0);
    });

    it("should not decrease the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0x00, 0x00]));

      reader.readUInt16(0);

      expect(reader.length).toEqual(3);
    });

    it("should use little endian if specified so", function()
    {
      var reader = new BufferReader(new Buffer([0x9A, 0x02, 0x00, 0x01]));

      expect(reader.readUInt16(0, true)).toEqual(666);
    });

    it("should read starting from the specified position", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x01, 0x00, 0x42]));

      expect(reader.readUInt16(2)).toEqual(66);
    });
  });

  describe("readUInt32", function()
  {
    it("should throw if the reader is empty", function()
    {
      var reader = new BufferReader(new Buffer([]));

      expect(function() { reader.readUInt32(0); }).toThrow();
    });

    it("should throw if the specified offset is out of the reader's bounds", function()
    {
      var reader = new BufferReader(new Buffer([0, 1, 2]));

      expect(function() { reader.readUInt32(10); }).toThrow();
    });

    it("should throw if the reader does not have at least 4 bytes after the specified position", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x01, 0x02]));

      expect(function() { reader.readUInt32(1); }).toThrow();
    });

    it("should return the next unsigned 32 bit integer", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x02, 0x9A, 0x00, 0x01]));

      expect(reader.readUInt32(0)).toEqual(666);
    });

    it("should return the lower bound value of 0 if the next four bytes are 0x00000000", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x00, 0x00, 0x01]));

      expect(reader.readUInt32(0)).toEqual(0);
    });

    it("should return the upper bound value of 4294967295 if the next four bytes are 0xFFFFFFFF", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0xFF, 0xFF, 0xFF, 0x01]));

      expect(reader.readUInt32(0)).toEqual(4294967295);
    });

    it("should return a value of 0 if the next byte four bytes are 0x00000000", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x00, 0x00, 0x01]));

      expect(reader.readUInt32(0)).toEqual(0);
    });

    it("should not decrease the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0x00, 0x00, 0xFF, 0x01, 0x02]));

      reader.readUInt32(0);

      expect(reader.length).toEqual(6);
    });

    it("should use little endian if specified so", function()
    {
      var reader = new BufferReader(new Buffer([0x9A, 0x02, 0x00, 0x00, 0x01, 0x00]));

      expect(reader.readUInt32(0, true)).toEqual(666);
    });

    it("should read starting from the specified position", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x01, 0x00, 0x00, 0x02, 0x9A, 0x00, 0x01]));

      expect(reader.readUInt32(2)).toEqual(666);
    });
  });

  describe("readFloat", function()
  {
    it("should throw if the reader is empty", function()
    {
      var reader = new BufferReader(new Buffer([]));

      expect(function() { reader.readFloat(0); }).toThrow();
    });

    it("should throw if the reader does not have at least 4 bytes after the specified position", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x01, 0x02, 0x03]));

      expect(function() { reader.readFloat(1); }).toThrow();
    });

    it("should return the next positive float", function()
    {
      var reader = new BufferReader(new Buffer([0x42, 0x85, 0x51, 0xEC]));

      expect(reader.readFloat(0).toFixed(2)).toEqual('66.66');
    });

    it("should return the next negative float", function()
    {
      var reader = new BufferReader(new Buffer([0xC2, 0x85, 0x51, 0xEC]));

      expect(reader.readFloat(0).toFixed(2).toString()).toEqual('-66.66');
    });

    it("should return the lower bound value of -3.4028234663852886e+38 if the next four bytes are 0xFF7FFFFF", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0x7F, 0xFF, 0xFF]));

      expect(reader.readFloat(0)).toEqual(-3.4028234663852886e+38);
    });

    it("should return the upper bound value of 3.4028234663852886e+38 if the next four bytes are 0x7F7FFFFF", function()
    {
      var reader = new BufferReader(new Buffer([0x7F, 0x7F, 0xFF, 0xFF]));

      expect(reader.readFloat(0)).toEqual(3.4028234663852886e+38);
    });

    it("should return a value of 0 if the next two bytes are 0x00000000", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x00, 0x00]));

      expect(reader.readFloat(0)).toEqual(0);
    });

    it("should not decrease the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0x00, 0x00, 0x01]));

      reader.readFloat(0);

      expect(reader.length).toEqual(4);
    });

    it("should use little endian if specified so", function()
    {
      var reader = new BufferReader(new Buffer([0xEC, 0x51, 0x85, 0x42]));

      expect(reader.readFloat(0, true).toFixed(2)).toEqual('66.66');
    });

    it("should read starting from the specified position", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x01, 0x42, 0x85, 0x51, 0xEC, 0x00]));

      expect(reader.readFloat(2).toFixed(2)).toEqual('66.66');
    });
  });

  describe("readDouble", function()
  {
    it("should throw if the reader is empty", function()
    {
      var reader = new BufferReader(new Buffer([]));

      expect(function() { reader.readDouble(0); }).toThrow();
    });

    it("should throw if the reader does not have at least 8 bytes after the specified position", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]));

      expect(function() { reader.readDouble(1); }).toThrow();
    });

    it("should return the next positive float", function()
    {
      var reader = new BufferReader(new Buffer([0x40, 0x50, 0xAA, 0x3D, 0x70, 0xA3, 0xD7, 0x0A]));

      expect(reader.readDouble(0).toFixed(2)).toEqual('66.66');
    });

    it("should return the next negative float", function()
    {
      var reader = new BufferReader(new Buffer([0xC0, 0x50, 0xAA, 0x3D, 0x70, 0xA3, 0xD7, 0x0A]));

      expect(reader.readDouble(0).toFixed(2).toString()).toEqual('-66.66');
    });

    it("should return the lower bound value of -1.7976931348623157E+308 if the next four bytes are 0xFFEFFFFFFFFFFFFF", function()
    {
      var reader = new BufferReader(new Buffer([0xFF, 0xEF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]));

      expect(reader.readDouble(0)).toEqual(-1.7976931348623157E+308);
    });

    it("should return the upper bound value of 1.7976931348623157E+308 if the next eight bytes are 0x7FEFFFFFFFFFFFFF", function()
    {
      var reader = new BufferReader(new Buffer([0x7F, 0xEF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]));

      expect(reader.readDouble(0)).toEqual(1.7976931348623157E+308);
    });

    it("should return a value of 0 if the next two bytes are 0x0000000000000000", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));

      expect(reader.readDouble(0)).toEqual(0);
    });

    it("should not decrease the reader's length", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));

      reader.readDouble(0);

      expect(reader.length).toEqual(8);
    });

    it("should use little endian if specified so", function()
    {
      var reader = new BufferReader(new Buffer([0x0A, 0xD7, 0xA3, 0x70, 0x3D, 0xAA, 0x50, 0x40]));

      expect(reader.readDouble(0, true).toFixed(2)).toEqual('66.66');
    });

    it("should read starting from the specified position", function()
    {
      var reader = new BufferReader(new Buffer([0x00, 0x40, 0x50, 0xAA, 0x3D, 0x70, 0xA3, 0xD7, 0x0A, 0x00]));

      expect(reader.readDouble(1).toFixed(2)).toEqual('66.66');
    });
  });
});
