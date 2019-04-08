"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _util = require("../services/util");

/**
 * Prop
 */
var Prop = function Prop() {
  var parent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  var key = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var value = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var config = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var transpiler = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
  (0, _classCallCheck2["default"])(this, Prop);

  /**
   * Public Scope
   */
  var accessor = this;
  accessor.parent = parent;
  /**
   * Public Variables
   */

  try {
    accessor.value = (0, _util.clone)({}, value);
    accessor.raw = (0, _util.clone)({}, value);
  } catch (e) {
    try {
      accessor.value = value.clone();
      accessor.raw = value.clone();
    } catch (e) {
      accessor.value = value;
      accessor.raw = value;
    }
  }

  accessor.transpiler = transpiler; // Default Config (config level 0 - greater is stronger)

  accessor.config = {
    emptyArrayToZero: false,
    keepArrayTags: true
  };

  if (parent !== null) {
    accessor.config = Object.assign(accessor.config, parent.shared.config);
  }

  if (key.constructor === Object) {
    if (typeof key.config !== 'undefined') {
      // Mapped Config (config level 1 - greater is stronger)
      accessor.config = Object.assign(accessor.config, key.config);
    }

    if (typeof key.key !== 'undefined') {
      accessor.key = key.key;
    } else {
      accessor.key = key;
      console.error('Property is missing key', accessor);
    }
  } // Custom Config (config level 2 - greater is stronger)


  accessor.config = Object.assign(accessor.config, config);
  accessor.key = key;
  accessor.loading = false;
  accessor.loaders = [];
  /**
   * Private methods
   * ---------------
   * Start Loader
   */

  var startLoader = function startLoader(loadSlug) {
    accessor.loading = true;
    return accessor.loaders.push(loadSlug);
  };
  /**
   * Stop Loader
   */


  var stopLoader = function stopLoader(loadSlug) {
    var index = accessor.loaders.indexOf(loadSlug);

    if (index !== -1) {
      accessor.loaders.splice(index, 1);
      accessor.loading = accessor.loaders.length > 0;
    }

    return accessor.loaders;
  };
  /**
   * Public methods
   */

  /**
   * Check if prop is changed
   */


  accessor.changed = function () {
    var changed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    var isChanged = false;

    if (changed !== null && !changed) {
      try {
        value = JSON.parse(JSON.stringify(accessor.value));
      } catch (e) {
        try {
          value = accessor.value.clone();
        } catch (e) {
          value = accessor.value;
        }
      }
    } else if (changed !== null && changed) {
      value = accessor.value !== null ? null : 0;
    }

    if (typeof accessor.value !== 'undefined' && accessor.value !== null && value !== null) {
      if (accessor.value.constructor === value.constructor) {
        if (accessor.value.constructor === Array) {
          if (accessor.value.length !== value.length) {
            isChanged = true;
          } else {
            isChanged = JSON.stringify(accessor.value) !== JSON.stringify(value);
          }
        } else {
          isChanged = JSON.stringify(accessor.value) !== JSON.stringify(value);
        }
      } else {
        isChanged = true;
      }
    } else {
      isChanged = (0, _typeof2["default"])(accessor.value) !== (0, _typeof2["default"])(value) || accessor.value !== value;
    }

    return isChanged;
  };
  /**
   * Request Save @note - Saves only this property
   * @apiSlug Use custom api by slug
   * @args Custom arguments as array [{key: '', value: ''}]
   * @replace replace all properties in endpoint from response
   * @create Attempt to create if save fails (Ex.: if no id provided to endpoint)
   */


  accessor.save = function () {
    var apiSlug = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : parent.shared.defaultApi;
    var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var replace = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    var create = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
    var perform = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
    var obj = {};
    obj[key] = accessor.apiValue();
    return new Promise(function (resolve, reject) {
      if (parent !== null) {
        var loadSlug = 'save';
        startLoader(loadSlug);
        parent.shared.makeRequest(loadSlug, 'PUT', apiSlug, args, parent.shared.accessor.removeIdentifiers(parent.shared.accessor.reverseMapping(obj)), false, {
          perform: perform
        }).then(function (response) {
          accessor.raw = response;
          parent.shared.handleSuccess(response, replace, key).then(function () {
            stopLoader(loadSlug);
            resolve(accessor);
          })["catch"](function (error) {
            stopLoader(loadSlug);
            reject(error);
          });
        })["catch"](function (error) {
          accessor.raw = error; // If could not save, try create and update all properties

          if (create) {
            parent.shared.accessor.create(apiSlug, args, replace).then(function () {
              stopLoader(loadSlug);
              resolve(accessor);
            })["catch"](function (error) {
              stopLoader(loadSlug);
              reject(error);
            });
          } else {
            stopLoader(loadSlug);
            reject(error);
          }
        });
      } else {
        reject('Missing Endpoint');
      }
    })["catch"](function (error) {
      console.error(error);
    });
  };

  accessor.fetch = function () {
    var apiSlug = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : parent.shared.defaultApi;
    var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var replace = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    var perform = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
    return new Promise(function (resolve, reject) {
      if (parent !== null) {
        var loadSlug = 'fetch';
        startLoader(loadSlug);
        parent.shared.makeRequest(loadSlug, 'GET', apiSlug, args, null, false, {
          perform: perform
        }).then(function (response) {
          accessor.raw = response;
          parent.shared.handleSuccess(response, replace, key).then(function () {
            stopLoader(loadSlug);
            resolve(accessor);
          })["catch"](function (error) {
            stopLoader(loadSlug);
            reject(error);
          });
        })["catch"](function (error) {
          accessor.raw = error;
          stopLoader(loadSlug);
          reject(error);
        });
      } else {
        reject('Missing Endpoint');
      }
    })["catch"](function (error) {
      console.error(error);
    });
  };
  /**
   * Returns value ready to be posted to API with configurations applied
   */


  accessor.apiValue = function () {
    if (accessor.transpiler !== null) {
      return accessor.transpiler(accessor);
    } else if ((accessor.value === null || typeof accessor.value === 'undefined' || accessor.value.constructor === Array && accessor.value.length === 0) && accessor.config.emptyArrayToZero) {
      return 0;
    } else {
      return accessor.value;
    }
  };
  /**
   * Clones the Property
   */


  accessor.clone = function () {
    var cl = new Prop(parent, accessor.key, accessor.value, accessor.config, accessor.transpiler);

    try {
      cl.value = (0, _util.clone)({}, accessor.value);
    } catch (error) {
      console.error(error);
    }

    return cl;
  };
};

exports["default"] = Prop;