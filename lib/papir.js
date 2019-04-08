"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "Controller", {
  enumerable: true,
  get: function get() {
    return _controller["default"];
  }
});
Object.defineProperty(exports, "Requester", {
  enumerable: true,
  get: function get() {
    return _requester["default"];
  }
});
Object.defineProperty(exports, "Endpoint", {
  enumerable: true,
  get: function get() {
    return _endpoint["default"];
  }
});
Object.defineProperty(exports, "List", {
  enumerable: true,
  get: function get() {
    return _list["default"];
  }
});
Object.defineProperty(exports, "Prop", {
  enumerable: true,
  get: function get() {
    return _prop["default"];
  }
});
Object.defineProperty(exports, "clone", {
  enumerable: true,
  get: function get() {
    return _util.clone;
  }
});
exports.papir = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _controller = _interopRequireDefault(require("./services/controller"));

var _requester = _interopRequireDefault(require("./services/requester"));

var _endpoint = _interopRequireDefault(require("./form/endpoint"));

var _list = _interopRequireDefault(require("./form/list"));

var _prop = _interopRequireDefault(require("./form/prop"));

var _util = require("./services/util");

/**
 * Papir
 */
var Papir = function Papir()
/* opt = {} */
{
  var _this = this;

  (0, _classCallCheck2["default"])(this, Papir);

  // Default integration
  this.init = function (options) {
    Object.assign({
      conf: {},
      controller: new _controller["default"](options.conf)
    }, options);
    _this.controller = options.controller;
    _this.Endpoint = _endpoint["default"];
    _this.List = _list["default"];
    _this.Requester = _requester["default"];
    _this.Prop = _prop["default"];
  }; // Vue integration


  this.install = function (Vue, options) {
    Object.assign({
      conf: {},
      controller: new _controller["default"](options.conf)
    }, options);
    Vue.prototype.$pap = {
      controller: options.controller,
      Endpoint: _endpoint["default"],
      List: _list["default"],
      Requester: _requester["default"],
      Prop: _prop["default"]
    };
  };
};

var papir = new Papir();
exports.papir = papir;