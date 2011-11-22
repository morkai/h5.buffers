var BufferBuilder = require('../lib/BufferBuilder');
var BufferReader = require('../lib/BufferReader');

describe("functional tests", function()
{
  it("should build and read MODBUS TCP frame", function()
  {
    var transactionId = 0xABCD;
    var protocolId = 0x0000;
    var length = 6;
    var unitId = 0x0F;
    var functionCode = 0x03;
    var address = 0x1000;
    var quantity = 0x0001;

    var builder = new BufferBuilder();

    builder
      .pushUInt16(transactionId)
      .pushUInt16(protocolId)
      .pushUInt16(length)
      .pushByte(unitId)
      .pushByte(functionCode)
      .pushUInt16(address)
      .pushUInt16(quantity);

    var reader = new BufferReader(builder.toBuffer());

    expect(reader.shiftUInt16()).toEqual(transactionId);
    expect(reader.shiftUInt16()).toEqual(protocolId);
    expect(reader.shiftUInt16()).toEqual(length);
    expect(reader.shiftByte()).toEqual(unitId);
    expect(reader.shiftByte()).toEqual(functionCode);
    expect(reader.shiftUInt16()).toEqual(address);
    expect(reader.shiftUInt16()).toEqual(quantity);
  });

  it("should build and read CoAP frame", function()
  {
    var version = '01';
    var type = '00';
    var optionCount = '0010';
    var code = 2;
    var messageId = 0xABCD;
    var optionDelta1 = '0101';
    var optionLength1 = '1111';
    var optionValue1 = 'really-long-value-for-uri-host-option';
    var optionExtraLength1 = Buffer.byteLength(optionValue1) - 15;
    var optionDelta2 = '0010';
    var optionLength2 = '0010';
    var optionValue2 = 5683;
    var payload = 'abc=def ghi=jkl';

    var builder = new BufferBuilder();

    builder
      .pushByte(parseInt(version + type + optionCount, 2))
      .pushUInt8(code)
      .pushUInt16(messageId)
      .pushByte(parseInt(optionDelta1 + optionLength1, 2))
      .pushUInt8(optionExtraLength1)
      .pushString(optionValue1)
      .pushByte(parseInt(optionDelta2 + optionLength2, 2))
      .pushUInt16(optionValue2)
      .pushString(payload);

    var reader = new BufferReader(builder.toBuffer());

    function shiftBits(count)
    {
      return reader.shiftBits(count).map(Number).reverse().join('');
    }

    expect(shiftBits(8)).toEqual(version + type + optionCount);
    expect(reader.shiftUInt8()).toEqual(code);
    expect(reader.shiftUInt16()).toEqual(messageId);
    expect(shiftBits(8)).toEqual(optionDelta1 + optionLength1);
    expect(reader.shiftUInt8()).toEqual(optionExtraLength1);
    expect(reader.shiftString(optionExtraLength1 + 15)).toEqual(optionValue1);
    expect(shiftBits(8)).toEqual(optionDelta2 + optionLength2);
    expect(reader.shiftUInt16()).toEqual(optionValue2);
    expect(reader.shiftString(reader.length)).toEqual(payload);
  });

  it("should build and read bits", function()
  {
    var number = 0xABCDEF;
    var bitsString = number.toString(2);
    var bitsArray = bitsString.split('').map(Number);

    var builder = new BufferBuilder();
    var buffer = builder.pushBits(bitsArray).toBuffer();
    var reader = new BufferReader(buffer);

    var actualBitsArray = reader.readBits(0, bitsArray.length).map(Number);

    expect(actualBitsArray).toEqual(bitsArray);
  });
});
