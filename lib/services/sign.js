"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _crypto = _interopRequireDefault(require("crypto"));

var _util = _interopRequireDefault(require("./util"));

var _encode = _interopRequireDefault(require("./encode"));

var Sign = function Sign() {
  (0, _classCallCheck2["default"])(this, Sign);
  var scope = this;

  this.gen = function (opt) {
    var conf = {
      authentication: 'oauth',
      version: '1.0a',
      type: 'one_legged',
      algorithm: 'HMAC-SHA1',
      url: location.href,
      method: 'GET',
      key: '',
      secret: '',
      token: {
        key: '',
        secret: ''
      },
      nonce: '',
      nonceLength: 6,
      timestampLength: 10,
      keepEmpty: true,
      requester: null,
      base64: true,
      ampersand: true,
      sort: true,
      protocol: 'rfc3986',
      encodeNull: true,
      encodeNames: true,
      encodeValues: true
    };
    Object.keys(conf).forEach(function (key) {
      if (typeof opt[key] !== 'undefined') {
        conf[key] = opt[key];
      }
    });
    var baseString = conf.method + '&' + _encode["default"].encode(_util["default"].stripUri(conf.url)) + '&';
    var hash = '';
    var mergedParams = [];

    _util["default"].getParams(conf.url).forEach(function (param) {
      mergedParams.push({
        key: param.key,
        value: param.value
      });
    });

    if (conf.authentication === 'oauth' && conf.version === '1.0a') {
      mergedParams = mergedParams.concat([{
        key: 'oauth_consumer_key',
        value: conf.key
      }, {
        key: 'oauth_signature_method',
        value: conf.algorithm
      }, {
        key: 'oauth_token',
        value: conf.token.key
      }, {
        key: 'oauth_timestamp',
        value: _util["default"].timestamp(conf.timestampLength)
      }, {
        key: 'oauth_nonce',
        value: conf.nonce === '' && conf.nonceLength > 0 ? _util["default"].nonce(conf.nonceLength) : conf.nonce
      }, {
        key: 'oauth_version',
        value: '1.0'
      }]);

      if (conf.requester !== null) {
        mergedParams.push({
          key: 'xoauth_requester_id',
          value: conf.requester
        });
      }

      var paramString = scope.paramString(mergedParams, conf.keepEmpty, conf.sort);
      mergedParams = paramString.decoded;
      baseString += _encode["default"].encode(paramString.string);
      var signKey = scope.signKey(conf.secret, conf.token.secret, conf.ampersand);

      if (conf.base64 && conf.algorithm === 'HMAC-SHA1') {
        // baseString = baseString.replace(/%00/g, '%2500').replace(/%0A/g, '%250A').replace(/%0D/g, '%250D')
        // @note At this point %00 = %252500, %0A = %25250A, %0D = %25250D
        hash = _crypto["default"].createHmac('sha1', signKey).update(baseString).digest('base64');
      }
    } // Convert params to html-form type (change 'key' to 'name')


    var params = [];
    mergedParams.forEach(function (param) {
      params.push({
        name: param.key,
        value: param.value
      });

      if (param.key === 'oauth_nonce') {
        params.push({
          name: 'oauth_signature',
          value: hash
        });
      }
    }); // Generate OAuth header

    var header = 'OAuth ';
    params.forEach(function (param) {
      var key = param.name;
      var value = param.value;

      if (conf.encodeNames) {
        key = _encode["default"].encode(key, conf.protocol, conf.encodeNull);
      }

      if (conf.encodeValues) {
        value = _encode["default"].encode(value, conf.protocol, conf.encodeNull);
      }

      if (value !== '') {
        header += key + '="' + value + '",';
      } else {
        header += key + '",';
      }
    });
    var queryString = '';
    var i = 0;
    params.forEach(function (param) {
      var key = param.name;
      var value = param.value;

      if (conf.encodeNames) {
        key = _encode["default"].encode(key, conf.protocol, conf.encodeNull);
      }

      if (conf.encodeValues) {
        value = _encode["default"].encode(value, conf.protocol, conf.encodeNull);
      }

      if (value !== '') {
        queryString += key + '=' + value;
      } else {
        queryString += key;
      }

      if (i !== params.length - 1) {
        queryString += '&';
      }

      i++;
    });
    return {
      params: params,
      header: header.slice(0, -1),
      string: queryString
    };
  };

  this.signKey = function (secret, tokenSecret) {
    var ampersand = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

    if (ampersand || tokenSecret !== '') {
      return _encode["default"].encode(secret) + '&' + _encode["default"].encode(tokenSecret);
    } else {
      return _encode["default"].encode(secret);
    }
  };

  this.paramString = function (params) {
    var keepEmpty = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var sort = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    var paramString = '';
    var enc = [];
    params.forEach(function (param) {
      if (param.value !== '') {
        enc.push(param.key + '=' + param.value + '&');
      } else if (param.value === '' && param.key !== 'oauth_token' && keepEmpty) {
        enc.push(param.key + '=&');
      }
    });

    if (sort) {
      enc.sort();
    } // Decode encoded to get equal sorting as encoded


    var dec = [];
    enc.forEach(function (param) {
      var p = param.split('=');

      if (p.length === 2) {
        dec.push({
          key: _encode["default"].decode(p[0]),
          value: _encode["default"].decode(p[1]).slice(0, -1)
        });
      } else {
        dec.push({
          key: _encode["default"].decode(p[0]),
          value: ''
        });
      }
    });
    enc.forEach(function (param) {
      paramString += param;
    });

    if (enc.length > 0) {
      paramString = paramString.slice(0, -1);
    }

    return {
      string: paramString,
      encoded: enc,
      decoded: dec
    };
  };
};

var _default = new Sign();

exports["default"] = _default;