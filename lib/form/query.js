"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

/**
 * Query
 */
var Query = function Query(endpoint) {
  (0, _classCallCheck2["default"])(this, Query);
  var accessor = this;
  var queries = [];
  var argsMap = {};

  if (endpoint.shared.map && typeof endpoint.shared.map.args !== 'undefined') {
    argsMap = endpoint.shared.map.args;
  }

  accessor.custom = function (key, value) {
    // Resolve mapping
    if (typeof argsMap[key] !== 'undefined') {
      key = argsMap[key];
    } // Ensures new arg (key, value) is added at end of query


    var newQ = [];
    queries.forEach(function (query) {
      if (query.key !== key) {
        newQ.push(query);
      }
    });
    newQ.push({
      key: key,
      value: value
    });
    queries = newQ;
    return accessor;
  };

  accessor.exclude = function (value) {
    return accessor.custom('exclude', value);
  };

  accessor.include = function (value) {
    return accessor.custom('include', value);
  };

  accessor.parent = function (value) {
    return accessor.custom('parent', value);
  };

  accessor.parentExclude = function (value) {
    return accessor.custom('parent_exclude', value);
  };

  accessor.slug = function (value) {
    return accessor.custom('slug', value);
  };

  accessor.status = function (value) {
    return accessor.custom('status', value);
  };

  accessor.type = function (value) {
    return accessor.custom('type', value);
  };

  accessor.sku = function (value) {
    return accessor.custom('sku', value);
  };

  accessor.featured = function (value) {
    return accessor.custom('featured', value);
  };

  accessor.shippingClass = function (value) {
    return accessor.custom('shipping_class', value);
  };

  accessor.attribute = function (value) {
    return accessor.custom('attribute', value);
  };

  accessor.attributeTerm = function (value) {
    return accessor.custom('attribute_term', value);
  };

  accessor.taxClass = function (value) {
    return accessor.custom('tax_class', value);
  };

  accessor.inStock = function () {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
    return accessor.custom('in_stock', value);
  };

  accessor.onSale = function () {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
    return accessor.custom('on_sale', value);
  };

  accessor.product = function (value) {
    return accessor.custom('product', value);
  };

  accessor.minPrice = function () {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    return accessor.custom('min_price', value);
  };

  accessor.maxPrice = function () {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10000;
    return accessor.custom('max_price', value);
  };

  accessor.after = function (value) {
    return accessor.custom('after', value);
  };

  accessor.before = function (value) {
    return accessor.custom('before', value);
  };

  accessor.hideEmpty = function () {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
    return accessor.custom('hide_empty', value);
  };

  accessor.order = function () {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'desc';
    return accessor.custom('order', value);
  };

  accessor.orderby = function () {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'menu_order';
    return accessor.custom('orderby', value);
  };

  accessor.offset = function () {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 100;
    return accessor.custom('offset', value);
  };

  accessor.search = function () {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    return accessor.custom('search', value);
  };

  accessor.page = function () {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    return accessor.custom('page', value);
  };

  accessor.perPage = function () {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 12;
    return accessor.custom('per_page', value);
  };

  accessor.category = function () {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    return accessor.custom('category', value);
  };

  accessor.context = function () {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'view';
    return accessor.custom('context', value);
  };

  accessor.tag = function () {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    return accessor.custom('tag', value);
  };

  accessor.fetch = function () {
    var apiSlug = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : endpoint.shared.defaultApi;
    var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var replace = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

    // Merge args with queries as its just two different ways of using args
    if (args !== null) {
      args.forEach(function (arg) {
        return accessor.custom(arg.key, arg.value);
      });
    }

    return endpoint.fetch(apiSlug, queries, replace);
  };
};

exports["default"] = Query;