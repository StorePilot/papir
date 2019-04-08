"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clone = exports["default"] = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _encode2 = _interopRequireDefault(require("./encode"));

var _moment = _interopRequireDefault(require("moment"));

var Util = function Util() {
  var _this = this;

  (0, _classCallCheck2["default"])(this, Util);

  this.timestamp = function () {
    var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 30;
    var now = '';

    while (now.length < length) {
      now += '0';
    }

    now = (String(new Date().getTime()) + now).substring(0, length);
    return Number(now);
  };

  this.nonce = function () {
    var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 6;
    var nonce = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
      nonce += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return nonce;
  };

  this.stripUri = function (url) {
    var a = document.createElement('a');
    a.setAttribute('href', url);
    return a.protocol + '//' + a.host + a.pathname;
  };

  this.getParams = function (url) {
    var delimiter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '&';
    var splitter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '=';
    var divider = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '?';
    var params = [];
    var split = url.split(divider);

    if (typeof split[1] !== 'undefined') {
      var queries = split[1].split(delimiter);
      queries.forEach(function (q) {
        q = q.split(splitter);

        if (q.length === 2) {
          params.push({
            key: q[0],
            value: q[1]
          });
        } else {
          params.push({
            key: q[0],
            value: ''
          });
        }
      });
    }

    return params;
  };

  this.querystring = {
    /**
     *
     * @param value: any Value to be appended to name. Takes also JSON strings
     * @param options: any Takes also JSON strings
     * @param options.name: String Name to be appended a value
     * @param options.protocol: String URL / Percentage encode protocol. options [ 'rfc3986', 'rfc1738' ]
     * @param options.dateFormat: String @see http://momentjs.com
     * @param options.keepEmpty: boolean Keep or remove keys with empty values
     * @param first: boolean
     * @returns querystring - Ex.: 'name=val1&name2[]=val2&name2[]=val3&name3[name4]=val4&name3[name5][]=val5'
     */
    stringify: function stringify() {
      var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      var options = arguments.length > 1 ? arguments[1] : undefined;
      var first = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
      options = Object.assign({
        name: null,
        protocol: 'rfc3986',
        encodeNull: true,
        dateFormat: '',
        // Default ISO 8601
        keepEmpty: true,
        keepEmptyInArrays: true,
        keepEmptyArray: true,
        keepNull: true,
        keepNullInArrays: true,
        delimiter: '&',
        splitter: '=',
        dotNotation: false,
        encodeNames: true,
        encodeValues: true,
        indexArrays: true,
        excludes: [],
        // At first level
        includes: [],
        // At first level. includes overrides excludes
        arrayIndexOpen: '[',
        arrayIndexClose: ']',
        emptyArrayToZero: false,
        keepArrayTags: true
      }, options);
      var querystring = '';
      var name = options.name;
      var error = false;

      if (first && name !== null && typeof name === 'string' && options.excludes.indexOf(name) !== -1 && options.includes.indexOf(name) === -1) {
        options.name = null;
      }

      if (first && options.encodeNames && name !== null) {
        name = _encode2["default"].encode(name, options.protocol, options.encodeNull);
      }

      try {
        if (value !== '""') {
          value = JSON.parse(value);
        }
      } catch (e) {} finally {
        if (typeof value === 'undefined' && name !== null) {// undefined
        } else if (value === null && name !== null) {// null
        } else if (typeof value === 'string' && name !== null) {// string
        } else if (typeof value === 'number' && name !== null) {// number
        } else if (typeof value === 'boolean' && name !== null) {// boolean
        } else if (typeof value === 'function' && name !== null) {
          // function
          value = value.toString();
        } else if (value.constructor === Date && name !== null) {
          // date
          value = (0, _moment["default"])(value).format(options.dateFormat);
        } else if (value.constructor === Array && name !== null) {
          var i = 0; // Handle empty arrays @todo - Make customable values. Ex. null, '', '[]', 0 or delete it etc.

          if (value.length !== 0) {
            value.forEach(function (val) {
              var arrayIdentifier = options.arrayIndexOpen + (options.indexArrays ? i : '') + options.arrayIndexClose;
              querystring += _this.querystring.stringify(val, Object.assign(options, {
                name: name + (options.encodeNames ? _encode2["default"].encode(arrayIdentifier, options.protocol, options.encodeNull) : arrayIdentifier)
              }), false);
              i++;
            });
          } // Array

        } else if (value.constructor === Object) {
          Object.keys(value).forEach(function (key) {
            if (options.excludes.indexOf(key) === -1 || options.includes.indexOf(key) !== -1 || !first) {
              if (name === null) {
                querystring += _this.querystring.stringify(value[key], Object.assign(options, {
                  name: options.encodeNames ? _encode2["default"].encode(key, options.protocol, options.encodeNull) : key
                }), false);
              } else {
                var keyConverted = options.dotNotation ? '.' + key : options.arrayIndexOpen + key + options.arrayIndexClose;
                keyConverted = options.encodeNames ? _encode2["default"].encode(keyConverted, options.protocol, options.encodeNull) : keyConverted;
                querystring += _this.querystring.stringify(value[key], Object.assign(options, {
                  name: name + keyConverted
                }), false);
              }
            }
          }); // Object
        } else {
          /* console.error({
            message: 'Unknown datatype. Could not stringify value to querystring',
            data: options
          }) */
          error = true; // Unknown
        }

        if (!error && (value === null || value.constructor !== Array && value.constructor !== Object)) {
          if (name !== null && name !== '' && value !== '') {
            if (options.encodeValues && (value !== null || options.keepNull)) {
              value = _encode2["default"].encode(value, options.protocol, options.encodeNull);
            }

            if (value === '' && (options.keepEmpty || options.keepEmptyInArrays && !first)) {
              querystring += name + options.splitter + value + options.delimiter;
            } else if (value !== '' && (options.keepNull || value !== null || options.keepNullInArrays && !first)) {
              querystring += name + options.splitter + value + options.delimiter;
            }
          } else if (name !== null && name !== '' && options.keepEmpty) {
            querystring += name + options.splitter + options.delimiter;
          } else if (name !== null && name !== '' && options.keepEmptyInArrays && !first) {
            querystring += name + options.splitter + options.delimiter;
          }
        } else if (!error && value.constructor === Array && value.length === 0) {
          if (options.keepEmptyArray) {
            value = null;

            if (options.emptyArrayToZero) {
              value = 0;
            } else if (!options.keepNull) {
              value = '';
            }

            if (options.encodeValues) {
              value = _encode2["default"].encode(value, options.protocol, options.encodeNull);
            }

            var arrayIdentifier = options.arrayIndexOpen + (options.indexArrays ? 0 : '') + options.arrayIndexClose;
            var key = '';

            if (options.keepArrayTags) {
              key = options.encodeNames ? _encode2["default"].encode(arrayIdentifier, options.protocol, options.encodeNull) : arrayIdentifier;
            }

            querystring += name + key + options.splitter + value + options.delimiter;
          }
        }
      } // Remove last delimiter


      if (first && querystring !== '') {
        querystring = querystring.slice(0, -1);
      }

      return querystring;
    },

    /**
     *
     * @see https://jsfiddle.net/b4su0jvs/48/
     * @param querystring
     * @param delimiter
     * @param splitter
     * @param divider
     * @param indexEncodedArrays
     * @returns {*}
     */
    indexArrays: function indexArrays(querystring) {
      var delimiter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '&';
      var splitter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '=';
      var divider = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '?';
      var indexEncodedArrays = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
      var preserved = '';
      var qIndex = querystring.indexOf(divider);

      if (qIndex !== -1) {
        preserved = querystring.substr(0, qIndex + 1);
        querystring = querystring.substr(qIndex + 1);
      }

      var params = querystring.split(delimiter);

      var doIndexing = function doIndexing(params) {
        var arrStart = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '[';
        var arrEnd = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : ']';
        var arrUnindexed = arrStart + arrEnd;
        var indices = [];
        var prevKey = '';
        var parsed = [];
        params.forEach(function (param) {
          var key = param.split(splitter)[0];
          var value = param.split(splitter)[1]; // Secure that we have indices for all arrays in param

          while (indices.length < key.split(arrUnindexed).length - 1) {
            indices.push(0); // Start indexing from 0
          } // Secure that indices is not more than amount of arrays


          while (indices.length !== key.split(arrUnindexed).length - 1) {
            indices.pop(); // Remove indices not used
          } // Iterate through arrays in param


          var count = 0; // Hold track for which array we are in

          indices.forEach(function (i) {
            var index = key.indexOf(arrUnindexed); // index position start of array in param

            var arraySpace = (arrStart + i + arrEnd).length; // space used by array

            var endIndex = index + arraySpace; // index position end of array in param

            if (key.replace(arrUnindexed, arrStart + i + arrEnd).substring(0, endIndex) === prevKey.substring(0, endIndex) && key.replace(arrUnindexed, arrStart + i + arrEnd).indexOf(arrUnindexed) !== -1) {
              // param is equal to prev at this index and has more unindexed arrays
              key = key.replace(arrUnindexed, arrStart + i + arrEnd);
            } else if (key.replace(arrUnindexed, arrStart + i + arrEnd).substring(0, endIndex) === prevKey.substring(0, endIndex) && key.replace(arrUnindexed, arrStart + i + arrEnd).indexOf(arrUnindexed) === -1) {
              if (key.length > index + arrUnindexed.length) {
                // param has more indexed arrays after this index
                var increment = false;
                parsed.forEach(function (parse) {
                  var parseKey = parse.split(splitter)[0];

                  if (key.substring(endIndex - 1) === parseKey.substring(endIndex)) {
                    // keystring after this array index is equal to some prev
                    if (key.substring(0, index) === parseKey.substring(0, index)) {
                      // keystring before this array index is equal to some prev
                      increment = true;
                    }
                  }
                });

                if (increment) {
                  i++;
                }
              } else {
                // this is the last element on key
                i++;
              }

              key = key.replace(arrUnindexed, arrStart + i + arrEnd);
            } else {
              // param is not equal to prev param at this index
              i = 0;
              key = key.replace(arrUnindexed, arrStart + i + arrEnd); // if param matches other parsed params at this index, increment prev array +1 from match

              parsed.forEach(function (parse) {
                if (parse.substring(0, endIndex) === key.substring(0, endIndex)) {
                  var subparse = parse.substring(0, parse.lastIndexOf(arrStart + i + arrEnd));
                  var start = subparse.lastIndexOf(arrStart);
                  var end = subparse.lastIndexOf(arrEnd);
                  var preIndex = Number(key.substring(start + 1, end)); // Find last array before current index of param where array is indexed by number

                  while (subparse.lastIndexOf(arrStart) !== -1 && isNaN(preIndex) && end > start && start !== -1) {
                    subparse = subparse.substring(0, subparse.lastIndexOf(arrStart));
                    start = subparse.lastIndexOf(arrStart);
                    end = subparse.lastIndexOf(arrEnd);
                    preIndex = Number(key.substring(start + 1, end));
                  }

                  if (isNaN(preIndex)) {
                    // No other arrays before this index is indexed by number, increment last '[' + i + ']'
                    key = key.substring(0, key.lastIndexOf(arrStart + i + arrEnd)) + arrStart + (i + 1) + arrEnd;
                    i++;
                  } else {
                    // preIndex should increment
                    key = key.substring(0, start + 1) + (preIndex + 1) + key.substring(end);
                    i = 0;
                    indices[count - 1] = preIndex + 1; // update prev indice
                  }
                }
              });
            }

            indices[count] = i;
            count++;
          });
          prevKey = key;
          parsed.push(key + (param.split(splitter).length > 1 ? splitter + (typeof value !== 'undefined' ? value : '') : ''));
        });
        return parsed;
      };

      querystring = preserved;
      var parsed = doIndexing(params);

      if (indexEncodedArrays) {
        parsed = doIndexing(params, '%5B', '%5D');
      }

      parsed.forEach(function (param) {
        querystring += param + delimiter;
      });
      return parsed.length > 0 ? querystring.slice(0, -1) : querystring;
    },

    /**
     * Encode arguments after first divider until second divider
     * Ex.: ignored?encoded?ignored?ignored @todo - encode all after first ?
     * @param string
     * @param options
     * @returns {string}
     */
    encode: function encode(string, options) {
      options = Object.assign({
        protocol: 'rfc3986',
        divider: '?',
        delimiter: '&',
        splitter: '=',
        encodeNull: true,
        keepEmpty: true,
        encodeNames: true,
        encodeValues: true
      }, options);
      var split = [string.substring(0, string.indexOf(options.divider)), string.substring(string.indexOf(options.divider) + 1)];
      var encoded = '';

      if (string.indexOf(options.divider) !== -1) {
        var params = split[1].split(options.delimiter);
        params.forEach(function (param) {
          var query = param.split(options.splitter);
          var key = '';
          var value = '';

          if (query.length > 1) {
            var _i = 0;
            query.forEach(function (q) {
              if (_i === 0) {
                key = options.encodeNames ? _encode2["default"].encode(q, options.protocol, options.encodeNull) : q;
              } else if (_i === 1) {
                value = options.encodeValues ? _encode2["default"].encode(q, options.protocol, options.encodeNull) : q;
              } else {
                value += (options.encodeValues ? _encode2["default"].encode(options.splitter, options.protocol, options.encodeNull) : options.splitter) + (options.encodeValues ? _encode2["default"].encode(q, options.protocol, options.encodeNull) : q);
              }

              _i++;
            });
          } else if (query.length === 1) {
            key = options.encodeNames ? _encode2["default"].encode(query[0], options.protocol, options.encodeNull) : query[0];
          }

          if (key !== '' && value !== '') {
            encoded += key + options.splitter;
            encoded += value + options.delimiter;
          } else if (key !== '' && options.keepEmpty) {
            encoded += key + options.splitter + options.delimiter;
          }
        });

        if (encoded !== '') {
          encoded = encoded.slice(0, -1);
        }
      } else {
        split[0] = string;
        delete split[1];
      } // Rebuild arguments


      string = '';
      var i = 0;
      split.forEach(function (part) {
        if (i === 1) {
          string += encoded + options.divider;
        } else {
          string += part + options.divider;
        }

        i++;
      });

      if (string !== '') {
        string = string.slice(0, -1);
      }

      return string;
    }
  };
};

var _default = new Util();

exports["default"] = _default;

var clone = function clone(target, obj) {
  if ((0, _typeof2["default"])(obj) === 'object' && obj !== null) {
    for (var i in obj) {
      target[i] = (0, _typeof2["default"])(obj[i]) === 'object' && obj[i] !== null ? clone(obj[i].constructor(), obj[i]) : obj[i];
    }
  } else {
    return obj;
  }

  return target;
};

exports.clone = clone;