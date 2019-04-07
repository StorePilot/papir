import Prop from './prop';
import Query from './query';
import axios from 'axios';
import { clone } from '../services/util';
/**
 * Endpoint
 */

export default class Endpoint {
  constructor(endpoint, controller, apiSlug = null, predefined = {}, config = {}) {
    /**
     * Public Scope
     */
    let accessor = this;
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
      delete: [],
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
    let cancelers = {
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

    let init = (accessor = this) => {
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

        accessor.args = clone({}, accessor.shared.endpoint.args);
        accessor.set(accessor.shared.endpoint, false); // Replace props

        accessor.shared.config = accessor.shared.endpoint.shared.config; // Replace config

        accessor.shared.endpoint = accessor.shared.endpoint.shared.endpoint; // Replace endpoint string
      }
      /**
       * Map Resolver
       */


      let resolveMap = () => {
        let map = null;

        try {
          map = accessor.shared.api.mappings[accessor.shared.endpoint];

          if (typeof map !== 'undefined' && typeof map.config !== 'undefined' && map.config.constructor === Object) {
            // Mapped Config (config level 1 - greater is stronger)
            accessor.shared.config = Object.assign(clone({}, accessor.shared.config), map.config);
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
        accessor.shared.defaultApi = accessor.shared.defaultApi === null ? accessor.shared.controller.default : accessor.shared.defaultApi;
        accessor.shared.api = accessor.shared.controller.apis[accessor.shared.defaultApi];
        accessor.shared.requester = accessor.shared.api.requester;
        accessor.shared.map = resolveMap(); // Custom Config (config level 2 - greater is stronger)

        accessor.shared.config = Object.assign(clone({}, accessor.shared.config), config);
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


    accessor.shared.buildProps = (map = accessor.shared.map, predefined = accessor.shared.predefined) => {
      if (map !== null && typeof map !== 'undefined' && typeof map.props !== 'undefined') {
        try {
          Object.keys(map.props).reduce((prev, key) => {
            if (!accessor.reserved(key) && typeof accessor[key] === 'undefined') {
              accessor[map.props[key]] = new Prop(accessor, map.props[key], null);
            } else if (key === 'invalids' && typeof accessor.invalids[key] === 'undefined') {
              accessor.invalids[map.props[key]] = new Prop(accessor, map.props[key], null);
            }
          }, {});
        } catch (error) {
          console.error('Error in property mapping for api ' + accessor.shared.defaultApi);
          console.error(map.props);
        }
      }

      try {
        Object.keys(predefined).reduce((prev, key) => {
          if (!accessor.reserved(key) && typeof accessor[key] === 'undefined') {
            accessor[key] = new Prop(accessor, key, predefined[key]);
          } else if (!accessor.reserved(key) && typeof accessor[key] !== 'undefined') {
            accessor[key].value = predefined[key];
            accessor[key].changed(false);
          } else if (accessor.reserved(key) && typeof accessor.invalids[key] === 'undefined') {
            accessor.invalids[key] = new Prop(accessor, key, predefined[key]);
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
        let mappedIdentifier = map.identifier;

        if (typeof map.props !== 'undefined' && typeof map.props[map.identifier] !== 'undefined') {
          mappedIdentifier = map.props[map.identifier];
        }

        if (!accessor.reserved(mappedIdentifier) && typeof accessor[mappedIdentifier] !== 'undefined') {
          accessor.identifier = accessor[mappedIdentifier];
        } else if (accessor.reserved(mappedIdentifier) && typeof accessor.invalids[mappedIdentifier] !== 'undefined') {
          accessor.identifier = accessor.invalids[mappedIdentifier];
        } else if (!accessor.reserved(mappedIdentifier)) {
          accessor.identifier = accessor[mappedIdentifier] = new Prop(accessor, mappedIdentifier);
        } else {
          accessor.identifier = accessor.invalids[mappedIdentifier] = new Prop(accessor, mappedIdentifier);
        }
      } else {
        accessor.identifier = null;
      }
    };
    /**
     * Url Resolver
     */


    accessor.shared.resolveUrl = (endpoint = accessor.shared.endpoint, map = accessor.shared.map, api = accessor.shared.api, args = null, batch = false) => {
      let base = api !== null && typeof api.base !== 'undefined' ? api.base : ''; // Remove last slash if any from base

      if (base.length > 0 && base[base.length - 1] === '/') {
        base = base.slice(0, -1);
      }

      let path = endpoint; // If mapping is set

      if (map !== null && typeof map !== 'undefined') {
        path = map.endpoint; // Add slash to path if missing

        if (path.length > 0 && path[0] !== '/') {
          path = '/' + path;
        }
      } // Resolve Identifiers. Ex.: {id} or {/parentId} etc...


      let identifiers = accessor.identifiers(path);
      Object.keys(identifiers).reduce((prev, key) => {
        let slash = identifiers[key].slash;
        let hook = identifiers[key].hook; // Resolve mapping

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

      let url = base + path;

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

        for (let i = 0, l = args.length; i < l; i++) {
          let arg = args[i];
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


    let startLoader = loadSlug => {
      accessor.loading = true;
      return accessor.loaders.push(loadSlug);
    };
    /**
     * Stop Loader
     */


    let stopLoader = loadSlug => {
      let index = accessor.loaders.indexOf(loadSlug);

      if (index !== -1) {
        accessor.loaders.splice(index, 1);
        accessor.loading = accessor.loaders.length > 0;
      }

      return accessor.loaders;
    };
    /**
     * Handle Cancelation of Running Requests
     */


    accessor.shared.handleCancellation = cancellation => {
      if (cancellation !== null) {
        cancellation();
      }

      return {
        promise: new Promise(resolve => {
          cancellation = resolve;
        }),
        cancellation: cancellation
      };
    };
    /**
     * Handle Mapping
     */


    accessor.shared.handleMapping = (response, key = null, batch, multiple, map = accessor.shared.map) => {
      let conf = clone({}, accessor.shared.config);
      return new Promise((resolve, reject) => {
        let resolved = false;
        let data = response.data; // Raw from server

        let headers = response.headers; // In lowercase

        try {
          let parsed = data;
          let isObjOrArray = parsed.constructor === Object || parsed.constructor === Array;

          if (!isObjOrArray) {
            parsed = JSON.parse(parsed);
          }

          if (typeof parsed !== 'undefined' && parsed !== null && isObjOrArray) {
            if (!batch && !multiple) {
              // Parse Data
              response = accessor.set(parsed, false, true, key);
            } else if (batch && map !== null && typeof map !== 'undefined') {
              if (parsed.constructor === Object) {
                let match = 0;
                let hasBatch = map.batch !== null && typeof map.batch !== 'undefined';

                if (hasBatch) {
                  Object.keys(map.batch).reduce((prev, key) => {
                    if (typeof parsed[map.batch[key]] !== 'undefined') {
                      match++;
                    }
                  }, {});
                } // If response has batch mapping keys, resolve by keys


                if (match > 0) {
                  let deleteKey = typeof map.batch.delete !== 'undefined' && map.batch.delete !== null ? map.batch.delete : 'delete'; // Exchange all without delete

                  Object.keys(parsed).reduce((prev, method) => {
                    // Exchange updated
                    if (method !== deleteKey) {
                      for (let i = 0, l = parsed[method].length; i < l; i++) {
                        let child = parsed[method][i];
                        let endpoint = new Endpoint(accessor, accessor.shared.controller, accessor.shared.defaultApi, Object.assign(child, accessor.shared.predefined), Object.assign(conf, {
                          multiple: false
                        }));
                        accessor.exchange(endpoint);
                      }
                    } else {
                      // Remove deleted
                      for (let i = 0, l = parsed[method].length; i < l; i++) {
                        let child = parsed[method][i];
                        let endpoint = new Endpoint(accessor, accessor.shared.controller, accessor.shared.defaultApi, Object.assign(child, accessor.shared.predefined), Object.assign(conf, {
                          multiple: false
                        }));
                        accessor.exchange(endpoint, true, false, true);
                      }
                    }
                  }, {});
                } else {
                  // If response has no keys mapped in batch, expect one instance
                  let endpoint = new Endpoint(accessor, accessor.shared.controller, accessor.shared.defaultApi, Object.assign(parsed, accessor.shared.predefined), Object.assign(conf, {
                    multiple: false
                  }));
                  accessor.exchange(endpoint);
                }
              } else {
                // If response is array expect multiple instances
                for (let i = 0, l = parsed.length; i < l; i++) {
                  let obj = parsed[i];
                  let endpoint = new Endpoint(accessor, accessor.shared.controller, accessor.shared.defaultApi, Object.assign(obj, accessor.shared.predefined), Object.assign(conf, {
                    multiple: false
                  }));
                  accessor.exchange(endpoint);
                }
              }
            } else if (multiple && map !== null && typeof map !== 'undefined') {
              if (response.config.method.toLowerCase() === 'get') {
                accessor.children = [];
              }

              for (let i = 0, l = parsed.length; i < l; i++) {
                let child = parsed[i];
                let endpoint = new Endpoint(accessor, accessor.shared.controller, accessor.shared.defaultApi, Object.assign(child, accessor.shared.predefined), Object.assign(conf, {
                  multiple: false
                }));

                if (response.config.method.toLowerCase() === 'get') {
                  accessor.children.push(endpoint);
                } else {
                  if (!accessor.exchange(endpoint)) {
                    accessor.children.push(endpoint);
                  }
                }
              }
            } // Parse Headers


            if (key === null) {
              Object.keys(headers).reduce((prev, key) => {
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


    accessor.shared.handleError = error => {
      if (axios.isCancel(error)) {// Manually cancelled
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


    accessor.shared.handleSuccess = (response, replace = true, key = null, batch = false, map = accessor.shared.map) => {
      let multiple = map !== null && typeof map !== 'undefined' && typeof map.multiple !== 'undefined' && map.multiple || accessor.shared.config.multiple;
      return new Promise((resolve, reject) => {
        if (replace) {
          accessor.shared.handleMapping(response, key, batch, multiple).then(results => {
            resolve(results);
          }).catch(error => {
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


    accessor.exchange = (endpoint, add = true, reliable = false, remove = false, map = accessor.shared.map) => {
      // @note - This could be more heavy and alot slower
      let smartFind = endpoint => {
        // Reliable.
        // Check for Creation Identifier match.
        let exchange = resolveCreationIdentifier(endpoint); // Reliable.
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


      let resolveCreationIdentifier = endpoint => {
        let match;

        for (let i = 0, l = accessor.children.length; i < l; i++) {
          let child = accessor.children[i];

          if (child.shared.map !== null && typeof child.shared.map !== 'undefined' && typeof child.shared.map.creationIdentifier !== 'undefined' && typeof child.shared.creationIdentifier !== 'undefined' && child.shared.creationIdentifier !== '') {
            let identifier = child.shared.map.creationIdentifier;
            let prop = identifier.split('=')[0];

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


      let findExactMatch = endpoint => {
        let exchange = accessor.children.find(child => {
          if (child.identifier === null || child.identifier.value === null) {
            let props = child.props();
            let endpointProps = endpoint.props();
            let match = true; // Expect match

            Object.keys(props).reduce((prev, key) => {
              if (typeof endpointProps[key] !== 'undefined') {
                if (JSON.stringify(props[key]) !== JSON.stringify(endpointProps[key])) {
                  // If unchanged props doesnt match, set match to false
                  match = false;
                }
              } else {
                match = false;
              }
            }, {});
            Object.keys(endpointProps).reduce((prev, key) => {
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


      let findExactExistingMatch = endpoint => {
        let exchange = accessor.children.find(child => {
          if (child.identifier === null || child.identifier.value === null) {
            let props = child.props();
            let endpointProps = endpoint.props();
            let match = true; // Expect match

            Object.keys(props).reduce((prev, key) => {
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


      let findExactUnchangedMatch = endpoint => {
        let exchange = accessor.children.find(child => {
          if (child.identifier === null || child.identifier.value === null) {
            let changes = child.changes();
            let props = child.props();
            let endpointProps = endpoint.props();
            let match = true; // Expect match

            Object.keys(props).reduce((prev, key) => {
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


      let findExactChangedMatch = endpoint => {
        let exchange = accessor.children.find(child => {
          if (child.identifier === null || child.identifier.value === null) {
            let changes = child.changes();
            let props = child.props();
            let endpointProps = endpoint.props();
            let match = true; // Expect match

            Object.keys(props).reduce((prev, key) => {
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


      let findUnchangedMatch = endpoint => {
        let exchange = accessor.children.find(child => {
          if (child.identifier === null || child.identifier.value === null) {
            let changes = child.changes();
            let props = child.props();
            let endpointProps = endpoint.props();
            let match = true; // Expect match

            Object.keys(props).reduce((prev, key) => {
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


      let findChangedMatch = endpoint => {
        let exchange = accessor.children.find(child => {
          if (child.identifier === null || child.identifier.value === null) {
            let changes = child.changes();
            let props = child.props();
            let endpointProps = endpoint.props();
            let match = true; // Expect match

            Object.keys(props).reduce((prev, key) => {
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


      let findExactIncomingMatch = endpoint => {
        let exchange = accessor.children.find(child => {
          if (child.identifier === null || child.identifier.value === null) {
            let props = child.props();
            let endpointProps = endpoint.props();
            let match = true; // Expect match

            Object.keys(endpointProps).reduce((prev, key) => {
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


      let findIncomingMatch = endpoint => {
        let exchange = accessor.children.find(child => {
          if (child.identifier === null || child.identifier.value === null) {
            let props = child.props();
            let endpointProps = endpoint.props();
            let match = true; // Expect match

            Object.keys(endpointProps).reduce((prev, key) => {
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

      let exchange;

      if (endpoint.identifier !== null) {
        exchange = accessor.children.find(child => {
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
        let index = accessor.children.indexOf(exchange);

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


    accessor.shared.makeRequest = (canceler, method, apiSlug = accessor.shared.defaultApi, args = null, data = null, upload = false, conf = {}, promise = new Promise(resolve => resolve()), batch = false) => {
      // Custom Request Config (config level 3 - greater is stronger)
      conf = Object.assign(clone({}, accessor.shared.config), conf);

      if (canceler !== false) {
        let cancelHandler = accessor.shared.handleCancellation(cancelers[canceler]);
        cancelers[canceler] = cancelHandler.cancellation;
        promise = cancelHandler.promise;
      }

      return new Promise((resolve, reject) => {
        // startLoader(method)
        let api = accessor.shared.controller !== null && apiSlug !== null ? accessor.shared.controller.apis[apiSlug] : accessor.shared.api;
        accessor.shared.requester[method.toLowerCase()](accessor.shared.resolveUrl(endpoint, accessor.shared.map, api, args, batch), promise, data, upload, conf).then(response => {
          accessor.raw = response; // stopLoader(method)

          resolve(response);
        }).catch(error => {
          // stopLoader(method)
          reject(accessor.shared.handleError(error));
        });
      });
    };

    accessor.shared.identifier = () => {
      let identifier = null;

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


    accessor.query = () => {
      return new Query(accessor);
    };
    /**
     * Request Fetch @note - Related to Properties
     */


    accessor.fetch = (apiSlug = accessor.shared.defaultApi, args = accessor.args.fetch, replace = true, perform = true) => {
      return new Promise((resolve, reject) => {
        let loadSlug = 'fetch';
        startLoader(loadSlug);
        accessor.shared.makeRequest(loadSlug, 'GET', apiSlug, args, null, false, {
          perform: perform
        }).then(response => {
          accessor.shared.handleSuccess(response, replace).then(results => {
            stopLoader(loadSlug);
            resolve(accessor);
          }).catch(error => {
            stopLoader(loadSlug);
            reject(error);
          });
        }).catch(error => {
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


    accessor.save = (apiSlug = accessor.shared.defaultApi, args = accessor.args.save, replace = true, create = true, perform = true, map = accessor.shared.map) => {
      if (map !== null && typeof map !== 'undefined' && typeof map.multiple !== 'undefined' && map.multiple || accessor.shared.config.multiple) {
        return accessor.batch({
          create: create
        }, apiSlug, args, replace, map);
      } else {
        return new Promise((resolve, reject) => {
          let loadSlug = 'save';
          startLoader(loadSlug);
          let identifier = accessor.shared.identifier();

          if (identifier !== null && identifier.value === null) {
            accessor.create(apiSlug, args, replace, true, perform).then(response => {
              stopLoader(loadSlug);
              resolve(accessor);
            }).catch(error => {
              stopLoader(loadSlug);
              reject(error);
            });
          } else {
            accessor.shared.makeRequest(loadSlug, 'PUT', apiSlug, args, accessor.removeIdentifiers(accessor.reverseMapping(accessor.changes(false, false, true))), false, {
              perform: perform
            }).then(response => {
              accessor.shared.handleSuccess(response, replace).then(response => {
                stopLoader(loadSlug);
                resolve(accessor);
              }).catch(error => {
                stopLoader(loadSlug);
                reject(error);
              });
            }).catch(error => {
              // If could not save, try create
              if (create) {
                accessor.create(apiSlug, args, replace, true, perform).then(response => {
                  stopLoader(loadSlug);
                  resolve(accessor);
                }).catch(error => {
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


    accessor.create = (apiSlug = accessor.shared.defaultApi, args = accessor.args.create, replace = true, save = true, perform = true, map = accessor.shared.map) => {
      if (map !== null && typeof map !== 'undefined' && typeof map.multiple !== 'undefined' && map.multiple || accessor.shared.config.multiple) {
        return accessor.batch({
          save: save
        }, apiSlug, args, replace, perform, map);
      } else {
        return new Promise((resolve, reject) => {
          let withEmpty = accessor.removeIdentifiers(accessor.reverseMapping());
          let data = {};

          if (!accessor.shared.config.post.keepNull) {
            Object.keys(withEmpty).reduce((prev, key) => {
              if (withEmpty[key] !== null) {
                data[key] = withEmpty[key];
              }
            }, {});
          } else {
            data = withEmpty;
          }

          let loadSlug = 'create';
          startLoader(loadSlug);
          accessor.shared.makeRequest(loadSlug, 'POST', apiSlug, args, data, false, {
            perform: perform
          }).then(response => {
            accessor.shared.handleSuccess(response, replace).then(results => {
              stopLoader(loadSlug);
              resolve(accessor);
            }).catch(error => {
              stopLoader(loadSlug);
              reject(error);
            });
          }).catch(error => {
            stopLoader(loadSlug);
            reject(error);
          });
        });
      }
    };
    /**
     * Request Remove @note - Related to Properties
     */


    accessor.remove = (apiSlug = accessor.shared.defaultApi, args = accessor.args.remove, replace = true, perform = true, map = accessor.shared.map) => {
      if (map !== null && typeof map !== 'undefined' && typeof map.multiple !== 'undefined' && map.multiple || accessor.shared.config.multiple) {
        return accessor.batch({
          save: false,
          create: false,
          delete: true
        }, apiSlug, args, replace, map);
      } else {
        return new Promise((resolve, reject) => {
          let loadSlug = 'remove';
          startLoader(loadSlug);
          accessor.shared.makeRequest(loadSlug, 'DELETE', apiSlug, args, null, false, {
            perform: perform
          }).then(response => {
            if (typeof response !== 'undefined') {
              accessor.shared.handleSuccess(response, replace).then(results => {
                stopLoader(loadSlug);
                resolve(accessor);
              }).catch(error => {
                stopLoader(loadSlug);
                reject(error);
              });
            } else {
              resolve(accessor);
            }
          }).catch(error => {
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


    accessor.upload = (file, apiSlug = accessor.shared.defaultApi, args = accessor.args.upload, replace = true, perform = true, method = 'POST', map = false) => {
      return new Promise((resolve, reject) => {
        let loadSlug = 'upload';
        startLoader(loadSlug);
        accessor.shared.makeRequest(loadSlug, method, apiSlug, args, file, true, {
          perform: perform
        }).then(response => {
          if (map) {
            accessor.shared.handleSuccess(response, replace).then(results => {
              stopLoader(loadSlug);
              resolve(accessor);
            }).catch(error => {
              stopLoader(loadSlug);
              reject(error);
            });
          } else {
            stopLoader(loadSlug);
            resolve(response);
          }
        }).catch(error => {
          stopLoader(loadSlug);
          reject(error);
        });
      });
    };
    /**
     * Request Batch @note - Updates all children
     */


    accessor.batch = (options = {}, apiSlug = accessor.shared.defaultApi, args = accessor.args.batch, replace = true, perform = true, map = accessor.shared.map) => {
      options = Object.assign({
        create: true,
        save: true,
        delete: false,
        merge: false,
        // Merge with parent props if any (usually there is none)
        limit: 100,
        // Split requests into limited amount of children
        from: 0 // Exclude children before index from request

      }, options);
      let data = {}; // Handle create

      if (options.create) {
        let hook = map !== null && typeof map !== 'undefined' && typeof map.batch !== 'undefined' && typeof map.batch.create !== 'undefined' ? map.batch.create : 'create';
        data[hook] = [];

        for (let i = 0, l = accessor.children.length; i < l; i++) {
          let child = accessor.children[i];

          if (i >= options.from && i < options.from + options.limit) {
            // Create Creation Identifier
            if (child.identifier === null || child.identifier.value === null) {
              if (child.shared.map !== null && typeof child.shared.map !== 'undefined' && typeof child.shared.map.creationIdentifier !== 'undefined' && child.shared.map.creationIdentifier !== '') {
                let identifier = child.shared.map.creationIdentifier;
                let prop = identifier.split('=')[0];
                let val = identifier.substring(prop.length + 1); // Resolve mapping

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
                    prop = child[prop] = new Prop(child, prop);
                  } else {
                    prop = child.invalids[prop] = new Prop(child, prop);
                  }
                } // Generate creation identifier


                let id = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 15);
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

              let withEmpty = child.removeIdentifiers(child.reverseMapping(child.props(false, true)));
              let results = {};

              if (!accessor.shared.config.post.keepNull) {
                Object.keys(withEmpty).reduce((prev, key) => {
                  if (withEmpty[key] !== null) {
                    results[key] = withEmpty[key];
                  }
                }, {});
              } else {
                results = withEmpty;
              }

              data[hook].push(results);
            }
          }
        }
      } // Handle save


      if (options.save) {
        let hook = map !== null && typeof map !== 'undefined' && typeof map.batch !== 'undefined' && typeof map.batch.save !== 'undefined' ? map.batch.save : 'save';
        data[hook] = [];

        for (let i = 0, l = accessor.children.length; i < l; i++) {
          let child = accessor.children[i];

          if (i >= options.from && i < options.from + options.limit) {
            if (child.identifier !== null && child.identifier.value !== null) {
              // If endpoint has identifier, secure that identifier is added for update and only post changes
              let obj = child.changes(false, false, true);
              obj[child.identifier.key] = child.identifier.value;
              data[hook].push(accessor.reverseMapping(obj));
            } else if (child.identifier === null) {
              // If endpoint has no identifier, add the whole child, and not only props
              data[hook].push(accessor.reverseMapping(child.props(false, true)));
            }
          }
        }
      } // Handle delete


      if (options.delete) {
        let hook = map !== null && typeof map !== 'undefined' && typeof map.batch !== 'undefined' && typeof map.batch.delete !== 'undefined' ? map.batch.delete : 'delete';
        data[hook] = [];

        for (let i = 0, l = accessor.children.length; i < l; i++) {
          let child = accessor.children[i];

          if (i >= options.from && i < options.from + options.limit) {
            if (child.identifier !== null && child.identifier.value !== null) {
              // If endpoint has identifier only add id to array
              data[hook].push(child.identifier.value);
            } else if (child.identifier === null) {
              // If endpoint has no identifier, add the whole child, and not only props
              data[hook].push(accessor.reverseMapping(child.props(false, true)));
            }
          }
        }
      } // Handle merge


      if (options.merge) {
        data = Object.assign(accessor.removeIdentifiers(accessor.reverseMapping(accessor.props(false, true))), data);
      }

      return new Promise((resolve, reject) => {
        let loadSlug = 'batch';
        startLoader(loadSlug);
        accessor.shared.makeRequest(loadSlug, 'POST', apiSlug, args, data, false, {
          perform: perform
        }, new Promise(resolve => resolve()), true).then(response => {
          accessor.shared.handleSuccess(response, replace, null, true).then(results => {
            if (options.from + options.limit < accessor.children.length) {
              options.from += options.limit;
              accessor.batch(options, apiSlug, args, replace, perform, map).then(results => {
                stopLoader(loadSlug);
                resolve(accessor);
              }).catch(error => {
                stopLoader(loadSlug);
                reject(error);
              });
            } else {
              stopLoader(loadSlug);
              resolve(accessor);
            }
          }).catch(error => {
            stopLoader(loadSlug);
            reject(error);
          });
        }).catch(error => {
          stopLoader(loadSlug);
          reject(error);
        });
      });
    };
    /**
     * Request Get @note - Unrelated to Properties
     */


    accessor.get = (apiSlug = accessor.shared.defaultApi, data = null, args = accessor.args.get, upload = false, promise = new Promise(resolve => resolve()), conf = {}) => {
      return accessor.shared.makeRequest(false, 'GET', apiSlug, args, data, upload, conf, promise);
    };
    /**
     * Request Post @note - Unrelated to Properties
     */


    accessor.post = (apiSlug = accessor.shared.defaultApi, data = null, args = accessor.args.post, upload = false, promise = new Promise(resolve => resolve()), conf = {}) => {
      return accessor.shared.makeRequest(false, 'POST', apiSlug, args, data, upload, conf, promise);
    };
    /**
     * Request Put @note - Unrelated to Properties
     */


    accessor.put = (apiSlug = accessor.shared.defaultApi, data = null, args = accessor.args.put, upload = false, promise = new Promise(resolve => resolve()), conf = {}) => {
      return accessor.shared.makeRequest(false, 'PUT', apiSlug, args, data, upload, conf, promise);
    };
    /**
     * Request Patch @note - Unrelated to Properties
     */


    accessor.patch = (apiSlug = accessor.shared.defaultApi, data = null, args = accessor.args.patch, upload = false, promise = new Promise(resolve => resolve()), conf = {}) => {
      return accessor.shared.makeRequest(false, 'PATCH', apiSlug, args, data, upload, conf, promise);
    };
    /**
     * Request Delete @note - Unrelated to Properties
     */


    accessor.delete = (apiSlug = accessor.shared.defaultApi, data = null, args = accessor.args.delete, upload = false, promise = new Promise(resolve => resolve()), conf = {}) => {
      return accessor.shared.makeRequest(false, 'DELETE', apiSlug, args, data, upload, conf, promise);
    };
    /**
     * Request Head @note - Unrelated to Properties
     */


    accessor.head = (apiSlug = accessor.shared.defaultApi, data = null, args = accessor.args.head, upload = false, promise = new Promise(resolve => resolve()), conf = {}) => {
      return accessor.shared.makeRequest(false, 'HEAD', apiSlug, args, data, upload, conf, promise);
    };
    /**
     * Request Trace @note - Unrelated to Properties
     */


    accessor.trace = (apiSlug = accessor.shared.defaultApi, data = null, args = accessor.args.trace, upload = false, promise = new Promise(resolve => resolve()), conf = {}) => {
      return accessor.shared.makeRequest(false, 'TRACE', apiSlug, args, data, upload, conf, promise);
    };
    /**
     * Request Connect @note - Unrelated to Properties
     */


    accessor.connect = (apiSlug = accessor.shared.defaultApi, data = null, args = accessor.args.connect, upload = false, promise = new Promise(resolve => resolve()), conf = {}) => {
      return accessor.shared.makeRequest(false, 'CONNECT', apiSlug, args, data, upload, conf, promise);
    };
    /**
     * Request Options @note - Unrelated to Properties
     */


    accessor.options = (apiSlug = accessor.shared.defaultApi, data = null, args = accessor.args.options, upload = false, promise = new Promise(resolve => resolve()), conf = {}) => {
      return accessor.shared.makeRequest(false, 'OPTIONS', apiSlug, args, data, upload, conf, promise);
    };
    /**
     * Set / Update Properties
     * Data = Either Endpoint Model or raw JSON if raw = true
     */


    accessor.set = (data, change = true, raw = false, updateKey = null, map = null) => {
      let nokey = updateKey === null;
      Object.keys(data).reduce((prev, key) => {
        let alive = nokey || key === updateKey;
        let reserved = accessor.reserved(key);
        let hook = accessor;

        if (!raw) {
          if (!reserved && typeof hook[key] === 'undefined' && alive) {
            hook[key] = new Prop(accessor, key, data[key].value, typeof data[key].config !== 'undefined' ? data[key].config : {}, data[key].transpiler);
          } else if (!reserved && alive && hook[key].value !== data[key].value) {
            hook[key].value = data[key].value;

            if (typeof data[key].config !== 'undefined') {
              hook[key].config = Object.assign(hook[key].config, data[key].config);
            }

            hook[key].changed(change ? typeof data[key].changed === 'function' ? data[key].changed() : false : false);
          } else if (key === 'invalids') {
            Object.keys(data[key]).reduce((prev, prop) => {
              let living = nokey || prop === updateKey;

              if (typeof hook[key][prop] === 'undefined' && living) {
                hook[key][prop] = new Prop(accessor, prop, data[key].value, typeof data[key].config !== 'undefined' ? data[key].config : {}, data[key].transpiler);
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

          let prop = map !== null && typeof map !== 'undefined' && typeof map.props !== 'undefined' && typeof map.props[key] !== 'undefined' ? map.props[key] : key;

          if (alive) {
            if (reserved) {
              hook = accessor.invalids;
            }

            if (typeof hook[prop] !== 'undefined' && hook[prop].value !== data[key]) {
              hook[prop].value = data[key];
              hook[prop].changed(change);
            } else if (typeof hook[prop] === 'undefined') {
              hook[prop] = new Prop(accessor, prop, data[key], typeof data[key].config !== 'undefined' ? data[key].config : {}, data[key].transpiler);
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


    accessor.clear = (keep = ['id'], change = false) => {
      // Stop Running Property Requests
      Object.keys(cancelers).reduce((prev, key) => {
        if (cancelers[key] !== null) {
          cancelers[key]();
        }
      }, {}); // Reset loaders

      accessor.loading = false;
      accessor.loaders = []; // Reset properties

      Object.keys(accessor).reduce((prev, key) => {
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


    accessor.props = (reference = false, apiReady = false) => {
      let obj = {};

      if (reference) {
        Object.keys(accessor).reduce((prev, key) => {
          if (!accessor.reserved(key)) {
            obj[key] = accessor[key];
          }
        }, {});
        Object.keys(accessor.invalids).reduce((prev, key) => {
          obj[key] = accessor[key];
        }, {});
      } else {
        Object.keys(accessor).reduce((prev, key) => {
          if (!accessor.reserved(key)) {
            obj[key] = apiReady ? accessor[key].apiValue() : accessor[key].value;
          }
        }, {});
        Object.keys(accessor.invalids).reduce((prev, key) => {
          obj[key] = apiReady ? accessor.invalids[key].apiValue() : accessor.invalids[key].value;
        }, {});
      }

      return obj;
    };
    /**
     * Get all changed props including invalids as object without reserved methods / variables
     * reference === true returns reference. Else only value is returned
     */


    accessor.changes = (reference = false, arr = false, apiReady = false) => {
      let obj = {};
      let array = [];

      if (reference) {
        Object.keys(accessor).reduce((prev, key) => {
          if (!accessor.reserved(key)) {
            if (accessor[key].changed()) {
              arr ? array.push(accessor[key]) : obj[key] = accessor[key];
            }
          }
        }, {});
        Object.keys(accessor.invalids).reduce((prev, key) => {
          if (accessor.invalids[key].changed()) {
            arr ? array.push(accessor.invalids[key]) : obj[key] = accessor.invalids[key];
          }
        }, {});
      } else {
        Object.keys(accessor).reduce((prev, key) => {
          if (!accessor.reserved(key)) {
            if (accessor[key].changed()) {
              let val = apiReady ? accessor[key].apiValue() : accessor[key].value;
              arr ? array.push(key, val) : obj[key] = val;
            }
          }
        }, {});
        Object.keys(accessor.invalids).reduce((prev, key) => {
          if (accessor.invalids[key].changed()) {
            let val = apiReady ? accessor.invalids[key].apiValue() : accessor.invalids[key].value;
            arr ? array.push([key, val]) : obj[key] = val;
          }
        }, {});
      }

      return arr ? array : obj;
    };
    /**
     * Check if property key is reserved
     */


    accessor.reserved = key => {
      return accessor.shared.reserved.indexOf(key) !== -1;
    };
    /**
     * Clone Endpoint
     */


    accessor.clone = (change = true) => {
      let cl = new Endpoint(accessor, accessor.shared.controller, accessor.shared.defaultApi, accessor.shared.predefined, accessor.shared.config);
      cl.args = clone({}, accessor.args);
      cl.raw = clone({}, accessor.raw);
      cl.set(accessor, change);

      for (let i = 0, l = accessor.children.length; i < l; i++) {
        let child = accessor.children[i];
        cl.children.push(child.clone(change));
      }

      return cl;
    };
    /**
     * ReverseMapping
     */


    accessor.reverseMapping = (props = null, reference = false, map = accessor.shared.map, apiReady = true) => {
      if (props === null) {
        props = accessor.props(reference, apiReady);
      }

      let reverse = {};

      try {
        // Clone props
        if (reference) {
          Object.keys(props).reduce((prev, key) => {
            if (apiReady) {
              reverse[key] = clone({}, props[key].apiValue());
            } else {
              reverse[key] = clone({}, props[key].value);
            }
          }, {});
        } else {
          reverse = clone({}, props);
        }

        if (map !== null && typeof map !== 'undefined' && typeof map.props !== 'undefined') {
          // Replace keys in props with mappings
          Object.keys(map.props).reduce((prev, key) => {
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


    accessor.removeIdentifiers = (props, endpoint = accessor.shared.endpoint, map = accessor.shared.map) => {
      let path = map !== null && typeof map !== 'undefined' ? map.endpoint : endpoint;
      let identifiers = accessor.identifiers(path);
      Object.keys(props).reduce((prev, key) => {
        if (typeof identifiers[key] !== 'undefined') {
          delete props[key];
        }
      }, {});
      return props;
    };
    /**
     * Identifiers - Resolve Identifiers. Ex.: {id} or {/parentId} etc. in path
     */


    accessor.identifiers = path => {
      let identifiers = {}; // Resolve Identifiers. Ex.: {id} or {/parentId} etc...

      if (path.indexOf('}') !== '-1') {
        let optionals = path.split('}');

        for (let i = 0, l = optionals.length; i < l; i++) {
          let opt = optionals[i];
          let index = opt.indexOf('{');

          if (index !== -1) {
            let hook = opt.substring(index) + '}';
            let prop = hook.replace('{', '').replace('}', '');
            let slash = false;

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


    accessor.sort = (key = 'menu_order') => {
      let compare = (a, b) => {
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
  }

}
import Endpoint from './endpoint';
/**
 * List
 */

export default class List extends Endpoint {
  constructor(Endpoint, controller = null, apiSlug = null, predefined = {}, config = {}) {
    /**
     * If no controller defined, create one from endpoint if it is not a string
     */
    let endpoint;

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


    super(endpoint, controller, apiSlug, Object.assign({
      batch: 'batch'
    }, predefined), Object.assign({
      multiple: true,
      batch: {
        save: 'update',
        create: 'create',
        delete: 'delete'
      }
    }, config));
  }

}
import { clone } from '../services/util';
/**
 * Prop
 */

export default class Prop {
  constructor(parent = null, key = null, value = null, config = {}, transpiler = null) {
    /**
     * Public Scope
     */
    let accessor = this;
    accessor.parent = parent;
    /**
     * Public Variables
     */

    try {
      accessor.value = clone({}, value);
      accessor.raw = clone({}, value);
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

    let startLoader = loadSlug => {
      accessor.loading = true;
      return accessor.loaders.push(loadSlug);
    };
    /**
     * Stop Loader
     */


    let stopLoader = loadSlug => {
      let index = accessor.loaders.indexOf(loadSlug);

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


    accessor.changed = (changed = null) => {
      let isChanged = false;

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
        isChanged = typeof accessor.value !== typeof value || accessor.value !== value;
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


    accessor.save = (apiSlug = parent.shared.defaultApi, args = null, replace = true, create = true, perform = true) => {
      let obj = {};
      obj[key] = accessor.apiValue();
      return new Promise((resolve, reject) => {
        if (parent !== null) {
          let loadSlug = 'save';
          startLoader(loadSlug);
          parent.shared.makeRequest(loadSlug, 'PUT', apiSlug, args, parent.shared.accessor.removeIdentifiers(parent.shared.accessor.reverseMapping(obj)), false, {
            perform: perform
          }).then(response => {
            accessor.raw = response;
            parent.shared.handleSuccess(response, replace, key).then(results => {
              stopLoader(loadSlug);
              resolve(accessor);
            }).catch(error => {
              stopLoader(loadSlug);
              reject(error);
            });
          }).catch(error => {
            accessor.raw = error; // If could not save, try create and update all properties

            if (create) {
              parent.shared.accessor.create(apiSlug, args, replace).then(() => {
                stopLoader(loadSlug);
                resolve(accessor);
              }).catch(error => {
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
      }).catch(error => {
        console.error(error);
      });
    };

    accessor.fetch = (apiSlug = parent.shared.defaultApi, args = null, replace = true, perform = true) => {
      return new Promise((resolve, reject) => {
        if (parent !== null) {
          let loadSlug = 'fetch';
          startLoader(loadSlug);
          parent.shared.makeRequest(loadSlug, 'GET', apiSlug, args, null, false, {
            perform: perform
          }).then(response => {
            accessor.raw = response;
            parent.shared.handleSuccess(response, replace, key).then(results => {
              stopLoader(loadSlug);
              resolve(accessor);
            }).catch(error => {
              stopLoader(loadSlug);
              reject(error);
            });
          }).catch(error => {
            accessor.raw = error;
            stopLoader(loadSlug);
            reject(error);
          });
        } else {
          reject('Missing Endpoint');
        }
      }).catch(error => {
        console.error(error);
      });
    };
    /**
     * Returns value ready to be posted to API with configurations applied
     */


    accessor.apiValue = () => {
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


    accessor.clone = () => {
      let cl = new Prop(parent, accessor.key, accessor.value, accessor.config, accessor.transpiler);

      try {
        cl.value = clone({}, accessor.value);
      } catch (error) {
        console.error(error);
      }

      return cl;
    };
  }

}
/**
 * Query
 */
export default class Query {
  constructor(endpoint) {
    let accessor = this;
    let queries = [];
    let argsMap = {};

    if (endpoint.shared.map !== null && typeof endpoint.shared.map.args !== 'undefined') {
      argsMap = endpoint.shared.map.args;
    }

    accessor.custom = (key, value) => {
      // Resolve mapping
      if (typeof argsMap[key] !== 'undefined') {
        key = argsMap[key];
      } // Ensures new arg (key, value) is added at end of query


      let newQ = [];
      queries.forEach(query => {
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

    accessor.exclude = value => {
      return accessor.custom('exclude', value);
    };

    accessor.include = value => {
      return accessor.custom('include', value);
    };

    accessor.parent = value => {
      return accessor.custom('parent', value);
    };

    accessor.parentExclude = value => {
      return accessor.custom('parent_exclude', value);
    };

    accessor.slug = value => {
      return accessor.custom('slug', value);
    };

    accessor.status = value => {
      return accessor.custom('status', value);
    };

    accessor.type = value => {
      return accessor.custom('type', value);
    };

    accessor.sku = value => {
      return accessor.custom('sku', value);
    };

    accessor.featured = value => {
      return accessor.custom('featured', value);
    };

    accessor.shippingClass = value => {
      return accessor.custom('shipping_class', value);
    };

    accessor.attribute = value => {
      return accessor.custom('attribute', value);
    };

    accessor.attributeTerm = value => {
      return accessor.custom('attribute_term', value);
    };

    accessor.taxClass = value => {
      return accessor.custom('tax_class', value);
    };

    accessor.inStock = (value = true) => {
      return accessor.custom('in_stock', value);
    };

    accessor.onSale = (value = true) => {
      return accessor.custom('on_sale', value);
    };

    accessor.product = value => {
      return accessor.custom('product', value);
    };

    accessor.minPrice = (value = 0) => {
      return accessor.custom('min_price', value);
    };

    accessor.maxPrice = (value = 10000) => {
      return accessor.custom('max_price', value);
    };

    accessor.after = value => {
      return accessor.custom('after', value);
    };

    accessor.before = value => {
      return accessor.custom('before', value);
    };

    accessor.hideEmpty = (value = true) => {
      return accessor.custom('hide_empty', value);
    };

    accessor.order = (value = 'desc') => {
      return accessor.custom('order', value);
    };

    accessor.orderby = (value = 'menu_order') => {
      return accessor.custom('orderby', value);
    };

    accessor.offset = (value = 100) => {
      return accessor.custom('offset', value);
    };

    accessor.search = (value = '') => {
      return accessor.custom('search', value);
    };

    accessor.page = (value = 1) => {
      return accessor.custom('page', value);
    };

    accessor.perPage = (value = 12) => {
      return accessor.custom('per_page', value);
    };

    accessor.category = (value = 0) => {
      return accessor.custom('category', value);
    };

    accessor.context = (value = 'view') => {
      return accessor.custom('context', value);
    };

    accessor.tag = (value = 0) => {
      return accessor.custom('tag', value);
    };

    accessor.fetch = (apiSlug = endpoint.shared.defaultApi, args = null, replace = true) => {
      // Merge args with queries as its just two different ways of using args
      if (args !== null) {
        args.forEach(arg => {
          return accessor.custom(arg.key, arg.value);
        });
      }

      return endpoint.fetch(apiSlug, queries, replace);
    };
  }

}
import Controller from './services/controller';
import Requester from './services/requester';
import Endpoint from './form/endpoint';
import List from './form/list';
import Prop from './form/prop';
import { clone } from './services/util';
/**
 * Papir
 */

class Papir {
  constructor(opt = {}) {
    // Default integration
    this.init = options => {
      Object.assign({
        conf: {},
        controller: new Controller(options.conf)
      }, options);
      this.controller = options.controller;
      this.Endpoint = Endpoint;
      this.List = List;
      this.Requester = Requester;
      this.Prop = Prop;
    }; // Vue integration


    this.install = (Vue, options) => {
      Object.assign({
        conf: {},
        controller: new Controller(options.conf)
      }, options);
      Vue.prototype.$pap = {
        controller: options.controller,
        Endpoint: Endpoint,
        List: List,
        Requester: Requester,
        Prop: Prop
      };
    };
  }

}

let papir = new Papir();
export { papir };
export { Controller };
export { Requester };
export { Endpoint };
export { Prop };
export { List };
export { clone };
import Requester from './requester';
/**
 * Controller
 */

export class Controller {
  constructor(options = {}) {
    options = {
      config: typeof options.config !== 'undefined' ? options.config : {},
      serverBase: typeof options.serverBase !== 'undefined' ? options.serverBase : null,
      apis: typeof options.apis !== 'undefined' ? options.apis : require('../apis.json')
    };
    this.default = null;
    this.apis = {};
    this.server = options.serverBase;

    this.config = (opt1, opt2, replace = false) => {
      if (typeof opt2 === 'undefined' && typeof opt1 !== 'undefined' && opt1.constructor === Object) {
        Object.keys(this.apis).forEach(key => {
          if (replace) {
            this.apis[key] = opt1;
          } else {
            this.apis[key] = Object.assign(this.apis[key], opt1);
          }

          if (typeof this.apis[key].config === 'undefined') {
            this.apis[key].config = {};
          }

          this.apis[key].requester = new Requester(this.storeAuth(this.apis[key], this.apis[key].config));
        });
      } else if (typeof opt1 === 'string' && typeof opt2 !== 'undefined' && opt2.constructor === Object) {
        if (typeof this.apis[opt1] !== 'undefined' && !replace) {
          this.apis[opt1] = Object.assign(this.apis[opt1], opt2);
        } else {
          this.apis[opt1] = opt2;
        }

        if (typeof this.apis[opt1].config === 'undefined') {
          this.apis[opt1].config = {};
        }

        this.apis[opt1].requester = new Requester(this.storeAuth(this.apis[opt1], this.apis[opt1].config));
      }
    };

    this.storeAuth = (api, config) => {
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


    options.apis.forEach(api => {
      if (api.default || this.default === null) {
        this.default = api.slug;
      }

      if (this.server !== null && (typeof api.base === 'undefined' || api.base === '')) {
        api.base = this.server;
      }

      if (typeof api.config === 'undefined') {
        api.config = {};
      }

      options.config = Object.assign(api.config, options.config);
      api.requester = new Requester(this.storeAuth(api, options.config));
      this.apis[api.slug] = api;
    });
  }

}
export default Controller;
class Encode {
  constructor() {
    /**
     * Encode
     * @param string: String - String to be decoded
     * @param protocol: String - options [ 'rfc3986', 'rfc1738' ] More could be added later
     * @param encodeNull: Boolean - if false, null is not specially handled
     * @returns encodedString: String - Defined by selected protocol
     */
    this.encode = (string, protocol = 'rfc3986', encodeNull = true) => {
      return this[protocol + 'Encode'](string, encodeNull);
    };
    /**
     * Decode
     * @param string: String - String to be decoded
     * @param protocol: String - options [ 'rfc3986', 'rfc1738' ] More could be added later
     * @param decodeNull: Boolean - if false, null is not specially handled
     * @returns decodedString: String - Defined by selected protocol
     */


    this.decode = (string, protocol = 'rfc3986', decodeNull = true) => {
      return this[protocol + 'Decode'](string, decodeNull);
    };
    /**
     * RFC 3986 Encode
     * @reserved -._~
     * @param string: String - String to be encoded
     * @param encodeNull: boolean - If false null is converted to 'null' else it will be '%00'
     * @returns encodedString: String - RFC 3986 Encoded string
     */


    this.rfc3986Encode = (string, encodeNull = true) => {
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


    this.rfc3986Decode = (string, decodeNull = true) => {
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


    this.rfc1738Encode = (string, encodeNull = true) => {
      string = this.rfc3986Encode(string, encodeNull);
      string = string.replace(/%20/g, '+');
      return string;
    };
    /**
     * RFC 1738 Decode
     * @param string: String - String to be decoded
     * @param decodeNull: boolean - If false %00 is converted to empty string else it will be null
     * @returns decodedString: String - RFC 1738 Decoded string
     */


    this.rfc1738Decode = (string, decodeNull = true) => {
      string = string.replace(/\+/g, '%20');
      string = this.rfc3986Decode(string, decodeNull);
      return string;
    };
  }

}

export default new Encode();
import util from './util';
import axios from 'axios';
import sign from './sign';
import { clone } from './util';
/**
 * Requester
 */

export default class Requester {
  constructor(customConf = {}) {
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
      delete: {},
      head: {},
      trace: {},
      connect: {},
      options: {},
      perform: true // If false, axios config will be returned instead

    };

    this.objMerge = (target, custom) => {
      let cl = Object.assign({}, target); // Ensures target not to inherit params from custom

      return Object.assign(cl, custom);
    };

    this.conf = this.objMerge(this.conf, customConf);
    this.getConf = this.objMerge(this.conf, this.conf.get);
    this.postConf = this.objMerge(this.conf, this.conf.post);
    this.putConf = this.objMerge(this.conf, this.conf.put);
    this.patchConf = this.objMerge(this.conf, this.conf.patch);
    this.deleteConf = this.objMerge(this.conf, this.conf.delete);
    this.headConf = this.objMerge(this.conf, this.conf.head);
    this.traceConf = this.objMerge(this.conf, this.conf.trace);
    this.connectConf = this.objMerge(this.conf, this.conf.connect);
    this.optionsConf = this.objMerge(this.conf, this.conf.options); // READ

    this.get = (url, promise, data = null, upload = false, conf = {}) => {
      conf = this.objMerge(this.getConf, conf);
      return this.custom('GET', url, promise, data, upload, conf);
    }; // CREATE


    this.post = (url, promise, data = null, upload = false, conf = {}) => {
      conf = this.objMerge(this.postConf, conf);
      return this.custom('POST', url, promise, data, upload, conf);
    }; // UPDATE / REPLACE


    this.put = (url, promise, data = null, upload = false, conf = {}) => {
      conf = this.objMerge(this.putConf, conf);
      return this.custom('PUT', url, promise, data, upload, conf);
    }; // UPDATE / MODIFY


    this.patch = (url, promise, data = null, upload = false, conf = {}) => {
      conf = this.objMerge(this.patchConf, conf);
      return this.custom('PATCH', url, promise, data, upload, conf);
    }; // DELETE


    this.delete = (url, promise, data = null, upload = false, conf = {}) => {
      conf = this.objMerge(this.deleteConf, conf);
      return this.custom('DELETE', url, promise, data, upload, conf);
    }; // GET HEADERS ONLY / NO CONTENT


    this.head = (url, promise, data = null, upload = false, conf = {}) => {
      conf = this.objMerge(this.headConf, conf);
      return this.custom('HEAD', url, promise, data, upload, conf);
    }; // GET ADDITIONS / CHANGES


    this.trace = (url, promise, data = null, upload = false, conf = {}) => {
      conf = this.objMerge(this.traceConf, conf);
      return this.custom('TRACE', url, promise, data, upload, conf);
    }; // CONVERT TO TCP / IP TUNNEL


    this.connect = (url, promise, data = null, upload = false, conf = {}) => {
      conf = this.objMerge(this.connectConf, conf);
      return this.custom('CONNECT', url, promise, data, upload, conf);
    }; // PERMISSION


    this.options = (url, promise, data = null, upload = false, conf = {}) => {
      conf = this.objMerge(this.optionsConf, conf);
      return this.custom('OPTIONS', url, promise, data, upload, conf);
    };

    this.custom = (method, url, promise, data = null, upload = false, conf = this.conf) => {
      conf = this.objMerge(this.conf, conf);
      return this.request(method, url, promise, data, upload, conf);
    };

    this.request = (method, url, abortPromise, data = null, upload = false, conf = this.conf) => {
      /**
       * Correct order of creating a request:
       */
      let request = {}; // 1. Append protocol (http / https)
      // 2. Append base (://baseurl.com)
      // 3. Append path (/api/v1/users/362)
      // 4.1 Append arguments (?arg1=0&arg2=1)

      request.url = url; // 4.2 Encode arguments after first divider until second divider.
      // Ex.: ignored?encoded?ignored?ignored

      request.url = util.querystring.encode(request.url, {
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
        request.url = this.makeDataQuery(request.url, data, {
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
        request.url = util.querystring.indexArrays(request.url);
      } // 6 Sort arguments if required


      let querystring = '';
      let sortable = [];
      util.getParams(request.url).forEach(param => {
        sortable.push(param.key + conf.splitter + param.value + conf.delimiter);
      });
      sortable.sort();
      sortable.forEach(param => {
        querystring += param;
      });

      if (querystring !== '') {
        querystring = querystring.slice(0, -1);
        request.url = util.stripUri(request.url) + conf.divider + querystring;
      } else {
        request.url = util.stripUri(request.url);
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
          request.url = util.stripUri(request.url) + conf.divider + sign.gen(conf).string;
        } // 3. If authentication should be applied to header


        if (conf.authHeader) {
          request.headers['Authorization'] = sign.gen(conf).header;
        }
      } else if (conf.authentication === 'nonce') {
        // ADD TOKEN / NONCE AT END OF QUERYSTRING
        request = this.makeTale(request, conf);
      } // 12. Make request abortable


      request = this.makeAbortable(request, abortPromise); // 13. Transform response
      // Set response type ['arraybuffer', 'blob', 'document', 'json', 'text', 'stream']

      request.responseType = conf.responseType; // Transform Response to raw

      request.transformResponse = response => {
        return response;
      }; // 14. If request should be applied, perform and return


      if (conf.perform) {
        return axios.request(request);
      } // 15. If only the axios config object is needed, return resolved promise


      return new Promise(resolve => {
        resolve(request);
      });
    };

    this.makeDataQuery = (url, data, options, conf = this.conf) => {
      if (data !== null) {
        let queryString = util.querystring.stringify(data, options);

        if (url.indexOf(conf.divider) === -1 && queryString !== '') {
          url += conf.divider + queryString;
        } else if (queryString !== '') {
          url += conf.delimiter + queryString;
        }
      }

      return url;
    };

    this.makeTale = (request, conf = this.conf) => {
      // Set nonce based on localized object / var
      if (conf.nonceTale !== '') {
        let query = conf.nonceTale.split(conf.splitter);

        if (query.length === 2) {
          let param = query[0];
          let hook = query[1];

          if (param.length > 0) {
            try {
              // @warning - eval can be harmful if used server side

              /* eslint-disable */
              let nonce = String(eval(hook));
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

    this.makeAbortable = (request, promise) => {
      let cancel;
      request.cancelToken = axios.CancelToken(function executor(c) {
        cancel = c;
      });
      promise.then(() => {
        cancel();
      });
      return request;
    };

    this.verifyToken = (url, token = '', conf = this.conf) => {
      window.open(url + conf.divider + (token !== '' ? util.querystring.stringify({
        oauth_token: token
      }) : ''), '_blank');
    };

    this.getTokenRequest = url => {
      let scope = this;
      let conf = clone({}, this.getConf);
      conf.addDataToQuery = false;
      conf.authHeader = true;
      return new Promise((resolve, reject) => {
        scope.get(url, null, false, false, conf).then(res => {
          resolve(res);
        }).catch(e => {
          reject(e);
        });
      });
    };

    this.getTokenAccess = (url, requestToken, requestTokenSecret, verifierToken) => {
      url = url + '?oauth_verifier=' + verifierToken;
      let scope = this;
      let conf = clone({}, this.getConf);
      conf.addDataToQuery = false;
      conf.authHeader = true;
      conf.key = requestToken;
      conf.secret = requestTokenSecret;
      return new Promise((resolve, reject) => {
        scope.get(url, null, false, false, conf).then(res => {
          resolve(res);
        }).catch(e => {
          reject(e);
        });
      });
    };
  }

}
import crypto from 'crypto';
import util from './util';
import encode from './encode';

class Sign {
  constructor() {
    let scope = this;

    this.gen = opt => {
      let conf = {
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
      Object.keys(conf).forEach(key => {
        if (typeof opt[key] !== 'undefined') {
          conf[key] = opt[key];
        }
      });
      let baseString = conf.method + '&' + encode.encode(util.stripUri(conf.url)) + '&';
      let hash = '';
      let mergedParams = [];
      util.getParams(conf.url).forEach(param => {
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
          value: util.timestamp(conf.timestampLength)
        }, {
          key: 'oauth_nonce',
          value: conf.nonce === '' && conf.nonceLength > 0 ? util.nonce(conf.nonceLength) : conf.nonce
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

        let paramString = scope.paramString(mergedParams, conf.keepEmpty, conf.sort);
        mergedParams = paramString.decoded;
        baseString += encode.encode(paramString.string);
        let signKey = scope.signKey(conf.secret, conf.token.secret, conf.ampersand);

        if (conf.base64 && conf.algorithm === 'HMAC-SHA1') {
          // baseString = baseString.replace(/%00/g, '%2500').replace(/%0A/g, '%250A').replace(/%0D/g, '%250D')
          // @note At this point %00 = %252500, %0A = %25250A, %0D = %25250D
          hash = crypto.createHmac('sha1', signKey).update(baseString).digest('base64');
        }
      } // Convert params to html-form type (change 'key' to 'name')


      let params = [];
      mergedParams.forEach(param => {
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

      let header = 'OAuth ';
      params.forEach(param => {
        let key = param.name;
        let value = param.value;

        if (conf.encodeNames) {
          key = encode.encode(key, conf.protocol, conf.encodeNull);
        }

        if (conf.encodeValues) {
          value = encode.encode(value, conf.protocol, conf.encodeNull);
        }

        if (value !== '') {
          header += key + '="' + value + '",';
        } else {
          header += key + '",';
        }
      });
      let queryString = '';
      let i = 0;
      params.forEach(param => {
        let key = param.name;
        let value = param.value;

        if (conf.encodeNames) {
          key = encode.encode(key, conf.protocol, conf.encodeNull);
        }

        if (conf.encodeValues) {
          value = encode.encode(value, conf.protocol, conf.encodeNull);
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

    this.signKey = (secret, tokenSecret, ampersand = true) => {
      if (ampersand || tokenSecret !== '') {
        return encode.encode(secret) + '&' + encode.encode(tokenSecret);
      } else {
        return encode.encode(secret);
      }
    };

    this.paramString = (params, keepEmpty = true, sort = true) => {
      let paramString = '';
      let enc = [];
      params.forEach(param => {
        if (param.value !== '') {
          enc.push(param.key + '=' + param.value + '&');
        } else if (param.value === '' && param.key !== 'oauth_token' && keepEmpty) {
          enc.push(param.key + '=&');
        }
      });

      if (sort) {
        enc.sort();
      } // Decode encoded to get equal sorting as encoded


      let dec = [];
      enc.forEach(param => {
        let p = param.split('=');

        if (p.length === 2) {
          dec.push({
            key: encode.decode(p[0]),
            value: encode.decode(p[1]).slice(0, -1)
          });
        } else {
          dec.push({
            key: encode.decode(p[0]),
            value: ''
          });
        }
      });
      enc.forEach(param => {
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
  }

}

export default new Sign();
import encode from './encode';
import moment from 'moment';

class Util {
  constructor() {
    this.timestamp = (length = 30) => {
      let now = '';

      while (now.length < length) {
        now += '0';
      }

      now = (String(new Date().getTime()) + now).substring(0, length);
      return Number(now);
    };

    this.nonce = (length = 6) => {
      let nonce = '';
      let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

      for (let i = 0; i < length; i++) {
        nonce += possible.charAt(Math.floor(Math.random() * possible.length));
      }

      return nonce;
    };

    this.stripUri = url => {
      let a = document.createElement('a');
      a.setAttribute('href', url);
      return a.protocol + '//' + a.host + a.pathname;
    };

    this.getParams = (url, delimiter = '&', splitter = '=', divider = '?') => {
      let params = [];
      let split = url.split(divider);

      if (typeof split[1] !== 'undefined') {
        let queries = split[1].split(delimiter);
        queries.forEach(q => {
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
      stringify: (value = null, options, first = true) => {
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
        let querystring = '';
        let name = options.name;
        let error = false;

        if (first && name !== null && typeof name === 'string' && options.excludes.indexOf(name) !== -1 && options.includes.indexOf(name) === -1) {
          options.name = null;
        }

        if (first && options.encodeNames && name !== null) {
          name = encode.encode(name, options.protocol, options.encodeNull);
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
            value = moment(value).format(options.dateFormat);
          } else if (value.constructor === Array && name !== null) {
            let i = 0; // Handle empty arrays @todo - Make customable values. Ex. null, '', '[]', 0 or delete it etc.

            if (value.length !== 0) {
              value.forEach(val => {
                let arrayIdentifier = options.arrayIndexOpen + (options.indexArrays ? i : '') + options.arrayIndexClose;
                querystring += this.querystring.stringify(val, Object.assign(options, {
                  name: name + (options.encodeNames ? encode.encode(arrayIdentifier, options.protocol, options.encodeNull) : arrayIdentifier)
                }), false);
                i++;
              });
            } // Array

          } else if (value.constructor === Object) {
            Object.keys(value).forEach(key => {
              if (options.excludes.indexOf(key) === -1 || options.includes.indexOf(key) !== -1 || !first) {
                if (name === null) {
                  querystring += this.querystring.stringify(value[key], Object.assign(options, {
                    name: options.encodeNames ? encode.encode(key, options.protocol, options.encodeNull) : key
                  }), false);
                } else {
                  let keyConverted = options.dotNotation ? '.' + key : options.arrayIndexOpen + key + options.arrayIndexClose;
                  keyConverted = options.encodeNames ? encode.encode(keyConverted, options.protocol, options.encodeNull) : keyConverted;
                  querystring += this.querystring.stringify(value[key], Object.assign(options, {
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
                value = encode.encode(value, options.protocol, options.encodeNull);
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
                value = encode.encode(value, options.protocol, options.encodeNull);
              }

              let arrayIdentifier = options.arrayIndexOpen + (options.indexArrays ? 0 : '') + options.arrayIndexClose;
              let key = '';

              if (options.keepArrayTags) {
                key = options.encodeNames ? encode.encode(arrayIdentifier, options.protocol, options.encodeNull) : arrayIdentifier;
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
      indexArrays: (querystring, delimiter = '&', splitter = '=', divider = '?', indexEncodedArrays = true) => {
        let preserved = '';
        let qIndex = querystring.indexOf(divider);

        if (qIndex !== -1) {
          preserved = querystring.substr(0, qIndex + 1);
          querystring = querystring.substr(qIndex + 1);
        }

        let params = querystring.split(delimiter);

        let doIndexing = (params, arrStart = '[', arrEnd = ']') => {
          let arrUnindexed = arrStart + arrEnd;
          let indices = [];
          let prevKey = '';
          let parsed = [];
          params.forEach(param => {
            let key = param.split(splitter)[0];
            let value = param.split(splitter)[1]; // Secure that we have indices for all arrays in param

            while (indices.length < key.split(arrUnindexed).length - 1) {
              indices.push(0); // Start indexing from 0
            } // Secure that indices is not more than amount of arrays


            while (indices.length !== key.split(arrUnindexed).length - 1) {
              indices.pop(); // Remove indices not used
            } // Iterate through arrays in param


            let count = 0; // Hold track for which array we are in

            indices.forEach(i => {
              let index = key.indexOf(arrUnindexed); // index position start of array in param

              let arraySpace = (arrStart + i + arrEnd).length; // space used by array

              let endIndex = index + arraySpace; // index position end of array in param

              if (key.replace(arrUnindexed, arrStart + i + arrEnd).substring(0, endIndex) === prevKey.substring(0, endIndex) && key.replace(arrUnindexed, arrStart + i + arrEnd).indexOf(arrUnindexed) !== -1) {
                // param is equal to prev at this index and has more unindexed arrays
                key = key.replace(arrUnindexed, arrStart + i + arrEnd);
              } else if (key.replace(arrUnindexed, arrStart + i + arrEnd).substring(0, endIndex) === prevKey.substring(0, endIndex) && key.replace(arrUnindexed, arrStart + i + arrEnd).indexOf(arrUnindexed) === -1) {
                if (key.length > index + arrUnindexed.length) {
                  // param has more indexed arrays after this index
                  let increment = false;
                  parsed.forEach(parse => {
                    let parseKey = parse.split(splitter)[0];

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

                parsed.forEach(parse => {
                  if (parse.substring(0, endIndex) === key.substring(0, endIndex)) {
                    let subparse = parse.substring(0, parse.lastIndexOf(arrStart + i + arrEnd));
                    let start = subparse.lastIndexOf(arrStart);
                    let end = subparse.lastIndexOf(arrEnd);
                    let preIndex = Number(key.substring(start + 1, end)); // Find last array before current index of param where array is indexed by number

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
        let parsed = doIndexing(params);

        if (indexEncodedArrays) {
          parsed = doIndexing(params, '%5B', '%5D');
        }

        parsed.forEach(param => {
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
      encode: (string, options) => {
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
        let split = [string.substring(0, string.indexOf(options.divider)), string.substring(string.indexOf(options.divider) + 1)];
        let encoded = '';

        if (string.indexOf(options.divider) !== -1) {
          let params = split[1].split(options.delimiter);
          params.forEach(param => {
            let query = param.split(options.splitter);
            let key = '';
            let value = '';

            if (query.length > 1) {
              let i = 0;
              query.forEach(q => {
                if (i === 0) {
                  key = options.encodeNames ? encode.encode(q, options.protocol, options.encodeNull) : q;
                } else if (i === 1) {
                  value = options.encodeValues ? encode.encode(q, options.protocol, options.encodeNull) : q;
                } else {
                  value += (options.encodeValues ? encode.encode(options.splitter, options.protocol, options.encodeNull) : options.splitter) + (options.encodeValues ? encode.encode(q, options.protocol, options.encodeNull) : q);
                }

                i++;
              });
            } else if (query.length === 1) {
              key = options.encodeNames ? encode.encode(query[0], options.protocol, options.encodeNull) : query[0];
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
        let i = 0;
        split.forEach(part => {
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
  }

}

export default new Util();

let clone = (target, obj) => {
  if (typeof obj === 'object' && obj !== null) {
    for (let i in obj) {
      target[i] = typeof obj[i] === 'object' && obj[i] !== null ? clone(obj[i].constructor(), obj[i]) : obj[i];
    }
  } else {
    return obj;
  }

  return target;
};

export { clone };
