import Prop from './prop'
import Query from './query'
import axios from 'axios'
import {clone} from '../services/util'

/**
 * Endpoint
 */
export default class Endpoint {
  constructor(endpoint, controller, apiSlug = null, predefined = {}, config = {}) {
    /**
     * Public Scope
     */
    let accessor = this

    /**
     * Public / Reserved Variables
     */

    /**
     * Get last fetched raw value
     */
    accessor.raw = null

    /**
     * If endpoint is list related, children is saved here
     */
    accessor.children = []

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
    }

    /**
     * Shared Variables
     */
    accessor.shared = {
      storage: null, // Storage is free to be used for anything on app level
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
      reserved: [
        'loading',
        'loaders',
        // Property Requesters
        'fetch',
        'custom',
        'save',
        'create',
        'batch',
        'clear',
        'upload',
        'remove',
        // Custom Requesters
        'get',
        'post',
        'put',
        'patch',
        'delete',
        'head',
        'trace',
        'connect',
        'options',
        // Property Methods
        'args',
        'query',
        'set',
        'clone',
        'changes',
        'props',
        'shared',
        'identifier',
        'identifiers',
        'removeIdentifiers',
        'reverseMapping',
        // Accessor Variables
        'children',
        'raw',
        'headers',
        'invalids',
        'exchange',
        'sort',
        'reserved'
      ]
    }

    /**
     * Private Variables
     */
    let cancelers = {
      fetch: null,
      save: null,
      create: null,
      remove: null,
      upload: null,
      batch: null
    }

    /**
     * Public / Reserved Variable Names
     * @warning Can not be used as a property name in models
     */
    accessor.loading = false
    accessor.loaders = []
    accessor.invalids = {} // Reserved properties from Server is stored here
    accessor.headers = {
      mapped: {},
      unmapped: {}
    } // @note - Related to Properties

    /**
     * Private Methods
     * ---------------
     * Initialization
     */
    let init = (accessor = this) => {
      /**
       * If an Endpoint object was passed instead of string, copy values to this endpoint before resolving constructors
       */
      if (typeof accessor.shared.endpoint !== 'string' && typeof accessor.shared.endpoint !== 'undefined') {
        accessor.shared.controller = accessor.shared.endpoint.shared.controller // Replace controller
        accessor.shared.requester = accessor.shared.endpoint.shared.requester // Replace requester
        // Replace defaultApi only if no apiSlug was given
        if (accessor.shared.defaultApi === null) {
          accessor.shared.defaultApi = accessor.shared.endpoint.shared.defaultApi
        }
        accessor.args = clone({}, accessor.shared.endpoint.args)
        accessor.set(accessor.shared.endpoint, false) // Replace props
        accessor.shared.config = accessor.shared.endpoint.shared.config // Replace config
        accessor.shared.endpoint = accessor.shared.endpoint.shared.endpoint // Replace endpoint string
      }
      /**
       * Map Resolver
       */
      let resolveMap = () => {
        let map = null
        try {
          map = accessor.shared.api.mappings[accessor.shared.endpoint]
          if (typeof map !== 'undefined' && typeof map.config !== 'undefined' && map.config.constructor === Object) {
            // Mapped Config (config level 1 - greater is stronger)
            accessor.shared.config = Object.assign(clone({}, accessor.shared.config), map.config)
          }
        } catch (e) {
          console.error(e)
        }
        return map
      }
      /**
       * Resolve Requester
       */
      if (typeof accessor.shared.controller.apis !== 'undefined') {
        accessor.shared.defaultApi = accessor.shared.defaultApi === null ? accessor.shared.controller.default : accessor.shared.defaultApi
        accessor.shared.api = accessor.shared.controller.apis[accessor.shared.defaultApi]
        accessor.shared.requester = accessor.shared.api.requester
        accessor.shared.map = resolveMap()
        // Custom Config (config level 2 - greater is stronger)
        accessor.shared.config = Object.assign(clone({}, accessor.shared.config), config)
        accessor.shared.buildProps(accessor.shared.map, accessor.shared.predefined)
      } else {
        console.error('No apis is hooked to Controller', accessor.shared.controller)
        accessor.shared.controller = null
      }
    }

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
              accessor[map.props[key]] = new Prop(accessor, map.props[key], null)
            } else if (key === 'invalids' && typeof accessor.invalids[key] === 'undefined') {
              accessor.invalids[map.props[key]] = new Prop(accessor, map.props[key], null)
            }
          }, {})
        } catch (error) {
          console.error('Error in property mapping for api ' + accessor.shared.defaultApi)
          console.error(map.props)
        }
      }
      try {
        Object.keys(predefined).reduce((prev, key) => {
          if (!accessor.reserved(key) && typeof accessor[key] === 'undefined') {
            accessor[key] = new Prop(accessor, key, predefined[key])
          } else if (!accessor.reserved(key) && typeof accessor[key] !== 'undefined') {
            accessor[key].value = predefined[key]
            accessor[key].changed(false)
          } else if (accessor.reserved(key) && typeof accessor.invalids[key] === 'undefined') {
            accessor.invalids[key] = new Prop(accessor, key, predefined[key])
          } else {
            accessor.invalids[key].value = predefined[key]
            accessor.invalids[key].changed(false)
          }
        }, {})
      } catch (error) {
        console.error('Error in predefined properties')
        console.error(predefined)
      }
      if (map !== null && typeof map !== 'undefined' && typeof map.identifier !== 'undefined' && map.identifier !== null && map.identifier !== '') {
        let mappedIdentifier = map.identifier
        if (typeof map.props !== 'undefined' && typeof map.props[map.identifier] !== 'undefined') {
          mappedIdentifier = map.props[map.identifier]
        }
        if (!accessor.reserved(mappedIdentifier) && typeof accessor[mappedIdentifier] !== 'undefined') {
          accessor.identifier = accessor[mappedIdentifier]
        } else if (accessor.reserved(mappedIdentifier) && typeof accessor.invalids[mappedIdentifier] !== 'undefined') {
          accessor.identifier = accessor.invalids[mappedIdentifier]
        } else if (!accessor.reserved(mappedIdentifier)) {
          accessor.identifier = accessor[mappedIdentifier] = new Prop(accessor, mappedIdentifier)
        } else {
          accessor.identifier = accessor.invalids[mappedIdentifier] = new Prop(accessor, mappedIdentifier)
        }
      } else {
        accessor.identifier = null
      }
    }

    /**
     * Url Resolver
     */
    accessor.shared.resolveUrl = (endpoint = accessor.shared.endpoint, map = accessor.shared.map, api = accessor.shared.api, args = null, batch = false) => {
      let base = (api !== null && typeof api.base !== 'undefined') ? api.base : ''
      // Remove last slash if any from base
      if (base.length > 0 && base[(base.length - 1)] === '/') {
        base = base.slice(0, -1)
      }
      let path = endpoint
      // If mapping is set
      if (map !== null && typeof map !== 'undefined') {
        path = map.endpoint
        // Add slash to path if missing
        if (path.length > 0 && path[0] !== '/') {
          path = '/' + path
        }
      }
      // Resolve Identifiers. Ex.: {id} or {/parentId} etc...
      let identifiers = accessor.identifiers(path)
      Object.keys(identifiers).reduce((prev, key) => {
        let slash = identifiers[key].slash
        let hook = identifiers[key].hook
        // Resolve mapping
        if (map !== null && typeof map !== 'undefined' && typeof map.props !== 'undefined') {
          key = typeof map.props[key] !== 'undefined' ? map.props[key] : key
        }
        // Replace hook with value from mapped prop
        if (!accessor.reserved(key) && typeof accessor[key] !== 'undefined' && accessor[key].value !== null && (batch || key !== accessor.shared.config.batchIdentifier)) {
          path = path.replace(hook, (slash ? '/' : '') + accessor[key].value)
        } else if (accessor.reserved(key) && typeof accessor.invalids[key] !== 'undefined' && accessor[key].value !== null && (batch || key !== accessor.shared.config.batchIdentifier)) {
          path = path.replace(hook, (slash ? '/' : '') + accessor.invalids[key].value)
        } else {
          path = path.replace(hook, '')
        }
      }, {})
      while (path.indexOf('//') !== -1) {
        path = path.replace('//', '/')
      }
      let url = base + path
      if (map !== null && typeof map !== 'undefined' && typeof map.params !== 'undefined' && map.params.constructor === Array) {
        if (args !== null) {
          args = args.concat(map.params)
        } else {
          args = map.params
        }
      }
      // Add Query Arguments
      if (args !== null) {
        if (url.indexOf('?') === -1) {
          url += '?'
        } else if (url[(url.length - 1)] !== '?' && url[(url.length - 1)] !== '&') {
          url += '&'
        }
        for (let i = 0, l = args.length; i < l; i++ ) {
          let arg = args[i]
          url += arg.key + '=' + arg.value + '&'
        }
        if (url[(url.length - 1)] === '&' || url[(url.length - 1)] === '?') {
          url = url.slice(0, -1)
        }
      }
      return url
    }

    /**
     * Start Loader
     */
    let startLoader = (loadSlug) => {
      accessor.loading = true
      return accessor.loaders.push(loadSlug)
    }

    /**
     * Stop Loader
     */
    let stopLoader = (loadSlug) => {
      let index = accessor.loaders.indexOf(loadSlug)
      if (index !== -1) {
        accessor.loaders.splice(index, 1)
        accessor.loading = accessor.loaders.length > 0
      }
      return accessor.loaders
    }

    /**
     * Handle Cancelation of Running Requests
     */
    accessor.shared.handleCancellation = (cancellation) => {
      if (cancellation !== null) {
        cancellation()
      }
      return {
        promise: new Promise(resolve => {
          cancellation = resolve
        }),
        cancellation: cancellation
      }
    }

    /**
     * Handle Mapping
     */
    accessor.shared.handleMapping = (response, key = null, batch, multiple, map = accessor.shared.map) => {
      let conf = clone({}, accessor.shared.config)
      return new Promise((resolve, reject) => {
        let resolved = false
        let data = response.data // Raw from server
        let headers = response.headers // In lowercase
        try {
          let parsed = data
          let isObjOrArray = parsed.constructor === Object || parsed.constructor === Array
          if (!isObjOrArray) {
            parsed = JSON.parse(parsed)
          }
          if (typeof parsed !== 'undefined' && parsed !== null && isObjOrArray) {
            if (!batch && !multiple) {
              // Parse Data
              response = accessor.set(parsed, false, true, key)
            } else if (batch && map !== null && typeof map !== 'undefined') {
              if (parsed.constructor === Object) {
                let match = 0
                let hasBatch = map.batch !== null && typeof map.batch !== 'undefined'
                if (hasBatch) {
                  Object.keys(map.batch).reduce((prev, key) => {
                    if (typeof parsed[map.batch[key]] !== 'undefined') {
                      match++
                    }
                  }, {})
                }
                // If response has batch mapping keys, resolve by keys
                if (match > 0) {
                  let deleteKey = (typeof map.batch.delete !== 'undefined' && map.batch.delete !== null) ? map.batch.delete : 'delete'
                  // Exchange all without delete
                  Object.keys(parsed).reduce((prev, method) => {
                    // Exchange updated
                    if (method !== deleteKey) {
                      for (let i = 0, l = parsed[method].length; i < l; i++ ) {
                        let child = parsed[method][i]
                        let endpoint = new Endpoint(
                          accessor,
                          accessor.shared.controller,
                          accessor.shared.defaultApi,
                          Object.assign(child, accessor.shared.predefined),
                          Object.assign(conf, {multiple: false})
                        )
                        accessor.exchange(endpoint)
                      }
                    } else {
                      // Remove deleted
                      for (let i = 0, l = parsed[method].length; i < l; i++ ) {
                        let child = parsed[method][i]
                        let endpoint = new Endpoint(
                          accessor,
                          accessor.shared.controller,
                          accessor.shared.defaultApi,
                          Object.assign(child, accessor.shared.predefined),
                          Object.assign(conf, {multiple: false})
                        )
                        accessor.exchange(endpoint, true, false, true)
                      }
                    }
                  }, {})
                } else {
                  // If response has no keys mapped in batch, expect one instance
                  let endpoint = new Endpoint(
                    accessor,
                    accessor.shared.controller,
                    accessor.shared.defaultApi,
                    Object.assign(parsed, accessor.shared.predefined),
                    Object.assign(conf, {multiple: false})
                  )
                  accessor.exchange(endpoint)
                }
              } else {
                // If response is array expect multiple instances
                for (let i = 0, l = parsed.length; i < l; i++ ) {
                  let obj = parsed[i]
                  let endpoint = new Endpoint(
                    accessor,
                    accessor.shared.controller,
                    accessor.shared.defaultApi,
                    Object.assign(obj, accessor.shared.predefined),
                    Object.assign(conf, {multiple: false})
                  )
                  accessor.exchange(endpoint)
                }
              }
            } else if (multiple) {
              if (response.config.method.toLowerCase() === 'get') {
                accessor.children = []
              }
              for (let i = 0, l = parsed.length; i < l; i++ ) {
                let child = parsed[i]
                let endpoint = new Endpoint(
                  accessor,
                  accessor.shared.controller,
                  accessor.shared.defaultApi,
                  Object.assign(child, accessor.shared.predefined),
                  Object.assign(conf, {multiple: false})
                )
                if (response.config.method.toLowerCase() === 'get') {
                  accessor.children.push(endpoint)
                } else {
                  if (!accessor.exchange(endpoint)) {
                    accessor.children.push(endpoint)
                  }
                }
              }
            }
            // Parse Headers
            if (key === null) {
              Object.keys(headers).reduce((prev, key) => {
                if (
                  map !== null &&
                  typeof map !== 'undefined' &&
                  typeof map.headers !== 'undefined' &&
                  typeof map.headers[key] !== 'undefined'
                ) {
                  accessor.headers.mapped[map.headers[key]] = headers[key]
                } else {
                  accessor.headers.unmapped[key] = headers[key]
                }
              }, {})
            }
          }

          resolved = true
          resolve(response)
        } catch (error) {
          // Not valid JSON, go to next parser
        }
        // @todo - Add additional parsers. Ex. xml
        if (!resolved) {
          reject(new Error({
            error: 'Invalid Data',
            message: 'Could not parse data from response',
            data: data,
            response: response
          }))
        }
      })
    }

    /**
     * Handle Request Error Catching
     */
    accessor.shared.handleError = (error) => {
      if (axios.isCancel(error)) {
        // Manually cancelled
      } else if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        // error.response.data
        // error.response.status
        // error.response.headers
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        // error.request
      } else {
        // Something happened in setting up the request that triggered an Error
        // error.message
      }
      // error.config
      return error
    }

    /**
     * Handle Request Success Response
     */
    accessor.shared.handleSuccess = (response, replace = true, key = null, batch = false, map = accessor.shared.map) => {
      let multiple = ((map !== null && typeof map !== 'undefined' && typeof map.multiple !== 'undefined' && map.multiple) || accessor.shared.config.multiple)
      return new Promise((resolve, reject) => {
        if (replace) {
          accessor.shared.handleMapping(response, key, batch, multiple).then(results => {
            resolve(results)
          }).catch(error => {
            reject(error)
          })
        } else {
          resolve(response)
        }
      })
    }

    /**
     * Exchange endpoint in accessor.children with match from input
     * @returns Endpoint (exchanged) | Endpoint.children (On Remove) | false (If no match found)
     */
    accessor.exchange = (endpoint, add = true, reliable = false, remove = false /* , map = accessor.shared.map */) => {
      // @note - This could be more heavy and alot slower
      let smartFind = (endpoint) => {
        // Reliable.
        // Check for Creation Identifier match.
        let exchange = resolveCreationIdentifier(endpoint)
        // Reliable.
        // Incoming needs all existing props (No differ).
        // Existing needs all incoming props (No differ).
        if (typeof exchange === 'undefined') {
          exchange = findExactMatch(endpoint)
        }
        // Not reliable, but could be usable anyways
        if (!reliable && typeof exchange === 'undefined') {
          // @todo - Add resolveByIndex (find response index by request index) method and make it optional in config
          // Unreliable.
          // Incoming needs all existing props (No differ).
          // Existing could have more props.
          if (typeof exchange === 'undefined') {
            exchange = findExactExistingMatch(endpoint)
          }
          // Unreliable.
          // Existing needs all incoming props (No differ).
          // Incoming could have more props.
          // Extra incoming props are added to existing props.
          if (typeof exchange === 'undefined') {
            exchange = findExactIncomingMatch(endpoint)
          }
          // Unreliable.
          // Incoming needs all unchanged props (No differ).
          // Existing could have more props.
          // Incoming could have more props.
          // Existing changes is replaced by incoming changes (Also differed).
          // Extra incoming props are added to existing props.
          if (typeof exchange === 'undefined') {
            exchange = findExactUnchangedMatch(endpoint)
          }
          // Unreliable.
          // Incoming needs all changed props (No differ).
          // Existing could have more props.
          // Incoming could have more props.
          // Existing props is replaced by incoming props (Also differed) if not changed.
          // Extra incoming props are added to existing props.
          if (typeof exchange === 'undefined') {
            exchange = findExactChangedMatch(endpoint)
          }
          // Unreliable.
          // Incoming props which matches existing (No differ).
          // Existing could have more props.
          // Incoming could have more props.
          // Extra incoming props are added to existing props.
          if (typeof exchange === 'undefined') {
            exchange = findIncomingMatch(endpoint)
          }
          // Unreliable.
          // Incoming props which matches unchanged existing (No differ).
          // Existing could have more props.
          // Incoming could have more props.
          // Existing changes is replaced by incoming changes (Also differed).
          // Extra incoming props are added to existing props.
          if (typeof exchange === 'undefined') {
            exchange = findUnchangedMatch(endpoint)
          }
          // Unreliable.
          // Incoming props which matches changed existing (No differ).
          // Existing could have more props.
          // Incoming could have more props.
          // Existing props is replaced by incoming props (Also differed) if not changed.
          // Extra incoming props are added to existing props.
          if (typeof exchange === 'undefined') {
            exchange = findChangedMatch(endpoint)
          }
        }
        return exchange
      }
      // Resolve Creation Identifier
      let resolveCreationIdentifier = (endpoint) => {
        let match
        for (let i = 0, l = accessor.children.length; i < l; i++ ) {
          let child = accessor.children[i]
          if (
            child.shared.map !== null &&
            typeof child.shared.map !== 'undefined' &&
            typeof child.shared.map.creationIdentifier !== 'undefined' &&
            typeof child.shared.creationIdentifier !== 'undefined' &&
            child.shared.creationIdentifier !== ''
          ) {
            let identifier = child.shared.map.creationIdentifier
            let prop = identifier.split('=')[0]
            if (!endpoint.reserved(prop)) {
              if (
                typeof endpoint[prop] !== 'undefined' &&
                typeof endpoint[prop].value !== 'undefined' &&
                JSON.stringify(endpoint[prop].value).indexOf(child.shared.creationIdentifier) !== -1
              ) {
                if (!endpoint.reserved(child.identifier.key)) {
                  child.identifier.value = endpoint[child.identifier.key].value
                } else {
                  child.identifier.value = endpoint.invalids[child.identifier.key].value
                }
                match = child
              }
            } else {
              if (
                typeof endpoint.invalids[prop] !== 'undefined' &&
                typeof endpoint.invalids[prop].value !== 'undefined' &&
                JSON.stringify(endpoint.invalids[prop].value).indexOf(child.shared.creationIdentifier) !== -1
              ) {
                if (!endpoint.reserved(child.identifier.key)) {
                  child.identifier.value = endpoint[child.identifier.key].value
                } else {
                  child.identifier.value = endpoint.invalids[child.identifier.key].value
                }
                match = child
              }
            }
          }
        }
        return match
      }
      // Find exact match by all props (Reliable)
      let findExactMatch = (endpoint) => {
        let exchange = accessor.children.find(child => {
          if (child.identifier === null || child.identifier.value === null) {
            let props = child.props()
            let endpointProps = endpoint.props()
            let match = true // Expect match
            Object.keys(props).reduce((prev, key) => {
              if (typeof endpointProps[key] !== 'undefined') {
                if (JSON.stringify(props[key]) !== JSON.stringify(endpointProps[key])) {
                  // If unchanged props doesnt match, set match to false
                  match = false
                }
              } else {
                match = false
              }
            }, {})
            Object.keys(endpointProps).reduce((prev, key) => {
              if (typeof props[key] === 'undefined') {
                match = false
              }
            }, {})
            return match
          } else {
            return false
          }
        })
        return exchange
      }
      // Find exact match by all exisiting props (Reliable)
      let findExactExistingMatch = (endpoint) => {
        let exchange = accessor.children.find(child => {
          if (child.identifier === null || child.identifier.value === null) {
            let props = child.props()
            let endpointProps = endpoint.props()
            let match = true // Expect match
            Object.keys(props).reduce((prev, key) => {
              if (typeof endpointProps[key] !== 'undefined') {
                if (JSON.stringify(props[key]) !== JSON.stringify(endpointProps[key])) {
                  // If unchanged props doesnt match, set match to false
                  match = false
                }
              } else {
                match = false
              }
            }, {})
            return match
          } else {
            return false
          }
        })
        return exchange
      }
      // Find exact match by unchanged props (Less Reliable - Requires incoming props to exist)
      let findExactUnchangedMatch = (endpoint) => {
        let exchange = accessor.children.find(child => {
          if (child.identifier === null || child.identifier.value === null) {
            let changes = child.changes()
            let props = child.props()
            let endpointProps = endpoint.props()
            let match = true // Expect match
            Object.keys(props).reduce((prev, key) => {
              // If not changed prop
              if (typeof changes[key] === 'undefined') {
                // If new child has same prop
                if (typeof endpointProps[key] !== 'undefined') {
                  // If they do not match
                  if (JSON.stringify(props[key]) !== JSON.stringify(endpointProps[key])) {
                    // Skip this
                    match = false
                  }
                  // If incoming prop doesnt exist
                } else {
                  // Skip this
                  match = false
                }
              }
            }, {})
            return match
          } else {
            return false
          }
        })
        return exchange
      }
      // Find exact match by changed props (Less Reliable - Requires incoming props to exist)
      let findExactChangedMatch = (endpoint) => {
        let exchange = accessor.children.find(child => {
          if (child.identifier === null || child.identifier.value === null) {
            let changes = child.changes()
            let props = child.props()
            let endpointProps = endpoint.props()
            let match = true // Expect match
            Object.keys(props).reduce((prev, key) => {
              // If changed prop
              if (typeof changes[key] !== 'undefined') {
                // If new child has same prop
                if (typeof endpointProps[key] !== 'undefined') {
                  // If they do not match
                  if (JSON.stringify(props[key]) !== JSON.stringify(endpointProps[key])) {
                    // Skip this
                    match = false
                  }
                  // If incoming prop doesnt exist
                } else {
                  // Skip this
                  match = false
                }
              }
            }, {})
            return match
          } else {
            return false
          }
        })
        return exchange
      }
      // Find match by unchanged props (Less Reliable - Doesnt require incoming props to exist)
      let findUnchangedMatch = (endpoint) => {
        let exchange = accessor.children.find(child => {
          if (child.identifier === null || child.identifier.value === null) {
            let changes = child.changes()
            let props = child.props()
            let endpointProps = endpoint.props()
            let match = true // Expect match
            Object.keys(props).reduce((prev, key) => {
              // If not changed prop
              if (typeof changes[key] === 'undefined') {
                // If new child has same prop
                if (typeof endpointProps[key] !== 'undefined') {
                  // If they do not match
                  if (JSON.stringify(props[key]) !== JSON.stringify(endpointProps[key])) {
                    // Skip this
                    match = false
                  }
                }
              }
            }, {})
            return match
          } else {
            return false
          }
        })
        return exchange
      }
      // Find match by changed props (Less Reliable - Doesnt require incoming props to exist)
      let findChangedMatch = (endpoint) => {
        let exchange = accessor.children.find(child => {
          if (child.identifier === null || child.identifier.value === null) {
            let changes = child.changes()
            let props = child.props()
            let endpointProps = endpoint.props()
            let match = true // Expect match
            Object.keys(props).reduce((prev, key) => {
              // If changed prop
              if (typeof changes[key] !== 'undefined') {
                // If new child has same prop
                if (typeof endpointProps[key] !== 'undefined') {
                  // If they do not match
                  if (JSON.stringify(props[key]) !== JSON.stringify(endpointProps[key])) {
                    // Skip this
                    match = false
                  }
                }
              }
            }, {})
            return match
          } else {
            return false
          }
        })
        return exchange
      }
      // Find exact match by incoming props (Less Reliable - Requires existing props to have all incoming props)
      let findExactIncomingMatch = (endpoint) => {
        let exchange = accessor.children.find(child => {
          if (child.identifier === null || child.identifier.value === null) {
            let props = child.props()
            let endpointProps = endpoint.props()
            let match = true // Expect match
            Object.keys(endpointProps).reduce((prev, key) => {
              if (typeof props[key] !== 'undefined') {
                if (JSON.stringify(props[key]) !== JSON.stringify(endpointProps[key])) {
                  // If props are unique
                  match = false
                }
              } else {
                // If existing doesnt have all incoming props
                match = false
              }
            }, {})
            return match
          } else {
            return false
          }
        })
        return exchange
      }
      // Find match by incoming props (Less Reliable - Doesnt require existing props to have all incoming props)
      let findIncomingMatch = (endpoint) => {
        let exchange = accessor.children.find(child => {
          if (child.identifier === null || child.identifier.value === null) {
            let props = child.props()
            let endpointProps = endpoint.props()
            let match = true // Expect match
            Object.keys(endpointProps).reduce((prev, key) => {
              if (typeof props[key] !== 'undefined') {
                if (JSON.stringify(props[key]) !== JSON.stringify(endpointProps[key])) {
                  // If props are unique
                  match = false
                }
              }
            }, {})
            return match
          } else {
            return false
          }
        })
        return exchange
      }
      let exchange
      if (endpoint.identifier !== null) {
        exchange = accessor.children.find(child => {
          return (typeof child.identifier !== 'undefined' && typeof endpoint.identifier !== 'undefined' && child.identifier !== null && child.identifier.value === endpoint.identifier.value)
        })
        if (typeof exchange === 'undefined' || exchange === false) {
          exchange = smartFind(endpoint)
        }
      } else {
        exchange = smartFind(endpoint)
      }
      if (typeof exchange !== 'undefined' && !remove) {
        // Handle Exchange
        return exchange.set(endpoint, false)
      } else if (!remove) {
        // If no match found but add by force, push to children
        if (add) {
          accessor.children.push(endpoint)
        }
        return false
      } else if (typeof exchange !== 'undefined') {
        // Handle Remove
        let index = accessor.children.indexOf(exchange)
        if (index !== -1) {
          accessor.children.splice(index, 1)
        }
        return accessor.children
      } else {
        return false
      }
    }

    /**
     * Make Any Request
     */
    accessor.shared.makeRequest = (
      canceler,
      method,
      apiSlug = accessor.shared.defaultApi,
      args = null,
      data = null,
      upload = false,
      conf = {},
      promise = new Promise(resolve => resolve()),
      batch = false
    ) => {
      // Custom Request Config (config level 3 - greater is stronger)
      conf = Object.assign(clone({}, accessor.shared.config), conf)
      if (canceler !== false) {
        let cancelHandler = accessor.shared.handleCancellation(cancelers[canceler])
        cancelers[canceler] = cancelHandler.cancellation
        promise = cancelHandler.promise
      }
      return new Promise((resolve, reject) => {
        // startLoader(method)
        let api = (accessor.shared.controller !== null && apiSlug !== null) ? accessor.shared.controller.apis[apiSlug] : accessor.shared.api
        accessor.shared.requester[method.toLowerCase()](accessor.shared.resolveUrl(accessor.shared.endpoint, accessor.shared.map, api, args, batch), promise, data, upload, conf).then(response => {
          accessor.raw = response
          // stopLoader(method)
          resolve(response)
        }).catch(error => {
          // stopLoader(method)
          reject(accessor.shared.handleError(error))
        })
      })
    }

    accessor.shared.identifier = () => {
      let identifier = null
      if (accessor.identifier !== null && typeof accessor.identifier !== 'undefined' && accessor.identifier.key !== null) {
        if (!accessor.reserved(accessor.identifier.key)) {
          identifier = accessor[accessor.identifier.key]
        } else {
          identifier = accessor.invalids[accessor.identifier.key]
        }
      }
      return identifier
    }

    /**
     * Public / Reserved Method Names
     * @warning Can not be used as a property name in models
     * ---------------
     * Query builder (Create arguments, and make endpoints default fetch method available afterwards)
     */
    accessor.query = () => {
      return new Query(accessor)
    }

    /**
     * Request Fetch @note - Related to Properties
     */
    accessor.fetch = (
      apiSlug = accessor.shared.defaultApi,
      args = accessor.args.fetch,
      replace = true,
      perform = true
    ) => {
      return new Promise((resolve, reject) => {
        let loadSlug = 'fetch'
        startLoader(loadSlug)
        accessor.shared.makeRequest(
          loadSlug,
          'GET',
          apiSlug,
          args,
          null,
          false,
          {
            perform: perform
          }
        ).then(response => {
          accessor.shared.handleSuccess(response, replace).then(() => {
            stopLoader(loadSlug)
            resolve(accessor)
          }).catch(error => {
            stopLoader(loadSlug)
            reject(error)
          })
        }).catch(error => {
          stopLoader(loadSlug)
          reject(error)
        })
      })
    }

    /**
     * Request Save @note - Saves all changed Properties
     * @apiSlug Use custom api by slug
     * @args Custom arguments as object (key: value)
     * @replace replace all properties in endpoint from response
     * @create Attempt to create if save fails (Ex.: if no id provided to endpoint)
     */
    accessor.save = (
      apiSlug = accessor.shared.defaultApi,
      args = accessor.args.save,
      replace = true,
      create = true,
      perform = true,
      map = accessor.shared.map
    ) => {
      if ((map !== null && typeof map !== 'undefined' && typeof map.multiple !== 'undefined' && map.multiple) || accessor.shared.config.multiple) {
        return accessor.batch({create: create}, apiSlug, args, replace, map)
      } else {
        return new Promise((resolve, reject) => {
          let loadSlug = 'save'
          startLoader(loadSlug)
          let identifier = accessor.shared.identifier()
          if (identifier !== null && identifier.value === null) {
            accessor.create(apiSlug, args, replace, true, perform).then(() => {
              stopLoader(loadSlug)
              resolve(accessor)
            }).catch(error => {
              stopLoader(loadSlug)
              reject(error)
            })
          } else {
            accessor.shared.makeRequest(
              loadSlug,
              'PUT',
              apiSlug,
              args,
              accessor.removeIdentifiers(
                accessor.reverseMapping(
                  accessor.changes(false, false, true)
                )
              ),
              false,
              {
                perform: perform
              }
            ).then(response => {
              accessor.shared.handleSuccess(response, replace).then(() => {
                stopLoader(loadSlug)
                resolve(accessor)
              }).catch(error => {
                stopLoader(loadSlug)
                reject(error)
              })
            }).catch(error => {
              // If could not save, try create
              if (create) {
                accessor.create(apiSlug, args, replace, true, perform).then(() => {
                  stopLoader(loadSlug)
                  resolve(accessor)
                }).catch(error => {
                  stopLoader(loadSlug)
                  reject(error)
                })
              } else {
                stopLoader(loadSlug)
                reject(error)
              }
            })
          }
        })
      }
    }

    /**
     * Request Create @note - Saves all Properties
     */
    accessor.create = (
      apiSlug = accessor.shared.defaultApi,
      args = accessor.args.create,
      replace = true,
      save = true,
      perform = true,
      map = accessor.shared.map
    ) => {
      if ((map !== null && typeof map !== 'undefined' && typeof map.multiple !== 'undefined' && map.multiple) || accessor.shared.config.multiple) {
        return accessor.batch({save: save}, apiSlug, args, replace, perform, map)
      } else {
        return new Promise((resolve, reject) => {
          let withEmpty = accessor.removeIdentifiers(accessor.reverseMapping())
          let data = {}
          if (!accessor.shared.config.post.keepNull) {
            Object.keys(withEmpty).reduce((prev, key) => {
              if (withEmpty[key] !== null) {
                data[key] = withEmpty[key]
              }
            }, {})
          } else {
            data = withEmpty
          }
          let loadSlug = 'create'
          startLoader(loadSlug)
          accessor.shared.makeRequest(
            loadSlug,
            'POST',
            apiSlug,
            args,
            data,
            false,
            {
              perform: perform
            }
          ).then(response => {
            accessor.shared.handleSuccess(response, replace).then(() => {
              stopLoader(loadSlug)
              resolve(accessor)
            }).catch(error => {
              stopLoader(loadSlug)
              reject(error)
            })
          }).catch(error => {
            stopLoader(loadSlug)
            reject(error)
          })
        })
      }
    }

    /**
     * Request Remove @note - Related to Properties
     */
    accessor.remove = (
      apiSlug = accessor.shared.defaultApi,
      args = accessor.args.remove,
      replace = true,
      perform = true,
      map = accessor.shared.map
    ) => {
      if ((map !== null && typeof map !== 'undefined' && typeof map.multiple !== 'undefined' && map.multiple) || accessor.shared.config.multiple) {
        return accessor.batch({save: false, create: false, delete: true}, apiSlug, args, replace, map)
      } else {
        return new Promise((resolve, reject) => {
          let loadSlug = 'remove'
          startLoader(loadSlug)
          accessor.shared.makeRequest(
            loadSlug,
            'DELETE',
            apiSlug,
            args,
            null,
            false,
            {
              perform: perform
            }
          ).then(response => {
            if (typeof response !== 'undefined') {
              accessor.shared.handleSuccess(response, replace).then(() => {
                stopLoader(loadSlug)
                resolve(accessor)
              }).catch(error => {
                stopLoader(loadSlug)
                reject(error)
              })
            } else {
              resolve(accessor)
            }
          }).catch(error => {
            stopLoader(loadSlug)
            if (error.response && error.response.status === 410) {
              // Already deleted (Gone)
              resolve(accessor)
            } else {
              reject(error)
            }
          })
        })
      }
    }

    /**
     * Request Upload @note - Related to Properties
     * @note: batch upload not yet supported
     */
    accessor.upload = (
      file,
      apiSlug = accessor.shared.defaultApi,
      args = accessor.args.upload,
      replace = true,
      perform = true,
      method = 'POST',
      map = false
    ) => {
      return new Promise((resolve, reject) => {
        let loadSlug = 'upload'
        startLoader(loadSlug)
        accessor.shared.makeRequest(
          loadSlug,
          method,
          apiSlug,
          args,
          file,
          true,
          {
            perform: perform
          }
        ).then(response => {
          if (map) {
            accessor.shared.handleSuccess(response, replace).then(() => {
              stopLoader(loadSlug)
              resolve(accessor)
            }).catch(error => {
              stopLoader(loadSlug)
              reject(error)
            })
          } else {
            stopLoader(loadSlug)
            resolve(response)
          }
        }).catch(error => {
          stopLoader(loadSlug)
          reject(error)
        })
      })
    }

    /**
     * Request Batch @note - Updates all children
     */
    accessor.batch = (
      options = {},
      apiSlug = accessor.shared.defaultApi,
      args = accessor.args.batch,
      replace = true,
      perform = true,
      map = accessor.shared.map
    ) => {
      options = Object.assign({
        create: true,
        save: true,
        delete: false,
        merge: false, // Merge with parent props if any (usually there is none)
        limit: 100, // Split requests into limited amount of children
        from: 0 // Exclude children before index from request
      }, options)
      let data = {}
      // Handle create
      if (options.create) {
        let hook = (map !== null && typeof map !== 'undefined' && typeof map.batch !== 'undefined' && typeof map.batch.create !== 'undefined') ? map.batch.create : 'create'
        data[hook] = []
        for (let i = 0, l = accessor.children.length; i < l; i++ ) {
          let child = accessor.children[i]
          if (i >= options.from && i < (options.from + options.limit)) {
            // Create Creation Identifier
            if (child.identifier === null || child.identifier.value === null) {
              if (child.shared.map !== null && typeof child.shared.map !== 'undefined' && typeof child.shared.map.creationIdentifier !== 'undefined' && child.shared.map.creationIdentifier !== '') {
                let identifier = child.shared.map.creationIdentifier
                let prop = identifier.split('=')[0]
                let val = identifier.substring((prop.length + 1))
                // Resolve mapping
                if (typeof child.shared.map.props !== 'undefined' && typeof child.shared.map.props[prop] !== 'undefined') {
                  prop = child.shared.map.props[prop]
                }
                // Check if property exist and make reference to prop
                if (!child.reserved(prop) && typeof child[prop] !== 'undefined') {
                  prop = child[prop]
                } else if (child.reserved(prop) && typeof child.invalids[prop] !== 'undefined') {
                  prop = child.invalids[prop]
                } else {
                  // Create prop if not exist
                  if (!child.reserved(prop)) {
                    prop = child[prop] = new Prop(child, prop)
                  } else {
                    prop = child.invalids[prop] = new Prop(child, prop)
                  }
                }
                // Generate creation identifier
                let id = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 15)
                child.shared.creationIdentifier = id
                if (val.length > 0) {
                  val = JSON.parse(val.replace('identifier', id))
                  if (prop.value === null) {
                    prop.value = val
                  } else {
                    if (prop.value.constructor === Array && val.constructor === Array) {
                      prop.value = prop.value.concat(val)
                    } else if (prop.value.constructor !== Array && val.constructor !== Array) {
                      prop.value = Object.assign(prop.value, val)
                    }
                  }
                } else {
                  prop.value = id
                }
              }
              let withEmpty = child.removeIdentifiers(child.reverseMapping(child.props(false, true)))
              let results = {}
              if (!accessor.shared.config.post.keepNull) {
                Object.keys(withEmpty).reduce((prev, key) => {
                  if (withEmpty[key] !== null) {
                    results[key] = withEmpty[key]
                  }
                }, {})
              } else {
                results = withEmpty
              }
              data[hook].push(results)
            }
          }
        }
      }
      // Handle save
      if (options.save) {
        let hook = (map !== null && typeof map !== 'undefined' && typeof map.batch !== 'undefined' && typeof map.batch.save !== 'undefined') ? map.batch.save : 'save'
        data[hook] = []
        for (let i = 0, l = accessor.children.length; i < l; i++ ) {
          let child = accessor.children[i]
          if (i >= options.from && i < (options.from + options.limit)) {
            if (child.identifier !== null && child.identifier.value !== null) {
              // If endpoint has identifier, secure that identifier is added for update and only post changes
              let obj = child.changes(false, false, true)
              obj[child.identifier.key] = child.identifier.value
              data[hook].push(accessor.reverseMapping(obj))
            } else if (child.identifier === null) {
              // If endpoint has no identifier, add the whole child, and not only props
              data[hook].push(accessor.reverseMapping(child.props(false, true)))
            }
          }
        }
      }
      // Handle delete
      if (options.delete) {
        let hook = (map !== null && typeof map !== 'undefined' && typeof map.batch !== 'undefined' && typeof map.batch.delete !== 'undefined') ? map.batch.delete : 'delete'
        data[hook] = []
        for (let i = 0, l = accessor.children.length; i < l; i++ ) {
          let child = accessor.children[i]
          if (i >= options.from && i < (options.from + options.limit)) {
            if (child.identifier !== null && child.identifier.value !== null) {
              // If endpoint has identifier only add id to array
              data[hook].push(child.identifier.value)
            } else if (child.identifier === null) {
              // If endpoint has no identifier, add the whole child, and not only props
              data[hook].push(accessor.reverseMapping(child.props(false, true)))
            }
          }
        }
      }
      // Handle merge
      if (options.merge) {
        data = Object.assign(
          accessor.removeIdentifiers(
            accessor.reverseMapping(
              accessor.props(false, true)
            )
          ),
          data
        )
      }
      return new Promise((resolve, reject) => {
        let loadSlug = 'batch'
        startLoader(loadSlug)
        accessor.shared.makeRequest(
          loadSlug,
          'POST',
          apiSlug,
          args,
          data,
          false,
          {
            perform: perform
          },
          new Promise(resolve => resolve()),
          true
        ).then(response => {
          accessor.shared.handleSuccess(response, replace, null, true).then(() => {
            if ((options.from + options.limit) < accessor.children.length) {
              options.from += options.limit
              accessor.batch(options, apiSlug, args, replace, perform, map).then(() => {
                stopLoader(loadSlug)
                resolve(accessor)
              }).catch(error => {
                stopLoader(loadSlug)
                reject(error)
              })
            } else {
              stopLoader(loadSlug)
              resolve(accessor)
            }
          }).catch(error => {
            stopLoader(loadSlug)
            reject(error)
          })
        }).catch(error => {
          stopLoader(loadSlug)
          reject(error)
        })
      })
    }

    /**
     * Request Get @note - Unrelated to Properties
     */
    accessor.get = (
      apiSlug = accessor.shared.defaultApi,
      data = null,
      args = accessor.args.get,
      upload = false,
      promise = new Promise(resolve => resolve()),
      conf = {}
    ) => {
      return accessor.shared.makeRequest(
        false,
        'GET',
        apiSlug,
        args,
        data,
        upload,
        conf,
        promise
      )
    }

    /**
     * Request Post @note - Unrelated to Properties
     */
    accessor.post = (
      apiSlug = accessor.shared.defaultApi,
      data = null,
      args = accessor.args.post,
      upload = false,
      promise = new Promise(resolve => resolve()),
      conf = {}
    ) => {
      return accessor.shared.makeRequest(
        false,
        'POST',
        apiSlug,
        args,
        data,
        upload,
        conf,
        promise
      )
    }

    /**
     * Request Put @note - Unrelated to Properties
     */
    accessor.put = (
      apiSlug = accessor.shared.defaultApi,
      data = null,
      args = accessor.args.put,
      upload = false,
      promise = new Promise(resolve => resolve()),
      conf = {}
    ) => {
      return accessor.shared.makeRequest(
        false,
        'PUT',
        apiSlug,
        args,
        data,
        upload,
        conf,
        promise
      )
    }

    /**
     * Request Patch @note - Unrelated to Properties
     */
    accessor.patch = (
      apiSlug = accessor.shared.defaultApi,
      data = null,
      args = accessor.args.patch,
      upload = false,
      promise = new Promise(resolve => resolve()),
      conf = {}
    ) => {
      return accessor.shared.makeRequest(
        false,
        'PATCH',
        apiSlug,
        args,
        data,
        upload,
        conf,
        promise
      )
    }

    /**
     * Request Delete @note - Unrelated to Properties
     */
    accessor.delete = (
      apiSlug = accessor.shared.defaultApi,
      data = null,
      args = accessor.args.delete,
      upload = false,
      promise = new Promise(resolve => resolve()),
      conf = {}
    ) => {
      return accessor.shared.makeRequest(
        false,
        'DELETE',
        apiSlug,
        args,
        data,
        upload,
        conf,
        promise
      )
    }

    /**
     * Request Head @note - Unrelated to Properties
     */
    accessor.head = (
      apiSlug = accessor.shared.defaultApi,
      data = null,
      args = accessor.args.head,
      upload = false,
      promise = new Promise(resolve => resolve()),
      conf = {}
    ) => {
      return accessor.shared.makeRequest(
        false,
        'HEAD',
        apiSlug,
        args,
        data,
        upload,
        conf,
        promise
      )
    }

    /**
     * Request Trace @note - Unrelated to Properties
     */
    accessor.trace = (
      apiSlug = accessor.shared.defaultApi,
      data = null,
      args = accessor.args.trace,
      upload = false,
      promise = new Promise(resolve => resolve()),
      conf = {}
    ) => {
      return accessor.shared.makeRequest(
        false,
        'TRACE',
        apiSlug,
        args,
        data,
        upload,
        conf,
        promise
      )
    }

    /**
     * Request Connect @note - Unrelated to Properties
     */
    accessor.connect = (
      apiSlug = accessor.shared.defaultApi,
      data = null,
      args = accessor.args.connect,
      upload = false,
      promise = new Promise(resolve => resolve()),
      conf = {}
    ) => {
      return accessor.shared.makeRequest(
        false,
        'CONNECT',
        apiSlug,
        args,
        data,
        upload,
        conf,
        promise
      )
    }

    /**
     * Request Options @note - Unrelated to Properties
     */
    accessor.options = (
      apiSlug = accessor.shared.defaultApi,
      data = null,
      args = accessor.args.options,
      upload = false,
      promise = new Promise(resolve => resolve()),
      conf = {}
    ) => {
      return accessor.shared.makeRequest(
        false,
        'OPTIONS',
        apiSlug,
        args,
        data,
        upload,
        conf,
        promise
      )
    }

    /**
     * Set / Update Properties
     * Data = Either Endpoint Model or raw JSON if raw = true
     */
    accessor.set = (data, change = true, raw = false, updateKey = null, map = null) => {
      let nokey = updateKey === null
      Object.keys(data).reduce((prev, key) => {
        let alive = nokey || key === updateKey
        let reserved = accessor.reserved(key)
        let hook = accessor
        if (!raw) {
          if (!reserved && typeof hook[key] === 'undefined' && alive) {
            hook[key] = new Prop(
              accessor,
              key,
              data[key].value,
              typeof data[key].config !== 'undefined' ? data[key].config : {},
              data[key].transpiler
            )
          } else if (!reserved && alive && hook[key].value !== data[key].value) {
            hook[key].value = data[key].value
            if (typeof data[key].config !== 'undefined') {
              hook[key].config = Object.assign(hook[key].config, data[key].config)
            }
            hook[key].changed(change ? (typeof data[key].changed === 'function' ? data[key].changed() : false) : false)
          } else if (key === 'invalids') {
            Object.keys(data[key]).reduce((prev, prop) => {
              let living = nokey || prop === updateKey
              if (typeof hook[key][prop] === 'undefined' && living) {
                hook[key][prop] = new Prop(
                  accessor,
                  prop,
                  data[key].value,
                  typeof data[key].config !== 'undefined' ? data[key].config : {},
                  data[key].transpiler
                )
              } else if (living && hook[key][prop].value !== data[key][prop].value) {
                hook[key][prop].value = data[key][prop].value
                if (typeof data[key][prop].config !== 'undefined') {
                  hook[key][prop].config = Object.assign(hook[key][prop].config, data[key][prop].config)
                }
                hook[key][prop].changed(change ? (typeof data[key][prop].changed === 'function' ? data[key][prop].changed() : false) : false)
              }
            }, {})
          }
        } else {
          if (map === null) {
            map = accessor.shared.map
          }
          let prop = (map !== null && typeof map !== 'undefined' && typeof map.props !== 'undefined' && typeof map.props[key] !== 'undefined') ? map.props[key] : key
          if (alive) {
            if (reserved) {
              hook = accessor.invalids
            }
            if (typeof hook[prop] !== 'undefined' && hook[prop].value !== data[key]) {
              hook[prop].value = data[key]
              hook[prop].changed(change)
            } else if (typeof hook[prop] === 'undefined') {
              if (data[key]) {
                hook[prop] = new Prop(
                  accessor,
                  prop,
                  data[key],
                  typeof data[key].config !== 'undefined' ? data[key].config : {},
                  data[key].transpiler
                )
              } else {
                hook[prop] = new Prop(
                  accessor,
                  prop,
                  data[key]
                )
              }
            } else {
              hook[prop].changed(change)
            }
          }
        }
      }, {})
      return (updateKey === null ? accessor : (accessor.reserved(updateKey) ? accessor.invalid[updateKey] : accessor[updateKey]))
    }

    /**
     * Clear Properties
     */
    accessor.clear = (keep = ['id'], change = false) => {
      // Stop Running Property Requests
      Object.keys(cancelers).reduce((prev, key) => {
        if (cancelers[key] !== null) {
          cancelers[key]()
        }
      }, {})
      // Reset loaders
      accessor.loading = false
      accessor.loaders = []
      // Reset properties
      Object.keys(accessor).reduce((prev, key) => {
        if (!accessor.reserved(key) && keep.indexOf(key) === -1 && accessor[key].value !== null) {
          accessor[key].value = null
          accessor[key].changed(change)
        }
      }, {})
      // Empty invalids
      accessor.invalids = {}
      accessor.children = []
      return accessor
    }

    /**
     * Get all props including invalids as object without reserved methods / variables
     * reference === true returns reference. Else only value is returned
     */
    accessor.props = (reference = false, apiReady = false) => {
      let obj = {}
      if (reference) {
        Object.keys(accessor).reduce((prev, key) => {
          if (!accessor.reserved(key)) {
            obj[key] = accessor[key]
          }
        }, {})
        Object.keys(accessor.invalids).reduce((prev, key) => {
          obj[key] = accessor[key]
        }, {})
      } else {
        Object.keys(accessor).reduce((prev, key) => {
          if (!accessor.reserved(key)) {
            obj[key] = apiReady ? accessor[key].apiValue() : accessor[key].value
          }
        }, {})
        Object.keys(accessor.invalids).reduce((prev, key) => {
          obj[key] = apiReady ? accessor.invalids[key].apiValue() : accessor.invalids[key].value
        }, {})
      }
      return obj
    }

    /**
     * Get all changed props including invalids as object without reserved methods / variables
     * reference === true returns reference. Else only value is returned
     */
    accessor.changes = (reference = false, arr = false, apiReady = false) => {
      let obj = {}
      let array = []
      if (reference) {
        Object.keys(accessor).reduce((prev, key) => {
          if (!accessor.reserved(key)) {
            if (accessor[key].changed()) {
              arr ? array.push(accessor[key]) : obj[key] = accessor[key]
            }
          }
        }, {})
        Object.keys(accessor.invalids).reduce((prev, key) => {
          if (accessor.invalids[key].changed()) {
            arr ? array.push(accessor.invalids[key]) : obj[key] = accessor.invalids[key]
          }
        }, {})
      } else {
        Object.keys(accessor).reduce((prev, key) => {
          if (!accessor.reserved(key)) {
            if (accessor[key].changed()) {
              let val = apiReady ? accessor[key].apiValue() : accessor[key].value
              arr ? array.push(key, val) : obj[key] = val
            }
          }
        }, {})
        Object.keys(accessor.invalids).reduce((prev, key) => {
          if (accessor.invalids[key].changed()) {
            let val = apiReady ? accessor.invalids[key].apiValue() : accessor.invalids[key].value
            arr ? array.push([key, val]) : obj[key] = val
          }
        }, {})
      }
      return arr ? array : obj
    }

    /**
     * Check if property key is reserved
     */
    accessor.reserved = (key) => {
      return accessor.shared.reserved.indexOf(key) !== -1
    }

    /**
     * Clone Endpoint
     */
    accessor.clone = (change = true) => {
      let cl = new Endpoint(accessor, accessor.shared.controller, accessor.shared.defaultApi, accessor.shared.predefined, accessor.shared.config)
      cl.args = clone({}, accessor.args)
      cl.raw = clone({}, accessor.raw)
      cl.set(accessor, change)
      for (let i = 0, l = accessor.children.length; i < l; i++ ) {
        let child = accessor.children[i]
        cl.children.push(child.clone(change))
      }
      return cl
    }

    /**
     * ReverseMapping
     */
    accessor.reverseMapping = (props = null, reference = false, map = accessor.shared.map, apiReady = true) => {
      if (props === null) {
        props = accessor.props(reference, apiReady)
      }
      let reverse = {}
      try {
        // Clone props
        if (reference) {
          Object.keys(props).reduce((prev, key) => {
            if (apiReady) {
              reverse[key] = clone({}, props[key].apiValue())
            } else {
              reverse[key] = clone({}, props[key].value)
            }
          }, {})
        } else {
          reverse = clone({}, props)
        }
        if (map !== null && typeof map !== 'undefined' && typeof map.props !== 'undefined') {
          // Replace keys in props with mappings
          Object.keys(map.props).reduce((prev, key) => {
            if (typeof reverse[map.props[key]] !== 'undefined') {
              // @note - If keys in props Collides with mapping, its overwritten
              reverse[key] = reverse[map.props[key]]
              delete reverse[map.props[key]]
            }
          }, {})
        }
      } catch (error) {
        console.error(error)
      }
      return reverse
    }

    /**
     * Remove Identifiers before making request. Takes raw only, not references
     */
    accessor.removeIdentifiers = (props, endpoint = accessor.shared.endpoint, map = accessor.shared.map) => {
      let path = (map !== null && typeof map !== 'undefined') ? map.endpoint : endpoint
      let identifiers = accessor.identifiers(path)
      Object.keys(props).reduce((prev, key) => {
        if (typeof identifiers[key] !== 'undefined') {
          delete props[key]
        }
      }, {})
      return props
    }

    /**
     * Identifiers - Resolve Identifiers. Ex.: {id} or {/parentId} etc. in path
     */
    accessor.identifiers = (path) => {
      let identifiers = {}
      // Resolve Identifiers. Ex.: {id} or {/parentId} etc...
      if (path.indexOf('}') !== '-1') {
        let optionals = path.split('}')
        for (let i = 0, l = optionals.length; i < l; i++ ) {
          let opt = optionals[i]
          let index = opt.indexOf('{')
          if (index !== -1) {
            let hook = opt.substring(index) + '}'
            let prop = hook.replace('{', '').replace('}', '')
            let slash = false
            if (prop.indexOf('/') !== -1) {
              prop = prop.replace('/', '')
              slash = true
            }
            identifiers[prop] = {
              slash: slash,
              hook: hook
            }
          }
        }
      }
      return identifiers
    }

    /**
     * Sort children
     * @param key
     */
    accessor.sort = (key = 'menu_order') => {
      let compare = (a, b) => {
        if (!accessor.reserved(key)) {
          if (a[key].value < b[key].value) {
            return -1
          } else if (a[key].value > b[key].value) {
            return 1
          }
        } else {
          if (a.invalids[key].value < b.invalids[key].value) {
            return -1
          } else if (a.invalids[key].value > b.invalids[key].value) {
            return 1
          }
        }
        return 0
      }
      accessor.children.sort(compare)
    }
    init() // Run at Construction
  }
}
