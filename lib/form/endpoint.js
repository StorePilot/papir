"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _prop = _interopRequireDefault(require("./prop"));

var _query = _interopRequireDefault(require("./query"));

var _axios = _interopRequireDefault(require("axios"));

var _util = require("../services/util");

/**
 * Endpoint
 */
var Endpoint = function Endpoint(endpoint, controller) {
  var _this = this;

  var apiSlug = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var predefined = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var config = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
  (0, _classCallCheck2["default"])(this, Endpoint);

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
    if (typeof accessor.shared.endpoint !== 'string' && typeof accessor.shared.endpoint !== 'undefined') {
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
          } else if (multiple) {
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


  accessor.exchange = function (endpoint)
  /* , map = accessor.shared.map */
  {
    var add = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var reliable = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var remove = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

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
      accessor.shared.requester[method.toLowerCase()](accessor.shared.resolveUrl(accessor.shared.endpoint, accessor.shared.map, api, args, batch), promise, data, upload, conf).then(function (response) {
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
        accessor.shared.handleSuccess(response, replace).then(function () {
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
          accessor.create(apiSlug, args, replace, true, perform).then(function () {
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
            accessor.shared.handleSuccess(response, replace).then(function () {
              stopLoader(loadSlug);
              resolve(accessor);
            })["catch"](function (error) {
              stopLoader(loadSlug);
              reject(error);
            });
          })["catch"](function (error) {
            // If could not save, try create
            if (create) {
              accessor.create(apiSlug, args, replace, true, perform).then(function () {
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
          accessor.shared.handleSuccess(response, replace).then(function () {
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
            accessor.shared.handleSuccess(response, replace).then(function () {
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
          accessor.shared.handleSuccess(response, replace).then(function () {
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
        accessor.shared.handleSuccess(response, replace, null, true).then(function () {
          if (options.from + options.limit < accessor.children.length) {
            options.from += options.limit;
            accessor.batch(options, apiSlug, args, replace, perform, map).then(function () {
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