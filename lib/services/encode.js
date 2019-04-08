"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var Encode = function Encode() {
  var _this = this;

  (0, _classCallCheck2["default"])(this, Encode);

  /**
   * Encode
   * @param string: String - String to be decoded
   * @param protocol: String - options [ 'rfc3986', 'rfc1738' ] More could be added later
   * @param encodeNull: Boolean - if false, null is not specially handled
   * @returns encodedString: String - Defined by selected protocol
   */
  this.encode = function (string) {
    var protocol = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'rfc3986';
    var encodeNull = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    return _this[protocol + 'Encode'](string, encodeNull);
  };
  /**
   * Decode
   * @param string: String - String to be decoded
   * @param protocol: String - options [ 'rfc3986', 'rfc1738' ] More could be added later
   * @param decodeNull: Boolean - if false, null is not specially handled
   * @returns decodedString: String - Defined by selected protocol
   */


  this.decode = function (string) {
    var protocol = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'rfc3986';
    var decodeNull = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    return _this[protocol + 'Decode'](string, decodeNull);
  };
  /**
   * RFC 3986 Encode
   * @reserved -._~
   * @param string: String - String to be encoded
   * @param encodeNull: boolean - If false null is converted to 'null' else it will be '%00'
   * @returns encodedString: String - RFC 3986 Encoded string
   */


  this.rfc3986Encode = function (string) {
    var encodeNull = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    // null should be specialy handled if used
    if (string === null && encodeNull) {
      string = '%00';
    } else {
      // Unescaped: -._~!*'()
      string = encodeURIComponent(string); // Escape !*'()

      string = string.replace(/!/g, '%21').replace(/\*/g, '%2A').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');
    }

    return string;
  };
  /**
   * RFC 3986 Decode
   * @param string: String - String to be decoded
   * @param decodeNull: boolean - If false %00 is converted to empty string else it will be null
   * @returns decodedString: String - RFC 3986 Decoded string
   */


  this.rfc3986Decode = function (string) {
    var decodeNull = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    // null should be specialy handled
    if (string === '%00' && decodeNull) {
      return null;
    } else {
      return decodeURIComponent(string);
    }
  };
  /**
   * RFC 1738 Encode
   * @reserved -._~
   * @param string: String - String to be encoded
   * @param encodeNull: boolean - If false null is converted to 'null' else it will be '%00'
   * @returns encodedString: String - RFC 1738 Encoded string
   */


  this.rfc1738Encode = function (string) {
    var encodeNull = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    string = _this.rfc3986Encode(string, encodeNull);
    string = string.replace(/%20/g, '+');
    return string;
  };
  /**
   * RFC 1738 Decode
   * @param string: String - String to be decoded
   * @param decodeNull: boolean - If false %00 is converted to empty string else it will be null
   * @returns decodedString: String - RFC 1738 Decoded string
   */


  this.rfc1738Decode = function (string) {
    var decodeNull = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    string = string.replace(/\+/g, '%20');
    string = _this.rfc3986Decode(string, decodeNull);
    return string;
  };
};

var _default = new Encode();

exports["default"] = _default;