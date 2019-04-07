"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _prop = _interopRequireDefault(require("./prop"));

var _query = _interopRequireDefault(require("./query"));

var _axios = _interopRequireDefault(require("axios"));

var _util = require("../services/util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Endpoint
 */
var Endpoint = function Endpoint(endpoint, controller) {
  var _this = this;

  var apiSlug = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var predefined = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var config = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

  _classCallCheck(this, Endpoint);

  /**
   * Public Scope
   */
  var accessor = this;
  /**
   * Public / Reserved Variables
   */

  /**
   * Get last fetched raw value
   */

  accessor.raw = null;
  /**
   * If endpoint is list related, children is saved here
   */

  accessor.children = [];
  /**
   * Default arguments added to requests
   */

  accessor.args = {
    fetch: [],
    save: [],
    custom: [],
    create: [],
    batch: [],
    upload: [],
    remove: [],
    get: [],
    post: [],
    put: [],
    patch: [],
    "delete": [],
    head: [],
    trace: [],
    connect: [],
    options: []
    /**
     * Shared Variables
     */

  };
  accessor.shared = {
    storage: null,
    // Storage is free to be used for anything on app level
    // Default Config (config level 0 - greater is stronger)
    config: {
      multiple: false,
      batchIdentifier: 'batch',
      post: {
        keepNull: false
      }
    },
    api: null,
    defaultApi: apiSlug,
    map: null,
    endpoint: endpoint,
    controller: controller,
    requester: controller,
    predefined: predefined,
    accessor: accessor,
    reserved: ['loading', 'loaders', // Property Requesters
    'fetch', 'custom', 'save', 'create', 'batch', 'clear', 'upload', 'remove', // Custom Requesters
    'get', 'post', 'put', 'patch', 'delete', 'head', 'trace', 'connect', 'options', // Property Methods
    'args', 'query', 'set', 'clone', 'changes', 'props', 'shared', 'identifier', 'identifiers', 'removeIdentifiers', 'reverseMapping', // Accessor Variables
    'children', 'raw', 'headers', 'invalids', 'exchange', 'sort', 'reserved']
    /**
     * Private Variables
     */

  };
  var cancelers = {
    fetch: null,
    save: null,
    create: null,
    remove: null,
    upload: null,
    batch: null
    /**
     * Public / Reserved Variable Names
     * @warning Can not be used as a property name in models
     */

  };
  accessor.loading = false;
  accessor.loaders = [];
  accessor.invalids = {}; // Reserved properties from Server is stored here

  accessor.headers = {
    mapped: {},
    unmapped: {} // @note - Related to Properties

    /**
     * Private Methods
     * ---------------
     * Initialization
     */

  };

  var init = function init() {
    var accessor = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _this;

    /**
     * If an Endpoint object was passed instead of string, copy values to this endpoint before resolving constructors
     */
    if (typeof accessor.shared.endpoint !== 'string') {
      accessor.shared.controller = accessor.shared.endpoint.shared.controller; // Replace controller

      accessor.shared.requester = accessor.shared.endpoint.shared.requester; // Replace requester
      // Replace defaultApi only if no apiSlug was given

      if (accessor.shared.defaultApi === null) {
        accessor.shared.defaultApi = accessor.shared.endpoint.shared.defaultApi;
      }

      accessor.args = (0, _util.clone)({}, accessor.shared.endpoint.args);
      accessor.set(accessor.shared.endpoint, false); // Replace props

      accessor.shared.config = accessor.shared.endpoint.shared.config; // Replace config

      accessor.shared.endpoint = accessor.shared.endpoint.shared.endpoint; // Replace endpoint string
    }
    /**
     * Map Resolver
     */


    var resolveMap = function resolveMap() {
      var map = null;

      try {
        map = accessor.shared.api.mappings[accessor.shared.endpoint];

        if (typeof map !== 'undefined' && typeof map.config !== 'undefined' && map.config.constructor === Object) {
          // Mapped Config (config level 1 - greater is stronger)
          accessor.shared.config = Object.assign((0, _util.clone)({}, accessor.shared.config), map.config);
        }
      } catch (e) {
        console.error(e);
      }

      return map;
    };
    /**
     * Resolve Requester
     */


    if (typeof accessor.shared.controller.apis !== 'undefined') {
      accessor.shared.defaultApi = accessor.shared.defaultApi === null ? accessor.shared.controller["default"] : accessor.shared.defaultApi;
      accessor.shared.api = accessor.shared.controller.apis[accessor.shared.defaultApi];
      accessor.shared.requester = accessor.shared.api.requester;
      accessor.shared.map = resolveMap(); // Custom Config (config level 2 - greater is stronger)

      accessor.shared.config = Object.assign((0, _util.clone)({}, accessor.shared.config), config);
      accessor.shared.buildProps(accessor.shared.map, accessor.shared.predefined);
    } else {
      console.error('No apis is hooked to Controller', accessor.shared.controller);
      accessor.shared.controller = null;
    }
  };
  /**
   * Shared Methods
   */

  /**
   * Build mapped / predefined properties
   */


  accessor.shared.buildProps = function () {
    var map = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : accessor.shared.map;
    var predefined = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : accessor.shared.predefined;

    if (map !== null && typeof map !== 'undefined' && typeof map.props !== 'undefined') {
      try {
        Object.keys(map.props).reduce(function (prev, key) {
          if (!accessor.reserved(key) && typeof accessor[key] === 'undefined') {
            accessor[map.props[key]] = new _prop["default"](accessor, map.props[key], null);
          } else if (key === 'invalids' && typeof accessor.invalids[key] === 'undefined') {
            accessor.invalids[map.props[key]] = new _prop["default"](accessor, map.props[key], null);
          }
        }, {});
      } catch (error) {
        console.error('Error in property mapping for api ' + accessor.shared.defaultApi);
        console.error(map.props);
      }
    }

    try {
      Object.keys(predefined).reduce(function (prev, key) {
        if (!accessor.reserved(key) && typeof accessor[key] === 'undefined') {
          accessor[key] = new _prop["default"](accessor, key, predefined[key]);
        } else if (!accessor.reserved(key) && typeof accessor[key] !== 'undefined') {
          accessor[key].value = predefined[key];
          accessor[key].changed(false);
        } else if (accessor.reserved(key) && typeof accessor.invalids[key] === 'undefined') {
          accessor.invalids[key] = new _prop["default"](accessor, key, predefined[key]);
        } else {
          accessor.invalids[key].value = predefined[key];
          accessor.invalids[key].changed(false);
        }
      }, {});
    } catch (error) {
      console.error('Error in predefined properties');
      console.error(predefined);
    }

    if (map !== null && typeof map !== 'undefined' && typeof map.identifier !== 'undefined' && map.identifier !== null && map.identifier !== '') {
      var mappedIdentifier = map.identifier;

      if (typeof map.props !== 'undefined' && typeof map.props[map.identifier] !== 'undefined') {
        mappedIdentifier = map.props[map.identifier];
      }

      if (!accessor.reserved(mappedIdentifier) && typeof accessor[mappedIdentifier] !== 'undefined') {
        accessor.identifier = accessor[mappedIdentifier];
      } else if (accessor.reserved(mappedIdentifier) && typeof accessor.invalids[mappedIdentifier] !== 'undefined') {
        accessor.identifier = accessor.invalids[mappedIdentifier];
      } else if (!accessor.reserved(mappedIdentifier)) {
        accessor.identifier = accessor[mappedIdentifier] = new _prop["default"](accessor, mappedIdentifier);
      } else {
        accessor.identifier = accessor.invalids[mappedIdentifier] = new _prop["default"](accessor, mappedIdentifier);
      }
    } else {
      accessor.identifier = null;
    }
  };
  /**
   * Url Resolver
   */


  accessor.shared.resolveUrl = function () {
    var endpoint = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : accessor.shared.endpoint;
    var map = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : accessor.shared.map;
    var api = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : accessor.shared.api;
    var args = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    var batch = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    var base = api !== null && typeof api.base !== 'undefined' ? api.base : ''; // Remove last slash if any from base

    if (base.length > 0 && base[base.length - 1] === '/') {
      base = base.slice(0, -1);
    }

    var path = endpoint; // If mapping is set

    if (map !== null && typeof map !== 'undefined') {
      path = map.endpoint; // Add slash to path if missing

      if (path.length > 0 && path[0] !== '/') {
        path = '/' + path;
      }
    } // Resolve Identifiers. Ex.: {id} or {/parentId} etc...


    var identifiers = accessor.identifiers(path);
    Object.keys(identifiers).reduce(function (prev, key) {
      var slash = identifiers[key].slash;
      var hook = identifiers[key].hook; // Resolve mapping

      if (map !== null && typeof map !== 'undefined' && typeof map.props !== 'undefined') {
        key = typeof map.props[key] !== 'undefined' ? map.props[key] : key;
      } // Replace hook with value from mapped prop


      if (!accessor.reserved(key) && typeof accessor[key] !== 'undefined' && accessor[key].value !== null && (batch || key !== accessor.shared.config.batchIdentifier)) {
        path = path.replace(hook, (slash ? '/' : '') + accessor[key].value);
      } else if (accessor.reserved(key) && typeof accessor.invalids[key] !== 'undefined' && accessor[key].value !== null && (batch || key !== accessor.shared.config.batchIdentifier)) {
        path = path.replace(hook, (slash ? '/' : '') + accessor.invalids[key].value);
      } else {
        path = path.replace(hook, '');
      }
    }, {});

    while (path.indexOf('//') !== -1) {
      path = path.replace('//', '/');
    }

    var url = base + path;

    if (map !== null && typeof map !== 'undefined' && typeof map.params !== 'undefined' && map.params.constructor === Array) {
      if (args !== null) {
        args = args.concat(map.params);
      } else {
        args = map.params;
      }
    } // Add Query Arguments


    if (args !== null) {
      if (url.indexOf('?') === -1) {
        url += '?';
      } else if (url[url.length - 1] !== '?' && url[url.length - 1] !== '&') {
        url += '&';
      }

      for (var i = 0, l = args.length; i < l; i++) {
        var arg = args[i];
        url += arg.key + '=' + arg.value + '&';
      }

      if (url[url.length - 1] === '&' || url[url.length - 1] === '?') {
        url = url.slice(0, -1);
      }
    }

    return url;
  };
  /**
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
   * Handle Cancelation of Running Requests
   */


  accessor.shared.handleCancellation = function (cancellation) {
    if (cancellation !== null) {
      cancellation();
    }

    return {
      promise: new Promise(function (resolve) {
        cancellation = resolve;
      }),
      cancellation: cancellation
    };
  };
  /**
   * Handle Mapping
   */


  accessor.shared.handleMapping = function (response) {
    var key = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var batch = arguments.length > 2 ? arguments[2] : undefined;
    var multiple = arguments.length > 3 ? arguments[3] : undefined;
    var map = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : accessor.shared.map;
    var conf = (0, _util.clone)({}, accessor.shared.config);
    return new Promise(function (resolve, reject) {
      var resolved = false;
      var data = response.data; // Raw from server

      var headers = response.headers; // In lowercase

      try {
        var parsed = data;
        var isObjOrArray = parsed.constructor === Object || parsed.constructor === Array;

        if (!isObjOrArray) {
          parsed = JSON.parse(parsed);
        }

        if (typeof parsed !== 'undefined' && parsed !== null && isObjOrArray) {
          if (!batch && !multiple) {
            // Parse Data
            response = accessor.set(parsed, false, true, key);
          } else if (batch && map !== null && typeof map !== 'undefined') {
            if (parsed.constructor === Object) {
              var match = 0;
              var hasBatch = map.batch !== null && typeof map.batch !== 'undefined';

              if (hasBatch) {
                Object.keys(map.batch).reduce(function (prev, key) {
                  if (typeof parsed[map.batch[key]] !== 'undefined') {
                    match++;
                  }
                }, {});
              } // If response has batch mapping keys, resolve by keys


              if (match > 0) {
                var deleteKey = typeof map.batch["delete"] !== 'undefined' && map.batch["delete"] !== null ? map.batch["delete"] : 'delete'; // Exchange all without delete

                Object.keys(parsed).reduce(function (prev, method) {
                  // Exchange updated
                  if (method !== deleteKey) {
                    for (var i = 0, l = parsed[method].length; i < l; i++) {
                      var child = parsed[method][i];

                      var _endpoint = new Endpoint(accessor, accessor.shared.controller, accessor.shared.defaultApi, Object.assign(child, accessor.shared.predefined), Object.assign(conf, {
                        multiple: false
                      }));

                      accessor.exchange(_endpoint);
                    }
                  } else {
                    // Remove deleted
                    for (var _i = 0, _l = parsed[method].length; _i < _l; _i++) {
                      var _child = parsed[method][_i];

                      var _endpoint2 = new Endpoint(accessor, accessor.shared.controller, accessor.shared.defaultApi, Object.assign(_child, accessor.shared.predefined), Object.assign(conf, {
                        multiple: false
                      }));

                      accessor.exchange(_endpoint2, true, false, true);
                    }
                  }
                }, {});
              } else {
                // If response has no keys mapped in batch, expect one instance
                var _endpoint3 = new Endpoint(accessor, accessor.shared.controller, accessor.shared.defaultApi, Object.assign(parsed, accessor.shared.predefined), Object.assign(conf, {
                  multiple: false
                }));

                accessor.exchange(_endpoint3);
              }
            } else {
              // If response is array expect multiple instances
              for (var i = 0, l = parsed.length; i < l; i++) {
                var obj = parsed[i];

                var _endpoint4 = new Endpoint(accessor, accessor.shared.controller, accessor.shared.defaultApi, Object.assign(obj, accessor.shared.predefined), Object.assign(conf, {
                  multiple: false
                }));

                accessor.exchange(_endpoint4);
              }
            }
          } else if (multiple && map !== null && typeof map !== 'undefined') {
            if (response.config.method.toLowerCase() === 'get') {
              accessor.children = [];
            }

            for (var _i2 = 0, _l2 = parsed.length; _i2 < _l2; _i2++) {
              var child = parsed[_i2];

              var _endpoint5 = new Endpoint(accessor, accessor.shared.controller, accessor.shared.defaultApi, Object.assign(child, accessor.shared.predefined), Object.assign(conf, {
                multiple: false
              }));

              if (response.config.method.toLowerCase() === 'get') {
                accessor.children.push(_endpoint5);
              } else {
                if (!accessor.exchange(_endpoint5)) {
                  accessor.children.push(_endpoint5);
                }
              }
            }
          } // Parse Headers


          if (key === null) {
            Object.keys(headers).reduce(function (prev, key) {
              if (map !== null && typeof map !== 'undefined' && typeof map.headers !== 'undefined' && typeof map.headers[key] !== 'undefined') {
                accessor.headers.mapped[map.headers[key]] = headers[key];
              } else {
                accessor.headers.unmapped[key] = headers[key];
              }
            }, {});
          }
        }

        resolved = true;
        resolve(response);
      } catch (error) {} // Not valid JSON, go to next parser
      // @todo - Add additional parsers. Ex. xml


      if (!resolved) {
        reject(new Error({
          error: 'Invalid Data',
          message: 'Could not parse data from response',
          data: data,
          response: response
        }));
      }
    });
  };
  /**
   * Handle Request Error Catching
   */


  accessor.shared.handleError = function (error) {
    if (_axios["default"].isCancel(error)) {// Manually cancelled
    } else if (error.response) {// The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      // error.response.data
      // error.response.status
      // error.response.headers
    } else if (error.request) {// The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      // error.request
    } else {} // Something happened in setting up the request that triggered an Error
      // error.message
      // error.config


    return error;
  };
  /**
   * Handle Request Success Response
   */


  accessor.shared.handleSuccess = function (response) {
    var replace = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var key = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var batch = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var map = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : accessor.shared.map;
    var multiple = map !== null && typeof map !== 'undefined' && typeof map.multiple !== 'undefined' && map.multiple || accessor.shared.config.multiple;
    return new Promise(function (resolve, reject) {
      if (replace) {
        accessor.shared.handleMapping(response, key, batch, multiple).then(function (results) {
          resolve(results);
        })["catch"](function (error) {
          reject(error);
        });
      } else {
        resolve(response);
      }
    });
  };
  /**
   * Exchange endpoint in accessor.children with match from input
   * @returns Endpoint (exchanged) | Endpoint.children (On Remove) | false (If no match found)
   */


  accessor.exchange = function (endpoint) {
    var add = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var reliable = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var remove = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var map = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : accessor.shared.map;

    // @note - This could be more heavy and alot slower
    var smartFind = function smartFind(endpoint) {
      // Reliable.
      // Check for Creation Identifier match.
      var exchange = resolveCreationIdentifier(endpoint); // Reliable.
      // Incoming needs all existing props (No differ).
      // Existing needs all incoming props (No differ).

      if (typeof exchange === 'undefined') {
        exchange = findExactMatch(endpoint);
      } // Not reliable, but could be usable anyways


      if (!reliable && typeof exchange === 'undefined') {
        // @todo - Add resolveByIndex (find response index by request index) method and make it optional in config
        // Unreliable.
        // Incoming needs all existing props (No differ).
        // Existing could have more props.
        if (typeof exchange === 'undefined') {
          exchange = findExactExistingMatch(endpoint);
        } // Unreliable.
        // Existing needs all incoming props (No differ).
        // Incoming could have more props.
        // Extra incoming props are added to existing props.


        if (typeof exchange === 'undefined') {
          exchange = findExactIncomingMatch(endpoint);
        } // Unreliable.
        // Incoming needs all unchanged props (No differ).
        // Existing could have more props.
        // Incoming could have more props.
        // Existing changes is replaced by incoming changes (Also differed).
        // Extra incoming props are added to existing props.


        if (typeof exchange === 'undefined') {
          exchange = findExactUnchangedMatch(endpoint);
        } // Unreliable.
        // Incoming needs all changed props (No differ).
        // Existing could have more props.
        // Incoming could have more props.
        // Existing props is replaced by incoming props (Also differed) if not changed.
        // Extra incoming props are added to existing props.


        if (typeof exchange === 'undefined') {
          exchange = findExactChangedMatch(endpoint);
        } // Unreliable.
        // Incoming props which matches existing (No differ).
        // Existing could have more props.
        // Incoming could have more props.
        // Extra incoming props are added to existing props.


        if (typeof exchange === 'undefined') {
          exchange = findIncomingMatch(endpoint);
        } // Unreliable.
        // Incoming props which matches unchanged existing (No differ).
        // Existing could have more props.
        // Incoming could have more props.
        // Existing changes is replaced by incoming changes (Also differed).
        // Extra incoming props are added to existing props.


        if (typeof exchange === 'undefined') {
          exchange = findUnchangedMatch(endpoint);
        } // Unreliable.
        // Incoming props which matches changed existing (No differ).
        // Existing could have more props.
        // Incoming could have more props.
        // Existing props is replaced by incoming props (Also differed) if not changed.
        // Extra incoming props are added to existing props.


        if (typeof exchange === 'undefined') {
          exchange = findChangedMatch(endpoint);
        }
      }

      return exchange;
    }; // Resolve Creation Identifier


    var resolveCreationIdentifier = function resolveCreationIdentifier(endpoint) {
      var match;

      for (var i = 0, l = accessor.children.length; i < l; i++) {
        var child = accessor.children[i];

        if (child.shared.map !== null && typeof child.shared.map !== 'undefined' && typeof child.shared.map.creationIdentifier !== 'undefined' && typeof child.shared.creationIdentifier !== 'undefined' && child.shared.creationIdentifier !== '') {
          var identifier = child.shared.map.creationIdentifier;
          var prop = identifier.split('=')[0];

          if (!endpoint.reserved(prop)) {
            if (typeof endpoint[prop] !== 'undefined' && typeof endpoint[prop].value !== 'undefined' && JSON.stringify(endpoint[prop].value).indexOf(child.shared.creationIdentifier) !== -1) {
              if (!endpoint.reserved(child.identifier.key)) {
                child.identifier.value = endpoint[child.identifier.key].value;
              } else {
                child.identifier.value = endpoint.invalids[child.identifier.key].value;
              }

              match = child;
            }
          } else {
            if (typeof endpoint.invalids[prop] !== 'undefined' && typeof endpoint.invalids[prop].value !== 'undefined' && JSON.stringify(endpoint.invalids[prop].value).indexOf(child.shared.creationIdentifier) !== -1) {
              if (!endpoint.reserved(child.identifier.key)) {
                child.identifier.value = endpoint[child.identifier.key].value;
              } else {
                child.identifier.value = endpoint.invalids[child.identifier.key].value;
              }

              match = child;
            }
          }
        }
      }

      return match;
    }; // Find exact match by all props (Reliable)


    var findExactMatch = function findExactMatch(endpoint) {
      var exchange = accessor.children.find(function (child) {
        if (child.identifier === null || child.identifier.value === null) {
          var props = child.props();
          var endpointProps = endpoint.props();
          var match = true; // Expect match

          Object.keys(props).reduce(function (prev, key) {
            if (typeof endpointProps[key] !== 'undefined') {
              if (JSON.stringify(props[key]) !== JSON.stringify(endpointProps[key])) {
                // If unchanged props doesnt match, set match to false
                match = false;
              }
            } else {
              match = false;
            }
          }, {});
          Object.keys(endpointProps).reduce(function (prev, key) {
            if (typeof props[key] === 'undefined') {
              match = false;
            }
          }, {});
          return match;
        } else {
          return false;
        }
      });
      return exchange;
    }; // Find exact match by all exisiting props (Reliable)


    var findExactExistingMatch = function findExactExistingMatch(endpoint) {
      var exchange = accessor.children.find(function (child) {
        if (child.identifier === null || child.identifier.value === null) {
          var props = child.props();
          var endpointProps = endpoint.props();
          var match = true; // Expect match

          Object.keys(props).reduce(function (prev, key) {
            if (typeof endpointProps[key] !== 'undefined') {
              if (JSON.stringify(props[key]) !== JSON.stringify(endpointProps[key])) {
                // If unchanged props doesnt match, set match to false
                match = false;
              }
            } else {
              match = false;
            }
          }, {});
          return match;
        } else {
          return false;
        }
      });
      return exchange;
    }; // Find exact match by unchanged props (Less Reliable - Requires incoming props to exist)


    var findExactUnchangedMatch = function findExactUnchangedMatch(endpoint) {
      var exchange = accessor.children.find(function (child) {
        if (child.identifier === null || child.identifier.value === null) {
          var changes = child.changes();
          var props = child.props();
          var endpointProps = endpoint.props();
          var match = true; // Expect match

          Object.keys(props).reduce(function (prev, key) {
            // If not changed prop
            if (typeof changes[key] === 'undefined') {
              // If new child has same prop
              if (typeof endpointProps[key] !== 'undefined') {
                // If they do not match
                if (JSON.stringify(props[key]) !== JSON.stringify(endpointProps[key])) {
                  // Skip this
                  match = false;
                } // If incoming prop doesnt exist

              } else {
                // Skip this
                match = false;
              }
            }
          }, {});
          return match;
        } else {
          return false;
        }
      });
      return exchange;
    }; // Find exact match by changed props (Less Reliable - Requires incoming props to exist)


    var findExactChangedMatch = function findExactChangedMatch(endpoint) {
      var exchange = accessor.children.find(function (child) {
        if (child.identifier === null || child.identifier.value === null) {
          var changes = child.changes();
          var props = child.props();
          var endpointProps = endpoint.props();
          var match = true; // Expect match

          Object.keys(props).reduce(function (prev, key) {
            // If changed prop
            if (typeof changes[key] !== 'undefined') {
              // If new child has same prop
              if (typeof endpointProps[key] !== 'undefined') {
                // If they do not match
                if (JSON.stringify(props[key]) !== JSON.stringify(endpointProps[key])) {
                  // Skip this
                  match = false;
                } // If incoming prop doesnt exist

              } else {
                // Skip this
                match = false;
              }
            }
          }, {});
          return match;
        } else {
          return false;
        }
      });
      return exchange;
    }; // Find match by unchanged props (Less Reliable - Doesnt require incoming props to exist)


    var findUnchangedMatch = function findUnchangedMatch(endpoint) {
      var exchange = accessor.children.find(function (child) {
        if (child.identifier === null || child.identifier.value === null) {
          var changes = child.changes();
          var props = child.props();
          var endpointProps = endpoint.props();
          var match = true; // Expect match

          Object.keys(props).reduce(function (prev, key) {
            // If not changed prop
            if (typeof changes[key] === 'undefined') {
              // If new child has same prop
              if (typeof endpointProps[key] !== 'undefined') {
                // If they do not match
                if (JSON.stringify(props[key]) !== JSON.stringify(endpointProps[key])) {
                  // Skip this
                  match = false;
                }
              }
            }
          }, {});
          return match;
        } else {
          return false;
        }
      });
      return exchange;
    }; // Find match by changed props (Less Reliable - Doesnt require incoming props to exist)


    var findChangedMatch = function findChangedMatch(endpoint) {
      var exchange = accessor.children.find(function (child) {
        if (child.identifier === null || child.identifier.value === null) {
          var changes = child.changes();
          var props = child.props();
          var endpointProps = endpoint.props();
          var match = true; // Expect match

          Object.keys(props).reduce(function (prev, key) {
            // If changed prop
            if (typeof changes[key] !== 'undefined') {
              // If new child has same prop
              if (typeof endpointProps[key] !== 'undefined') {
                // If they do not match
                if (JSON.stringify(props[key]) !== JSON.stringify(endpointProps[key])) {
                  // Skip this
                  match = false;
                }
              }
            }
          }, {});
          return match;
        } else {
          return false;
        }
      });
      return exchange;
    }; // Find exact match by incoming props (Less Reliable - Requires existing props to have all incoming props)


    var findExactIncomingMatch = function findExactIncomingMatch(endpoint) {
      var exchange = accessor.children.find(function (child) {
        if (child.identifier === null || child.identifier.value === null) {
          var props = child.props();
          var endpointProps = endpoint.props();
          var match = true; // Expect match

          Object.keys(endpointProps).reduce(function (prev, key) {
            if (typeof props[key] !== 'undefined') {
              if (JSON.stringify(props[key]) !== JSON.stringify(endpointProps[key])) {
                // If props are unique
                match = false;
              }
            } else {
              // If existing doesnt have all incoming props
              match = false;
            }
          }, {});
          return match;
        } else {
          return false;
        }
      });
      return exchange;
    }; // Find match by incoming props (Less Reliable - Doesnt require existing props to have all incoming props)


    var findIncomingMatch = function findIncomingMatch(endpoint) {
      var exchange = accessor.children.find(function (child) {
        if (child.identifier === null || child.identifier.value === null) {
          var props = child.props();
          var endpointProps = endpoint.props();
          var match = true; // Expect match

          Object.keys(endpointProps).reduce(function (prev, key) {
            if (typeof props[key] !== 'undefined') {
              if (JSON.stringify(props[key]) !== JSON.stringify(endpointProps[key])) {
                // If props are unique
                match = false;
              }
            }
          }, {});
          return match;
        } else {
          return false;
        }
      });
      return exchange;
    };

    var exchange;

    if (endpoint.identifier !== null) {
      exchange = accessor.children.find(function (child) {
        return typeof child.identifier !== 'undefined' && typeof endpoint.identifier !== 'undefined' && child.identifier !== null && child.identifier.value === endpoint.identifier.value;
      });

      if (typeof exchange === 'undefined' || exchange === false) {
        exchange = smartFind(endpoint);
      }
    } else {
      exchange = smartFind(endpoint);
    }

    if (typeof exchange !== 'undefined' && !remove) {
      // Handle Exchange
      return exchange.set(endpoint, false);
    } else if (!remove) {
      // If no match found but add by force, push to children
      if (add) {
        accessor.children.push(endpoint);
      }

      return false;
    } else if (typeof exchange !== 'undefined') {
      // Handle Remove
      var index = accessor.children.indexOf(exchange);

      if (index !== -1) {
        accessor.children.splice(index, 1);
      }

      return accessor.children;
    } else {
      return false;
    }
  };
  /**
   * Make Any Request
   */


  accessor.shared.makeRequest = function (canceler, method) {
    var apiSlug = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : accessor.shared.defaultApi;
    var args = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    var data = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
    var upload = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;
    var conf = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : {};
    var promise = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : new Promise(function (resolve) {
      return resolve();
    });
    var batch = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : false;
    // Custom Request Config (config level 3 - greater is stronger)
    conf = Object.assign((0, _util.clone)({}, accessor.shared.config), conf);

    if (canceler !== false) {
      var cancelHandler = accessor.shared.handleCancellation(cancelers[canceler]);
      cancelers[canceler] = cancelHandler.cancellation;
      promise = cancelHandler.promise;
    }

    return new Promise(function (resolve, reject) {
      // startLoader(method)
      var api = accessor.shared.controller !== null && apiSlug !== null ? accessor.shared.controller.apis[apiSlug] : accessor.shared.api;
      accessor.shared.requester[method.toLowerCase()](accessor.shared.resolveUrl(endpoint, accessor.shared.map, api, args, batch), promise, data, upload, conf).then(function (response) {
        accessor.raw = response; // stopLoader(method)

        resolve(response);
      })["catch"](function (error) {
        // stopLoader(method)
        reject(accessor.shared.handleError(error));
      });
    });
  };

  accessor.shared.identifier = function () {
    var identifier = null;

    if (accessor.identifier !== null && typeof accessor.identifier !== 'undefined' && accessor.identifier.key !== null) {
      if (!accessor.reserved(accessor.identifier.key)) {
        identifier = accessor[accessor.identifier.key];
      } else {
        identifier = accessor.invalids[accessor.identifier.key];
      }
    }

    return identifier;
  };
  /**
   * Public / Reserved Method Names
   * @warning Can not be used as a property name in models
   * ---------------
   * Query builder (Create arguments, and make endpoints default fetch method available afterwards)
   */


  accessor.query = function () {
    return new _query["default"](accessor);
  };
  /**
   * Request Fetch @note - Related to Properties
   */


  accessor.fetch = function () {
    var apiSlug = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : accessor.shared.defaultApi;
    var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : accessor.args.fetch;
    var replace = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    var perform = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
    return new Promise(function (resolve, reject) {
      var loadSlug = 'fetch';
      startLoader(loadSlug);
      accessor.shared.makeRequest(loadSlug, 'GET', apiSlug, args, null, false, {
        perform: perform
      }).then(function (response) {
        accessor.shared.handleSuccess(response, replace).then(function (results) {
          stopLoader(loadSlug);
          resolve(accessor);
        })["catch"](function (error) {
          stopLoader(loadSlug);
          reject(error);
        });
      })["catch"](function (error) {
        stopLoader(loadSlug);
        reject(error);
      });
    });
  };
  /**
   * Request Save @note - Saves all changed Properties
   * @apiSlug Use custom api by slug
   * @args Custom arguments as object (key: value)
   * @replace replace all properties in endpoint from response
   * @create Attempt to create if save fails (Ex.: if no id provided to endpoint)
   */


  accessor.save = function () {
    var apiSlug = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : accessor.shared.defaultApi;
    var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : accessor.args.save;
    var replace = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    var create = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
    var perform = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
    var map = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : accessor.shared.map;

    if (map !== null && typeof map !== 'undefined' && typeof map.multiple !== 'undefined' && map.multiple || accessor.shared.config.multiple) {
      return accessor.batch({
        create: create
      }, apiSlug, args, replace, map);
    } else {
      return new Promise(function (resolve, reject) {
        var loadSlug = 'save';
        startLoader(loadSlug);
        var identifier = accessor.shared.identifier();

        if (identifier !== null && identifier.value === null) {
          accessor.create(apiSlug, args, replace, true, perform).then(function (response) {
            stopLoader(loadSlug);
            resolve(accessor);
          })["catch"](function (error) {
            stopLoader(loadSlug);
            reject(error);
          });
        } else {
          accessor.shared.makeRequest(loadSlug, 'PUT', apiSlug, args, accessor.removeIdentifiers(accessor.reverseMapping(accessor.changes(false, false, true))), false, {
            perform: perform
          }).then(function (response) {
            accessor.shared.handleSuccess(response, replace).then(function (response) {
              stopLoader(loadSlug);
              resolve(accessor);
            })["catch"](function (error) {
              stopLoader(loadSlug);
              reject(error);
            });
          })["catch"](function (error) {
            // If could not save, try create
            if (create) {
              accessor.create(apiSlug, args, replace, true, perform).then(function (response) {
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
        }
      });
    }
  };
  /**
   * Request Create @note - Saves all Properties
   */


  accessor.create = function () {
    var apiSlug = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : accessor.shared.defaultApi;
    var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : accessor.args.create;
    var replace = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    var save = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
    var perform = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
    var map = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : accessor.shared.map;

    if (map !== null && typeof map !== 'undefined' && typeof map.multiple !== 'undefined' && map.multiple || accessor.shared.config.multiple) {
      return accessor.batch({
        save: save
      }, apiSlug, args, replace, perform, map);
    } else {
      return new Promise(function (resolve, reject) {
        var withEmpty = accessor.removeIdentifiers(accessor.reverseMapping());
        var data = {};

        if (!accessor.shared.config.post.keepNull) {
          Object.keys(withEmpty).reduce(function (prev, key) {
            if (withEmpty[key] !== null) {
              data[key] = withEmpty[key];
            }
          }, {});
        } else {
          data = withEmpty;
        }

        var loadSlug = 'create';
        startLoader(loadSlug);
        accessor.shared.makeRequest(loadSlug, 'POST', apiSlug, args, data, false, {
          perform: perform
        }).then(function (response) {
          accessor.shared.handleSuccess(response, replace).then(function (results) {
            stopLoader(loadSlug);
            resolve(accessor);
          })["catch"](function (error) {
            stopLoader(loadSlug);
            reject(error);
          });
        })["catch"](function (error) {
          stopLoader(loadSlug);
          reject(error);
        });
      });
    }
  };
  /**
   * Request Remove @note - Related to Properties
   */


  accessor.remove = function () {
    var apiSlug = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : accessor.shared.defaultApi;
    var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : accessor.args.remove;
    var replace = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    var perform = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
    var map = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : accessor.shared.map;

    if (map !== null && typeof map !== 'undefined' && typeof map.multiple !== 'undefined' && map.multiple || accessor.shared.config.multiple) {
      return accessor.batch({
        save: false,
        create: false,
        "delete": true
      }, apiSlug, args, replace, map);
    } else {
      return new Promise(function (resolve, reject) {
        var loadSlug = 'remove';
        startLoader(loadSlug);
        accessor.shared.makeRequest(loadSlug, 'DELETE', apiSlug, args, null, false, {
          perform: perform
        }).then(function (response) {
          if (typeof response !== 'undefined') {
            accessor.shared.handleSuccess(response, replace).then(function (results) {
              stopLoader(loadSlug);
              resolve(accessor);
            })["catch"](function (error) {
              stopLoader(loadSlug);
              reject(error);
            });
          } else {
            resolve(accessor);
          }
        })["catch"](function (error) {
          stopLoader(loadSlug);

          if (error.response && error.response.status === 410) {
            // Already deleted (Gone)
            resolve(accessor);
          } else {
            reject(error);
          }
        });
      });
    }
  };
  /**
   * Request Upload @note - Related to Properties
   * @note: batch upload not yet supported
   */


  accessor.upload = function (file) {
    var apiSlug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : accessor.shared.defaultApi;
    var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : accessor.args.upload;
    var replace = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
    var perform = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
    var method = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 'POST';
    var map = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;
    return new Promise(function (resolve, reject) {
      var loadSlug = 'upload';
      startLoader(loadSlug);
      accessor.shared.makeRequest(loadSlug, method, apiSlug, args, file, true, {
        perform: perform
      }).then(function (response) {
        if (map) {
          accessor.shared.handleSuccess(response, replace).then(function (results) {
            stopLoader(loadSlug);
            resolve(accessor);
          })["catch"](function (error) {
            stopLoader(loadSlug);
            reject(error);
          });
        } else {
          stopLoader(loadSlug);
          resolve(response);
        }
      })["catch"](function (error) {
        stopLoader(loadSlug);
        reject(error);
      });
    });
  };
  /**
   * Request Batch @note - Updates all children
   */


  accessor.batch = function () {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var apiSlug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : accessor.shared.defaultApi;
    var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : accessor.args.batch;
    var replace = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
    var perform = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
    var map = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : accessor.shared.map;
    options = Object.assign({
      create: true,
      save: true,
      "delete": false,
      merge: false,
      // Merge with parent props if any (usually there is none)
      limit: 100,
      // Split requests into limited amount of children
      from: 0 // Exclude children before index from request

    }, options);
    var data = {}; // Handle create

    if (options.create) {
      var hook = map !== null && typeof map !== 'undefined' && typeof map.batch !== 'undefined' && typeof map.batch.create !== 'undefined' ? map.batch.create : 'create';
      data[hook] = [];

      for (var i = 0, l = accessor.children.length; i < l; i++) {
        var child = accessor.children[i];

        if (i >= options.from && i < options.from + options.limit) {
          // Create Creation Identifier
          if (child.identifier === null || child.identifier.value === null) {
            (function () {
              if (child.shared.map !== null && typeof child.shared.map !== 'undefined' && typeof child.shared.map.creationIdentifier !== 'undefined' && child.shared.map.creationIdentifier !== '') {
                var identifier = child.shared.map.creationIdentifier;
                var prop = identifier.split('=')[0];
                var val = identifier.substring(prop.length + 1); // Resolve mapping

                if (typeof child.shared.map.props !== 'undefined' && typeof child.shared.map.props[prop] !== 'undefined') {
                  prop = child.shared.map.props[prop];
                } // Check if property exist and make reference to prop


                if (!child.reserved(prop) && typeof child[prop] !== 'undefined') {
                  prop = child[prop];
                } else if (child.reserved(prop) && typeof child.invalids[prop] !== 'undefined') {
                  prop = child.invalids[prop];
                } else {
                  // Create prop if not exist
                  if (!child.reserved(prop)) {
                    prop = child[prop] = new _prop["default"](child, prop);
                  } else {
                    prop = child.invalids[prop] = new _prop["default"](child, prop);
                  }
                } // Generate creation identifier


                var id = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 15);
                child.shared.creationIdentifier = id;

                if (val.length > 0) {
                  val = JSON.parse(val.replace('identifier', id));

                  if (prop.value === null) {
                    prop.value = val;
                  } else {
                    if (prop.value.constructor === Array && val.constructor === Array) {
                      prop.value = prop.value.concat(val);
                    } else if (prop.value.constructor !== Array && val.constructor !== Array) {
                      prop.value = Object.assign(prop.value, val);
                    }
                  }
                } else {
                  prop.value = id;
                }
              }

              var withEmpty = child.removeIdentifiers(child.reverseMapping(child.props(false, true)));
              var results = {};

              if (!accessor.shared.config.post.keepNull) {
                Object.keys(withEmpty).reduce(function (prev, key) {
                  if (withEmpty[key] !== null) {
                    results[key] = withEmpty[key];
                  }
                }, {});
              } else {
                results = withEmpty;
              }

              data[hook].push(results);
            })();
          }
        }
      }
    } // Handle save


    if (options.save) {
      var _hook = map !== null && typeof map !== 'undefined' && typeof map.batch !== 'undefined' && typeof map.batch.save !== 'undefined' ? map.batch.save : 'save';

      data[_hook] = [];

      for (var _i3 = 0, _l3 = accessor.children.length; _i3 < _l3; _i3++) {
        var _child2 = accessor.children[_i3];

        if (_i3 >= options.from && _i3 < options.from + options.limit) {
          if (_child2.identifier !== null && _child2.identifier.value !== null) {
            // If endpoint has identifier, secure that identifier is added for update and only post changes
            var obj = _child2.changes(false, false, true);

            obj[_child2.identifier.key] = _child2.identifier.value;

            data[_hook].push(accessor.reverseMapping(obj));
          } else if (_child2.identifier === null) {
            // If endpoint has no identifier, add the whole child, and not only props
            data[_hook].push(accessor.reverseMapping(_child2.props(false, true)));
          }
        }
      }
    } // Handle delete


    if (options["delete"]) {
      var _hook2 = map !== null && typeof map !== 'undefined' && typeof map.batch !== 'undefined' && typeof map.batch["delete"] !== 'undefined' ? map.batch["delete"] : 'delete';

      data[_hook2] = [];

      for (var _i4 = 0, _l4 = accessor.children.length; _i4 < _l4; _i4++) {
        var _child3 = accessor.children[_i4];

        if (_i4 >= options.from && _i4 < options.from + options.limit) {
          if (_child3.identifier !== null && _child3.identifier.value !== null) {
            // If endpoint has identifier only add id to array
            data[_hook2].push(_child3.identifier.value);
          } else if (_child3.identifier === null) {
            // If endpoint has no identifier, add the whole child, and not only props
            data[_hook2].push(accessor.reverseMapping(_child3.props(false, true)));
          }
        }
      }
    } // Handle merge


    if (options.merge) {
      data = Object.assign(accessor.removeIdentifiers(accessor.reverseMapping(accessor.props(false, true))), data);
    }

    return new Promise(function (resolve, reject) {
      var loadSlug = 'batch';
      startLoader(loadSlug);
      accessor.shared.makeRequest(loadSlug, 'POST', apiSlug, args, data, false, {
        perform: perform
      }, new Promise(function (resolve) {
        return resolve();
      }), true).then(function (response) {
        accessor.shared.handleSuccess(response, replace, null, true).then(function (results) {
          if (options.from + options.limit < accessor.children.length) {
            options.from += options.limit;
            accessor.batch(options, apiSlug, args, replace, perform, map).then(function (results) {
              stopLoader(loadSlug);
              resolve(accessor);
            })["catch"](function (error) {
              stopLoader(loadSlug);
              reject(error);
            });
          } else {
            stopLoader(loadSlug);
            resolve(accessor);
          }
        })["catch"](function (error) {
          stopLoader(loadSlug);
          reject(error);
        });
      })["catch"](function (error) {
        stopLoader(loadSlug);
        reject(error);
      });
    });
  };
  /**
   * Request Get @note - Unrelated to Properties
   */


  accessor.get = function () {
    var apiSlug = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : accessor.shared.defaultApi;
    var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : accessor.args.get;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var promise = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : new Promise(function (resolve) {
      return resolve();
    });
    var conf = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
    return accessor.shared.makeRequest(false, 'GET', apiSlug, args, data, upload, conf, promise);
  };
  /**
   * Request Post @note - Unrelated to Properties
   */


  accessor.post = function () {
    var apiSlug = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : accessor.shared.defaultApi;
    var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : accessor.args.post;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var promise = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : new Promise(function (resolve) {
      return resolve();
    });
    var conf = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
    return accessor.shared.makeRequest(false, 'POST', apiSlug, args, data, upload, conf, promise);
  };
  /**
   * Request Put @note - Unrelated to Properties
   */


  accessor.put = function () {
    var apiSlug = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : accessor.shared.defaultApi;
    var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : accessor.args.put;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var promise = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : new Promise(function (resolve) {
      return resolve();
    });
    var conf = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
    return accessor.shared.makeRequest(false, 'PUT', apiSlug, args, data, upload, conf, promise);
  };
  /**
   * Request Patch @note - Unrelated to Properties
   */


  accessor.patch = function () {
    var apiSlug = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : accessor.shared.defaultApi;
    var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : accessor.args.patch;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var promise = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : new Promise(function (resolve) {
      return resolve();
    });
    var conf = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
    return accessor.shared.makeRequest(false, 'PATCH', apiSlug, args, data, upload, conf, promise);
  };
  /**
   * Request Delete @note - Unrelated to Properties
   */


  accessor["delete"] = function () {
    var apiSlug = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : accessor.shared.defaultApi;
    var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : accessor.args["delete"];
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var promise = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : new Promise(function (resolve) {
      return resolve();
    });
    var conf = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
    return accessor.shared.makeRequest(false, 'DELETE', apiSlug, args, data, upload, conf, promise);
  };
  /**
   * Request Head @note - Unrelated to Properties
   */


  accessor.head = function () {
    var apiSlug = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : accessor.shared.defaultApi;
    var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : accessor.args.head;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var promise = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : new Promise(function (resolve) {
      return resolve();
    });
    var conf = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
    return accessor.shared.makeRequest(false, 'HEAD', apiSlug, args, data, upload, conf, promise);
  };
  /**
   * Request Trace @note - Unrelated to Properties
   */


  accessor.trace = function () {
    var apiSlug = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : accessor.shared.defaultApi;
    var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : accessor.args.trace;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var promise = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : new Promise(function (resolve) {
      return resolve();
    });
    var conf = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
    return accessor.shared.makeRequest(false, 'TRACE', apiSlug, args, data, upload, conf, promise);
  };
  /**
   * Request Connect @note - Unrelated to Properties
   */


  accessor.connect = function () {
    var apiSlug = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : accessor.shared.defaultApi;
    var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : accessor.args.connect;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var promise = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : new Promise(function (resolve) {
      return resolve();
    });
    var conf = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
    return accessor.shared.makeRequest(false, 'CONNECT', apiSlug, args, data, upload, conf, promise);
  };
  /**
   * Request Options @note - Unrelated to Properties
   */


  accessor.options = function () {
    var apiSlug = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : accessor.shared.defaultApi;
    var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var args = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : accessor.args.options;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var promise = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : new Promise(function (resolve) {
      return resolve();
    });
    var conf = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
    return accessor.shared.makeRequest(false, 'OPTIONS', apiSlug, args, data, upload, conf, promise);
  };
  /**
   * Set / Update Properties
   * Data = Either Endpoint Model or raw JSON if raw = true
   */


  accessor.set = function (data) {
    var change = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var raw = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var updateKey = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    var map = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
    var nokey = updateKey === null;
    Object.keys(data).reduce(function (prev, key) {
      var alive = nokey || key === updateKey;
      var reserved = accessor.reserved(key);
      var hook = accessor;

      if (!raw) {
        if (!reserved && typeof hook[key] === 'undefined' && alive) {
          hook[key] = new _prop["default"](accessor, key, data[key].value, typeof data[key].config !== 'undefined' ? data[key].config : {}, data[key].transpiler);
        } else if (!reserved && alive && hook[key].value !== data[key].value) {
          hook[key].value = data[key].value;

          if (typeof data[key].config !== 'undefined') {
            hook[key].config = Object.assign(hook[key].config, data[key].config);
          }

          hook[key].changed(change ? typeof data[key].changed === 'function' ? data[key].changed() : false : false);
        } else if (key === 'invalids') {
          Object.keys(data[key]).reduce(function (prev, prop) {
            var living = nokey || prop === updateKey;

            if (typeof hook[key][prop] === 'undefined' && living) {
              hook[key][prop] = new _prop["default"](accessor, prop, data[key].value, typeof data[key].config !== 'undefined' ? data[key].config : {}, data[key].transpiler);
            } else if (living && hook[key][prop].value !== data[key][prop].value) {
              hook[key][prop].value = data[key][prop].value;

              if (typeof data[key][prop].config !== 'undefined') {
                hook[key][prop].config = Object.assign(hook[key][prop].config, data[key][prop].config);
              }

              hook[key][prop].changed(change ? typeof data[key][prop].changed === 'function' ? data[key][prop].changed() : false : false);
            }
          }, {});
        }
      } else {
        if (map === null) {
          map = accessor.shared.map;
        }

        var prop = map !== null && typeof map !== 'undefined' && typeof map.props !== 'undefined' && typeof map.props[key] !== 'undefined' ? map.props[key] : key;

        if (alive) {
          if (reserved) {
            hook = accessor.invalids;
          }

          if (typeof hook[prop] !== 'undefined' && hook[prop].value !== data[key]) {
            hook[prop].value = data[key];
            hook[prop].changed(change);
          } else if (typeof hook[prop] === 'undefined') {
            hook[prop] = new _prop["default"](accessor, prop, data[key], typeof data[key].config !== 'undefined' ? data[key].config : {}, data[key].transpiler);
          } else {
            hook[prop].changed(change);
          }
        }
      }
    }, {});
    return updateKey === null ? accessor : accessor.reserved(updateKey) ? accessor.invalid[updateKey] : accessor[updateKey];
  };
  /**
   * Clear Properties
   */


  accessor.clear = function () {
    var keep = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ['id'];
    var change = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    // Stop Running Property Requests
    Object.keys(cancelers).reduce(function (prev, key) {
      if (cancelers[key] !== null) {
        cancelers[key]();
      }
    }, {}); // Reset loaders

    accessor.loading = false;
    accessor.loaders = []; // Reset properties

    Object.keys(accessor).reduce(function (prev, key) {
      if (!accessor.reserved(key) && keep.indexOf(key) === -1 && accessor[key].value !== null) {
        accessor[key].value = null;
        accessor[key].changed(change);
      }
    }, {}); // Empty invalids

    accessor.invalids = {};
    accessor.children = [];
    return accessor;
  };
  /**
   * Get all props including invalids as object without reserved methods / variables
   * reference === true returns reference. Else only value is returned
   */


  accessor.props = function () {
    var reference = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    var apiReady = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var obj = {};

    if (reference) {
      Object.keys(accessor).reduce(function (prev, key) {
        if (!accessor.reserved(key)) {
          obj[key] = accessor[key];
        }
      }, {});
      Object.keys(accessor.invalids).reduce(function (prev, key) {
        obj[key] = accessor[key];
      }, {});
    } else {
      Object.keys(accessor).reduce(function (prev, key) {
        if (!accessor.reserved(key)) {
          obj[key] = apiReady ? accessor[key].apiValue() : accessor[key].value;
        }
      }, {});
      Object.keys(accessor.invalids).reduce(function (prev, key) {
        obj[key] = apiReady ? accessor.invalids[key].apiValue() : accessor.invalids[key].value;
      }, {});
    }

    return obj;
  };
  /**
   * Get all changed props including invalids as object without reserved methods / variables
   * reference === true returns reference. Else only value is returned
   */


  accessor.changes = function () {
    var reference = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    var arr = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var apiReady = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var obj = {};
    var array = [];

    if (reference) {
      Object.keys(accessor).reduce(function (prev, key) {
        if (!accessor.reserved(key)) {
          if (accessor[key].changed()) {
            arr ? array.push(accessor[key]) : obj[key] = accessor[key];
          }
        }
      }, {});
      Object.keys(accessor.invalids).reduce(function (prev, key) {
        if (accessor.invalids[key].changed()) {
          arr ? array.push(accessor.invalids[key]) : obj[key] = accessor.invalids[key];
        }
      }, {});
    } else {
      Object.keys(accessor).reduce(function (prev, key) {
        if (!accessor.reserved(key)) {
          if (accessor[key].changed()) {
            var val = apiReady ? accessor[key].apiValue() : accessor[key].value;
            arr ? array.push(key, val) : obj[key] = val;
          }
        }
      }, {});
      Object.keys(accessor.invalids).reduce(function (prev, key) {
        if (accessor.invalids[key].changed()) {
          var val = apiReady ? accessor.invalids[key].apiValue() : accessor.invalids[key].value;
          arr ? array.push([key, val]) : obj[key] = val;
        }
      }, {});
    }

    return arr ? array : obj;
  };
  /**
   * Check if property key is reserved
   */


  accessor.reserved = function (key) {
    return accessor.shared.reserved.indexOf(key) !== -1;
  };
  /**
   * Clone Endpoint
   */


  accessor.clone = function () {
    var change = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
    var cl = new Endpoint(accessor, accessor.shared.controller, accessor.shared.defaultApi, accessor.shared.predefined, accessor.shared.config);
    cl.args = (0, _util.clone)({}, accessor.args);
    cl.raw = (0, _util.clone)({}, accessor.raw);
    cl.set(accessor, change);

    for (var i = 0, l = accessor.children.length; i < l; i++) {
      var child = accessor.children[i];
      cl.children.push(child.clone(change));
    }

    return cl;
  };
  /**
   * ReverseMapping
   */


  accessor.reverseMapping = function () {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    var reference = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var map = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : accessor.shared.map;
    var apiReady = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

    if (props === null) {
      props = accessor.props(reference, apiReady);
    }

    var reverse = {};

    try {
      // Clone props
      if (reference) {
        Object.keys(props).reduce(function (prev, key) {
          if (apiReady) {
            reverse[key] = (0, _util.clone)({}, props[key].apiValue());
          } else {
            reverse[key] = (0, _util.clone)({}, props[key].value);
          }
        }, {});
      } else {
        reverse = (0, _util.clone)({}, props);
      }

      if (map !== null && typeof map !== 'undefined' && typeof map.props !== 'undefined') {
        // Replace keys in props with mappings
        Object.keys(map.props).reduce(function (prev, key) {
          if (typeof reverse[map.props[key]] !== 'undefined') {
            // @note - If keys in props Collides with mapping, its overwritten
            reverse[key] = reverse[map.props[key]];
            delete reverse[map.props[key]];
          }
        }, {});
      }
    } catch (error) {
      console.error(error);
    }

    return reverse;
  };
  /**
   * Remove Identifiers before making request. Takes raw only, not references
   */


  accessor.removeIdentifiers = function (props) {
    var endpoint = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : accessor.shared.endpoint;
    var map = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : accessor.shared.map;
    var path = map !== null && typeof map !== 'undefined' ? map.endpoint : endpoint;
    var identifiers = accessor.identifiers(path);
    Object.keys(props).reduce(function (prev, key) {
      if (typeof identifiers[key] !== 'undefined') {
        delete props[key];
      }
    }, {});
    return props;
  };
  /**
   * Identifiers - Resolve Identifiers. Ex.: {id} or {/parentId} etc. in path
   */


  accessor.identifiers = function (path) {
    var identifiers = {}; // Resolve Identifiers. Ex.: {id} or {/parentId} etc...

    if (path.indexOf('}') !== '-1') {
      var optionals = path.split('}');

      for (var i = 0, l = optionals.length; i < l; i++) {
        var opt = optionals[i];
        var index = opt.indexOf('{');

        if (index !== -1) {
          var hook = opt.substring(index) + '}';
          var prop = hook.replace('{', '').replace('}', '');
          var slash = false;

          if (prop.indexOf('/') !== -1) {
            prop = prop.replace('/', '');
            slash = true;
          }

          identifiers[prop] = {
            slash: slash,
            hook: hook
          };
        }
      }
    }

    return identifiers;
  };
  /**
   * Sort children
   * @param key
   */


  accessor.sort = function () {
    var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'menu_order';

    var compare = function compare(a, b) {
      if (!accessor.reserved(key)) {
        if (a[key].value < b[key].value) {
          return -1;
        } else if (a[key].value > b[key].value) {
          return 1;
        }
      } else {
        if (a.invalids[key].value < b.invalids[key].value) {
          return -1;
        } else if (a.invalids[key].value > b.invalids[key].value) {
          return 1;
        }
      }

      return 0;
    };

    accessor.children.sort(compare);
  };

  init(); // Run at Construction
};

exports["default"] = Endpoint;
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _endpoint = _interopRequireDefault(require("./endpoint"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

/**
 * List
 */
var List =
/*#__PURE__*/
function (_Endpoint) {
  _inherits(List, _Endpoint);

  function List(Endpoint) {
    var controller = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var apiSlug = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var predefined = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var config = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

    _classCallCheck(this, List);

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


    return _possibleConstructorReturn(this, _getPrototypeOf(List).call(this, endpoint, controller, apiSlug, Object.assign({
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
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _util = require("../services/util");

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Prop
 */
var Prop = function Prop() {
  var parent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  var key = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var value = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var config = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var transpiler = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;

  _classCallCheck(this, Prop);

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
      isChanged = _typeof(accessor.value) !== _typeof(value) || accessor.value !== value;
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
          parent.shared.handleSuccess(response, replace, key).then(function (results) {
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
          parent.shared.handleSuccess(response, replace, key).then(function (results) {
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
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Query
 */
var Query = function Query(endpoint) {
  _classCallCheck(this, Query);

  var accessor = this;
  var queries = [];
  var argsMap = {};

  if (endpoint.shared.map !== null && typeof endpoint.shared.map.args !== 'undefined') {
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
"use strict";

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

var _controller = _interopRequireDefault(require("./services/controller"));

var _requester = _interopRequireDefault(require("./services/requester"));

var _endpoint = _interopRequireDefault(require("./form/endpoint"));

var _list = _interopRequireDefault(require("./form/list"));

var _prop = _interopRequireDefault(require("./form/prop"));

var _util = require("./services/util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Papir
 */
var Papir = function Papir() {
  var _this = this;

  var opt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  _classCallCheck(this, Papir);

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
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.Controller = void 0;

var _requester = _interopRequireDefault(require("./requester"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Controller
 */
var Controller = function Controller() {
  var _this = this;

  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  _classCallCheck(this, Controller);

  options = {
    config: typeof options.config !== 'undefined' ? options.config : {},
    serverBase: typeof options.serverBase !== 'undefined' ? options.serverBase : null,
    apis: typeof options.apis !== 'undefined' ? options.apis : require('../apis.json')
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
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Encode = function Encode() {
  var _this = this;

  _classCallCheck(this, Encode);

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
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _util = _interopRequireWildcard(require("./util"));

var _axios = _interopRequireDefault(require("axios"));

var _sign = _interopRequireDefault(require("./sign"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Requester
 */
var Requester = function Requester() {
  var _this = this;

  var customConf = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  _classCallCheck(this, Requester);

  if (typeof customConf.key !== 'undefined') {
    localStorage.setItem('papir.key', customConf.key);
  }

  if (typeof customConf.secret !== 'undefined') {
    localStorage.setItem('papir.secret', customConf.secret);
  }

  if (typeof customConf.token !== 'undefined' && customConf.token.constructor === Object) {
    localStorage.setItem('papir.token', JSON.stringify(customConf.token));
  }

  this.conf = {
    responseType: 'json',
    // ['arraybuffer', 'blob', 'document', 'json', 'text', 'stream']
    headers: {},
    override: {
      arg: '_method',
      // The query argument to be given actual method
      method: null // The replacement method. (will be fired instead of actual method. Ex.: 'OPTIONS')

    },
    name: null,
    // Root key where data is attached in data
    addDataToQuery: true,
    keepEmpty: true,
    keepEmptyInArrays: true,
    keepEmptyArray: true,
    keepNull: true,
    keepNullInArrays: true,
    protocol: 'rfc3986',
    delimiter: '&',
    splitter: '=',
    divider: '?',
    encodeNames: true,
    encodeValues: true,
    encodeNull: true,
    excludes: [],
    includes: [],
    dotNotation: false,
    authQuery: true,
    authHeader: false,
    dateFormat: '',
    authentication: 'oauth',
    version: '1.0a',
    type: 'one_legged',
    algorithm: 'HMAC-SHA1',
    key: localStorage.getItem('papir.key') !== null ? localStorage.getItem('papir.key') : '',
    secret: localStorage.getItem('papir.secret') !== null ? localStorage.getItem('papir.secret') : '',
    token: localStorage.getItem('papir.token') !== null ? JSON.parse(localStorage.getItem('papir.token')) : {
      key: '',
      secret: ''
    },
    nonce: '',
    nonceLength: 6,
    nonceTale: '',
    timestampLength: 30,
    indexArrays: true,
    emptyArrayToZero: false,
    keepArrayTags: true,
    requester: null,
    base64: true,
    ampersand: true,
    sort: true,
    // Conf specific per method type. (Same Options as above)
    get: {},
    post: {
      keepNull: false,
      keepEmpty: false,
      keepEmptyArray: false
    },
    put: {},
    patch: {},
    "delete": {},
    head: {},
    trace: {},
    connect: {},
    options: {},
    perform: true // If false, axios config will be returned instead

  };

  this.objMerge = function (target, custom) {
    var cl = Object.assign({}, target); // Ensures target not to inherit params from custom

    return Object.assign(cl, custom);
  };

  this.conf = this.objMerge(this.conf, customConf);
  this.getConf = this.objMerge(this.conf, this.conf.get);
  this.postConf = this.objMerge(this.conf, this.conf.post);
  this.putConf = this.objMerge(this.conf, this.conf.put);
  this.patchConf = this.objMerge(this.conf, this.conf.patch);
  this.deleteConf = this.objMerge(this.conf, this.conf["delete"]);
  this.headConf = this.objMerge(this.conf, this.conf.head);
  this.traceConf = this.objMerge(this.conf, this.conf.trace);
  this.connectConf = this.objMerge(this.conf, this.conf.connect);
  this.optionsConf = this.objMerge(this.conf, this.conf.options); // READ

  this.get = function (url, promise) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var conf = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    conf = _this.objMerge(_this.getConf, conf);
    return _this.custom('GET', url, promise, data, upload, conf);
  }; // CREATE


  this.post = function (url, promise) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var conf = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    conf = _this.objMerge(_this.postConf, conf);
    return _this.custom('POST', url, promise, data, upload, conf);
  }; // UPDATE / REPLACE


  this.put = function (url, promise) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var conf = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    conf = _this.objMerge(_this.putConf, conf);
    return _this.custom('PUT', url, promise, data, upload, conf);
  }; // UPDATE / MODIFY


  this.patch = function (url, promise) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var conf = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    conf = _this.objMerge(_this.patchConf, conf);
    return _this.custom('PATCH', url, promise, data, upload, conf);
  }; // DELETE


  this["delete"] = function (url, promise) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var conf = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    conf = _this.objMerge(_this.deleteConf, conf);
    return _this.custom('DELETE', url, promise, data, upload, conf);
  }; // GET HEADERS ONLY / NO CONTENT


  this.head = function (url, promise) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var conf = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    conf = _this.objMerge(_this.headConf, conf);
    return _this.custom('HEAD', url, promise, data, upload, conf);
  }; // GET ADDITIONS / CHANGES


  this.trace = function (url, promise) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var conf = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    conf = _this.objMerge(_this.traceConf, conf);
    return _this.custom('TRACE', url, promise, data, upload, conf);
  }; // CONVERT TO TCP / IP TUNNEL


  this.connect = function (url, promise) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var conf = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    conf = _this.objMerge(_this.connectConf, conf);
    return _this.custom('CONNECT', url, promise, data, upload, conf);
  }; // PERMISSION


  this.options = function (url, promise) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var conf = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    conf = _this.objMerge(_this.optionsConf, conf);
    return _this.custom('OPTIONS', url, promise, data, upload, conf);
  };

  this.custom = function (method, url, promise) {
    var data = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    var upload = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    var conf = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : _this.conf;
    conf = _this.objMerge(_this.conf, conf);
    return _this.request(method, url, promise, data, upload, conf);
  };

  this.request = function (method, url, abortPromise) {
    var data = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    var upload = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    var conf = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : _this.conf;

    /**
     * Correct order of creating a request:
     */
    var request = {}; // 1. Append protocol (http / https)
    // 2. Append base (://baseurl.com)
    // 3. Append path (/api/v1/users/362)
    // 4.1 Append arguments (?arg1=0&arg2=1)

    request.url = url; // 4.2 Encode arguments after first divider until second divider.
    // Ex.: ignored?encoded?ignored?ignored

    request.url = _util["default"].querystring.encode(request.url, {
      protocol: conf.protocol,
      divider: conf.divider,
      delimiter: conf.delimiter,
      splitter: conf.splitter,
      encodeNull: conf.encodeNull,
      keepEmpty: conf.keepEmpty,
      encodeNames: conf.encodeNames,
      encodeValues: conf.encodeValues
    }); // 5.1 Append data to querystring arguments if required

    if (conf.addDataToQuery && !upload) {
      request.url = _this.makeDataQuery(request.url, data, {
        name: conf.name,
        // Root key where data is attached
        protocol: conf.protocol,
        encodeNull: conf.encodeNull,
        dateFormat: conf.dateFormat,
        // Default ISO 8601
        keepEmpty: conf.keepEmpty,
        keepNull: conf.keepNull,
        keepNullInArrays: conf.keepNullInArrays,
        keepEmptyArray: conf.keepEmptyArray,
        keepEmptyInArrays: conf.keepEmptyInArrays,
        delimiter: conf.delimiter,
        splitter: conf.splitter,
        dotNotation: conf.dotNotation,
        encodeNames: conf.encodeNames,
        encodeValues: conf.encodeValues,
        indexArrays: conf.indexArrays,
        excludes: conf.excludes,
        // At first level
        includes: conf.includes,
        // At first level. includes overrides excludes
        emptyArrayToZero: conf.emptyArrayToZero,
        keepArrayTags: conf.keepArrayTags
      }, conf);
      data = null;
    } // 5.2. Append index to arrays in querystring if required


    if (conf.indexArrays) {
      request.url = _util["default"].querystring.indexArrays(request.url);
    } // 6 Sort arguments if required


    var querystring = '';
    var sortable = [];

    _util["default"].getParams(request.url).forEach(function (param) {
      sortable.push(param.key + conf.splitter + param.value + conf.delimiter);
    });

    sortable.sort();
    sortable.forEach(function (param) {
      querystring += param;
    });

    if (querystring !== '') {
      querystring = querystring.slice(0, -1);
      request.url = _util["default"].stripUri(request.url) + conf.divider + querystring;
    } else {
      request.url = _util["default"].stripUri(request.url);
    } // 7. Append data to request


    if (data !== null) {
      request.data = data;
    } // 8. Append method


    request.method = method; // 9. Append method override if required

    if (conf.override.method !== null && method !== conf.override.method) {
      request.method = conf.override.method;
      request.url += request.url.indexOf(conf.divider) === -1 ? conf.divider : conf.delimiter;
      request.url += conf.override.arg + conf.splitter + method;
    } // 10. Append headers

    /**
     * @note - Simple headers which passes preflight:
     * Accept (This should be declared in api config. [what response content does the client accept?]) 'application/json'
     * Accept-Language
     * Content-Language (This should be declared in api config. [what request content does the client send?]) 'application/json'
     * Content-Type [application/x-www-form-urlencoded, multipart/form-data, text/plain] (Others creates preflight)
     * DPR
     * Downlink
     * Save-Data
     * Viewport-Width
     * Width
     * (Other headers creates preflight)
     */
    // Get predefined headers


    request.headers = conf.headers; // If no data provided, set content-type to text/plain so preflight is avoided

    if (typeof request.data === 'undefined') {
      request.headers['Content-Type'] = 'text/plain';
    } // If data provided and it is a upload request, tell the server


    if (upload) {
      // @todo - Could be changed to multipart/form-data for multiupload, multi content later?
      request.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } // 11. Authorize


    if (typeof conf.authentication === 'function') {
      request = conf.authentication(request, conf);
    } else if (conf.authentication === 'oauth') {
      // OAUTH
      // 1. Prepare configuration to be signed
      conf.url = request.url;
      conf.method = request.method; // 2. If authentication should be applied to querystring

      if (conf.authQuery) {
        request.url = _util["default"].stripUri(request.url) + conf.divider + _sign["default"].gen(conf).string;
      } // 3. If authentication should be applied to header


      if (conf.authHeader) {
        request.headers['Authorization'] = _sign["default"].gen(conf).header;
      }
    } else if (conf.authentication === 'nonce') {
      // ADD TOKEN / NONCE AT END OF QUERYSTRING
      request = _this.makeTale(request, conf);
    } // 12. Make request abortable


    request = _this.makeAbortable(request, abortPromise); // 13. Transform response
    // Set response type ['arraybuffer', 'blob', 'document', 'json', 'text', 'stream']

    request.responseType = conf.responseType; // Transform Response to raw

    request.transformResponse = function (response) {
      return response;
    }; // 14. If request should be applied, perform and return


    if (conf.perform) {
      return _axios["default"].request(request);
    } // 15. If only the axios config object is needed, return resolved promise


    return new Promise(function (resolve) {
      resolve(request);
    });
  };

  this.makeDataQuery = function (url, data, options) {
    var conf = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : _this.conf;

    if (data !== null) {
      var queryString = _util["default"].querystring.stringify(data, options);

      if (url.indexOf(conf.divider) === -1 && queryString !== '') {
        url += conf.divider + queryString;
      } else if (queryString !== '') {
        url += conf.delimiter + queryString;
      }
    }

    return url;
  };

  this.makeTale = function (request) {
    var conf = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _this.conf;

    // Set nonce based on localized object / var
    if (conf.nonceTale !== '') {
      var query = conf.nonceTale.split(conf.splitter);

      if (query.length === 2) {
        var param = query[0];
        var hook = query[1];

        if (param.length > 0) {
          try {
            // @warning - eval can be harmful if used server side

            /* eslint-disable */
            var nonce = String(eval(hook));
            /* eslint-enable */

            if (request.url.indexOf(conf.divider) === -1) {
              request.url += conf.divider + param + conf.splitter + nonce;
            } else {
              request.url += conf.delimiter + param + conf.splitter + nonce;
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    }

    return request;
  };

  this.makeAbortable = function (request, promise) {
    var cancel;
    request.cancelToken = _axios["default"].CancelToken(function executor(c) {
      cancel = c;
    });
    promise.then(function () {
      cancel();
    });
    return request;
  };

  this.verifyToken = function (url) {
    var token = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
    var conf = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _this.conf;
    window.open(url + conf.divider + (token !== '' ? _util["default"].querystring.stringify({
      oauth_token: token
    }) : ''), '_blank');
  };

  this.getTokenRequest = function (url) {
    var scope = _this;
    var conf = (0, _util.clone)({}, _this.getConf);
    conf.addDataToQuery = false;
    conf.authHeader = true;
    return new Promise(function (resolve, reject) {
      scope.get(url, null, false, false, conf).then(function (res) {
        resolve(res);
      })["catch"](function (e) {
        reject(e);
      });
    });
  };

  this.getTokenAccess = function (url, requestToken, requestTokenSecret, verifierToken) {
    url = url + '?oauth_verifier=' + verifierToken;
    var scope = _this;
    var conf = (0, _util.clone)({}, _this.getConf);
    conf.addDataToQuery = false;
    conf.authHeader = true;
    conf.key = requestToken;
    conf.secret = requestTokenSecret;
    return new Promise(function (resolve, reject) {
      scope.get(url, null, false, false, conf).then(function (res) {
        resolve(res);
      })["catch"](function (e) {
        reject(e);
      });
    });
  };
};

exports["default"] = Requester;
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _crypto = _interopRequireDefault(require("crypto"));

var _util = _interopRequireDefault(require("./util"));

var _encode = _interopRequireDefault(require("./encode"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Sign = function Sign() {
  _classCallCheck(this, Sign);

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
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clone = exports["default"] = void 0;

var _encode2 = _interopRequireDefault(require("./encode"));

var _moment = _interopRequireDefault(require("moment"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Util = function Util() {
  var _this = this;

  _classCallCheck(this, Util);

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
  if (_typeof(obj) === 'object' && obj !== null) {
    for (var i in obj) {
      target[i] = _typeof(obj[i]) === 'object' && obj[i] !== null ? clone(obj[i].constructor(), obj[i]) : obj[i];
    }
  } else {
    return obj;
  }

  return target;
};

exports.clone = clone;
