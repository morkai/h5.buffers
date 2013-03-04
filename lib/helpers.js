'use strict';

/**
 * @private
 * @param {Array.<number>} byteArray
 * @param {number} bitCount
 * @returns {Array.<boolean>}
 */
exports.toBits = function(byteArray, bitCount)
{
  var bitArray = [];
  var byteCount = byteArray.length;

  for (var byteIndex = 0; byteIndex < byteCount; ++byteIndex)
  {
    var byteValue = byteArray[byteIndex];

    for (var bitIndex = 0; bitIndex < 8; ++bitIndex)
    {
      if (bitArray.length === bitCount)
      {
        break;
      }

      bitArray.push(Boolean(byteValue & Math.pow(2, bitIndex)));
    }
  }

  return bitArray;
};
