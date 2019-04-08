"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.Controller = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _requester = _interopRequireDefault(require("./requester"));

/**
 * Controller
 */
var Controller = function Controller() {
  var _this = this;

  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  (0, _classCallCheck2["default"])(this, Controller);
  options = {
    config: typeof options.config !== 'undefined' ? options.config : {},
    serverBase: typeof options.serverBase !== 'undefined' ? options.serverBase : null,
    apis: typeof options.apis !== 'undefined' ? options.apis : []
  };
  this["default"] = null;
  this.apis = {};
  this.server = options.serverBase;

  this.config = function (opt1, opt2) {
    var replace = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    if (typeof opt2 === 'undefined' && typeof opt1 !== 'undefined' && opt1.constructor === Object) {
      Object.keys(_this.apis).forEach(function (key) {
        if (replace) {
          _this.apis[key] = opt1;
        } else {
          _this.apis[key] = Object.assign(_this.apis[key], opt1);
        }

        if (typeof _this.apis[key].config === 'undefined') {
          _this.apis[key].config = {};
        }

        _this.apis[key].requester = new _requester["default"](_this.storeAuth(_this.apis[key], _this.apis[key].config));
      });
    } else if (typeof opt1 === 'string' && typeof opt2 !== 'undefined' && opt2.constructor === Object) {
      if (typeof _this.apis[opt1] !== 'undefined' && !replace) {
        _this.apis[opt1] = Object.assign(_this.apis[opt1], opt2);
      } else {
        _this.apis[opt1] = opt2;
      }

      if (typeof _this.apis[opt1].config === 'undefined') {
        _this.apis[opt1].config = {};
      }

      _this.apis[opt1].requester = new _requester["default"](_this.storeAuth(_this.apis[opt1], _this.apis[opt1].config));
    }
  };

  this.storeAuth = function (api, config) {
    if (typeof config.key !== 'undefined') {
      localStorage.setItem('papir.' + api.slug + '.key', config.key);
    }

    if (typeof config.secret !== 'undefined') {
      localStorage.setItem('papir.' + api.slug + '.secret', config.secret);
    }

    if (typeof config.token !== 'undefined' && config.token.constructor === Object) {
      localStorage.setItem('papir.' + api.slug + '.token', JSON.stringify(config.token));
    }

    config = Object.assign(config, {
      key: localStorage.getItem('papir.' + api.slug + '.key') !== null ? localStorage.getItem('papir.' + api.slug + '.key') : '',
      secret: localStorage.getItem('papir.' + api.slug + '.secret') !== null ? localStorage.getItem('papir.' + api.slug + '.secret') : '',
      token: localStorage.getItem('papir.' + api.slug + '.token') !== null ? JSON.parse(localStorage.getItem('papir.' + api.slug + '.token')) : {
        key: '',
        secret: ''
      }
    });
    return config;
  }; // Load and configure Apis


  options.apis.forEach(function (api) {
    if (api["default"] || _this["default"] === null) {
      _this["default"] = api.slug;
    }

    if (_this.server !== null && (typeof api.base === 'undefined' || api.base === '')) {
      api.base = _this.server;
    }

    if (typeof api.config === 'undefined') {
      api.config = {};
    }

    options.config = Object.assign(api.config, options.config);
    api.requester = new _requester["default"](_this.storeAuth(api, options.config));
    _this.apis[api.slug] = api;
  });
};

exports.Controller = Controller;
var _default = Controller;
exports["default"] = _default;