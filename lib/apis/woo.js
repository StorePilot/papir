"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _crypto = _interopRequireDefault(require("crypto"));

var _axios = _interopRequireDefault(require("axios"));

var _querystring = _interopRequireDefault(require("querystring"));

var _papir = require("papir");

var Woo =
/*#__PURE__*/
function () {
  function Woo() {
    var url = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'localhost';
    var appname = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'MyApp';
    var client_id = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
    var client_secret = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';
    var salt = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 'HMAC short living salt';
    var pepper = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 'HMAC short living pepper';
    (0, _classCallCheck2["default"])(this, Woo);
    this.url = url;
    this.client_id = client_id;
    this.client_secret = client_secret;
    this.token = _crypto["default"].createHmac('sha256', salt).update(pepper).digest('hex');
    this.controller = new _papir.Controller({
      config: {},
      apis: [{
        base: url,
        slug: 'wc',
        "default": true,
        requester: 'oauth',
        config: {
          authQuery: true,
          authHeader: false,
          indexArrays: true,
          addDataToQuery: true,
          timestampLength: 10,
          put: {
            override: {
              arg: '_method',
              method: 'POST'
            }
          },
          "delete": {
            authQuery: true,
            override: {
              arg: '_method',
              method: 'POST'
            }
          }
        },
        mappings: {}
      }]
    });
    this.authUrl = "".concat(url, "/wc-auth/v1/authorize?") + _querystring["default"].stringify({
      app_name: appname,
      scope: 'read_write',
      user_id: this.token,
      return_url: 'https://storepilot.lib.id/storepilot-service/return/?fallback_url=https://storepilot.com/account?fallback&installation_url=https://storepilot.com/account?authorized&token=' + this.token,
      callback_url: 'https://storepilot.lib.id/storepilot-service/callback/'
    });
  }

  (0, _createClass2["default"])(Woo, [{
    key: "authenticate",
    value: function authenticate() {
      window.open(this.authUrl);
      this.validate();
    }
  }, {
    key: "validate",
    value: function validate() {
      var _this = this;

      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          _axios["default"].post('https://storepilot.lib.id/storepilot-service/authorize/', {
            token: _this.token
          }).then(function (results) {
            if (results.data.success) {
              resolve(results.data.data);
            } else {
              _this.validate().then(function () {
                resolve(results.data.data);
              })["catch"](function (e) {
                reject(e);
              });
            }
          })["catch"](function (e) {
            reject(e);
          });
        }, 1000);
      });
    }
  }, {
    key: "authorize",
    value: function authorize() {
      if (this.url.substr(0, 5) === 'https') {
        this.controller.config({
          config: {
            authentication: function authentication(request) {
              request.url.indexOf('?') === -1 ? request.url += '?' : request.url += '&';
              request.url += "consumer_key=".concat(this.client_id) + "&consumer_secret=".concat(this.client_secret);
              return request;
            }
          }
        });
      } else {
        this.controller.config({
          config: {
            key: this.client_id,
            secret: this.client_secret,
            authentication: 'oauth',
            version: '1.0a',
            type: 'one_legged',
            algorithm: 'HMAC-SHA1',
            timestampLength: 10
          }
        });
      }
    }
  }]);
  return Woo;
}();

exports["default"] = Woo;