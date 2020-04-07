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
    var authenticaton = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'none';
    var client_id = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';
    var client_secret = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : '';
    var salt = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 'HMAC short living salt';
    var pepper = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 'HMAC short living pepper';
    var return_url = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : '';
    var callback_url = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : 'https://storepilot.lib.id/storepilot-service/callback/';
    (0, _classCallCheck2["default"])(this, Woo);
    this.url = url;
    this.authenticaton = authenticaton;
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
    if (!return_url) return_url = 'https://storepilot.lib.id/storepilot-service/return/?fallback_url=https://storepilot.com/account?fallback&installation_url=https://storepilot.com/account?authorized&token=' + this.token;
    this.authUrl = "".concat(url, "/wc-auth/v1/authorize?") + _querystring["default"].stringify({
      app_name: appname,
      scope: 'read_write',
      user_id: this.token,
      return_url: return_url,
      callback_url: callback_url
    });
  }

  (0, _createClass2["default"])(Woo, [{
    key: "authenticate",
    value: function authenticate() {
      var service_url = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'https://storepilot.lib.id/storepilot-service/authorize/';
      var top = window.top.screenY + 80;
      var left = window.top.outerWidth / 2 + window.top.screenX - 700 / 2;
      var win = window.open(this.authUrl, 'StorePilot', "directories=no,toolbar=no,menubar=no,width=700,height=690,top=".concat(top, ",left=").concat(left));
      return this.validate(service_url, win);
    }
  }, {
    key: "validate",
    value: function validate(service_url, win) {
      var _this = this;

      var timeout = 100;
      return new Promise(function (resolve, reject) {
        var validate = function validate() {
          setTimeout(function () {
            _axios["default"].post(service_url, {
              token: _this.token
            }).then(function (results) {
              if (results.data.success) {
                resolve({
                  data: results.data.data,
                  window: win
                });
              } else {
                timeout--;
                if (timeout <= 0) reject(new Error('Timeout'));else validate();
              }
            })["catch"](function (e) {
              reject(e);
            });
          }, 1000);
        };

        validate();
      });
    }
  }, {
    key: "authorize",
    value: function authorize() {
      if (this.authenticaton === 'none') {
        this.controller.config({
          config: {
            authentication: function authentication(request) {
              request.url.indexOf('?') === -1 ? request.url += '?' : request.url += '&';
              return request;
            }
          }
        });
      } else if (this.authenticaton === 'nonce') {
        this.controller.config({
          config: {
            authentication: function authentication(request) {
              request.url.indexOf('?') === -1 ? request.url += '?' : request.url += '&';
              this.client_id = this.client_id ? this.client_id : 'wp_nonce';
              this.client_secret = this.client_secret ? this.client_secret : '';
              return request + this.client_id + '=' + this.client_secret;
            }
          }
        });
      } else if (this.url.substr(0, 5) === 'https') {
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