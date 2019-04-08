"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _endpoint = _interopRequireDefault(require("./endpoint"));

/**
 * List
 */
var List =
/*#__PURE__*/
function (_Endpoint) {
  (0, _inherits2["default"])(List, _Endpoint);

  function List(Endpoint) {
    var controller = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var apiSlug = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var predefined = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var config = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    (0, _classCallCheck2["default"])(this, List);

    /**
     * If no controller defined, create one from endpoint if it is not a string
     */
    var endpoint;

    if (controller !== null) {
      // Check if Endpoint is constructor and try to resolve
      try {
        endpoint = new Endpoint(controller);
      } catch (e) {// Controller was not a constructor
      }
    } else if (controller === null && Endpoint.constructor === Object) {
      // If controller is not set, assume endpoint already is a constructed Endpoint object
      endpoint = Endpoint;
      controller = endpoint.shared.controller; // Get the controller from endpoint
    } else {
      console.error('No controller defined for List', Endpoint);
    }
    /**
     * Pass to Endpoint model controller, id = null, apiSlug = controller.default, predefined = {}
     */


    return (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(List).call(this, endpoint, controller, apiSlug, Object.assign({
      batch: 'batch'
    }, predefined), Object.assign({
      multiple: true,
      batch: {
        save: 'update',
        create: 'create',
        "delete": 'delete'
      }
    }, config)));
  }

  return List;
}(_endpoint["default"]);

exports["default"] = List;