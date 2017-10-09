import Requester from '../services/requester'
import Prop from './prop'

/**
 * Endpoint
 */
export default class Endpoint {

  constructor (endpoint, controller, apiSlug = null, predefined = {}) {

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
     * Shared Variables
     */
    accessor.shared = {
      requester: Requester = controller,
      accessor: accessor,
      reserved: [
        'loading',
        'loaders',
        // Property Requesters
        'fetch',
        'custom',
        'save',
        'create',
        'clear',
        'upload',
        'remove',
        // Custom Requesters
        'get',
        'post',
        'put',
        'delete',
        'head',
        'trace',
        'connect',
        'options',
        // Property Methods
        'set',
        'clone',
        'changes',
        'headers',
        'invalids',
        'props',
        'raw',
        'reserved',
        'shared',
        'identifiers',
        'removeIdentifiers',
        'reverseMapping'
      ]
    }
    
    /**
     * Private Variables
     */
    let api = null
    let map = null
    let cancelers = {
      fetch: null,
      save: null,
      create: null,
      remove: null,
      upload: null
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
    let init = () => {
      /**
       * Map Resolver
       */
      let resolveMap = (endpoint = endpoint, api = api) => {
        let map = null
        try {
          map = api.mappings[endpoint]
        } catch (e) {}
        return map
      }
      /**
       * Resolve Requester
       */
      if (typeof controller.apis !== 'undefined') {
        apiSlug = controller.default
        api = controller.apis[apiSlug]
        accessor.shared.requester = api.requester
        map = resolveMap(endpoint, api)
        accessor.shared.buildProps(map, predefined)
      } else {
        controller = null
      }
    }
    init() // Run at Construction

    /**
     * Shared Methods
     */

    /**
     * Build mapped / predefined properties
     */
    accessor.shared.buildProps = (map = map, predefined = predefined) => {
      if (map !== null && typeof map.props !== 'undefined') {
        try {
          Object.keys(map.props).forEach(key => {
            if (!accessor.reserved(key)) {
              accessor[map.props[key]] = new Prop(accessor, map.props[key], null)
            } else if (key === 'invalids') {
              accessor.invalids[map.props[key]] = new Prop(accessor, map.props[key], null)
            }
          })
        }
         catch (error) {
          console.error('Error in property mapping for api ' + apiSlug)
          console.error(map.props)
        }
      }
      try {
        Object.keys(predefined).forEach(key => {
          if (!accessor.reserved(key) && typeof accessor[key] === 'undefined') {
            accessor[key] = new Prop(accessor, key, predefined[key])
          } else if (key === 'invalids' && typeof accessor.invalids[key] === 'undefined') {
            accessor.invalids[key] = new Prop(accessor, key, predefined[key])
          } else if (typeof accessor[key] !== 'undefined') {
            if (key === 'invalids') {
              accessor.invalids[key].value = predefined[key]
            } else {
              accessor[key].value = predefined[key]
            }
          }
        })
      }
      catch (error) {
        console.error('Error in predefined properties')
        console.error(predefined)
      }
    }

    /**
     * Url Resolver
     */
    accessor.shared.resolveUrl = (endpoint = endpoint, map = map, api = api, args = null) => {
      let base = api !== null ? api.base : ''
      // Remove last slash if any from base
      if (base.length > 0 && base[(base.length - 1)] === '/') {
        base = base.slice(0, -1)
      }
      let path = endpoint
      // If mapping is set
      if (map !== null) {
        path = map.endpoint
        // Add slash to path if missing
        if (path.length > 0 && path[0] !== '/') {
          path = '/' + path
        }
      }
      // Resolve Identifiers. Ex.: {id} or {/parentId} etc...
      let identifiers = accessor.identifiers(path)
      Object.keys(identifiers).forEach(key => {
        let slash = identifiers[key].slash
        let hook = identifiers[key].hook
        // Resolve mapping
        if (map !== null && typeof map.props !== 'undefined') {
          key = typeof map.props[key] !== 'undefined' ? map.props[key] : key
        }
        // Replace hook with value from mapped prop
        if (!accessor.reserved(key) && typeof accessor[key] !== 'undefined') {
          path = path.replace(hook, (slash ? '/' : '') + accessor[key].value)
        } else if (accessor.reserved(key) && typeof accessor.invalids[key] !== 'undefined') {
          path = path.replace(hook, (slash ? '/' : '') + accessor.invalids[key].value)
        }
      })
      let url = base + path
      // Add Query Arguments
      if (args !== null) {
        if (url.indexOf('?') === -1) {
          url += '?'
        } else if (url[(url.length - 1)] !== '?' && url[(url.length - 1)] !== '&') {
          url += '&'
        }
        Object.keys(args).forEach(key => {
          url += key + '=' + args[key] + '&'
        })
        if (url[(url.length - 1)] === '&') {
          url = url.slice(0, -1)
        }
      }
      return base + path
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
        accessor.loaders = accessor.loaders.splice(index, 1)
        accessor.loading = accessor.loaders.length > 0
      }
      return accessor.loaders.push(loadSlug)
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
    accessor.shared.handleMapping = (response, key = null) => {
      return new Promise((resolve, reject) => {
        let data = response.data // Raw from server
        let headers = response.headers // In lowercase
        try {
          // Parse Data
          let response = accessor.set(JSON.parse(data), false, true, key)
          // Parse Headers
          if (key === null) {
            Object.keys(headers).forEach(key => {
              if (
                map !== null &&
                typeof map.headers !== 'undefined' &&
                typeof map.headers[key] !== 'undefined'
              ) {
                accessor.headers.mapped[map.headers[key]] = headers[key]
              } else {
                accessor.headers.unmapped[key] = headers[key]
              }
            })
          }
          resolve(response)
        } catch (error) {
          // Not valid JSON, go to next parser
        }
        // @todo - Add additional parsers. Ex. xml
        reject({
          error: 'Invalid Data',
          message: 'Could not parse data from response',
          data: data,
          response: response
        })
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
    accessor.shared.handleSuccess = (response, replace = true, key = null) => {
      return new Promise((resolve, reject) => {
        if (replace) {
          accessor.shared.handleMapping(response, key).then(results => {
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
     * Make Any Request
     */
    accessor.shared.makeRequest = (
      canceler,
      method,
      apiSlug = apiSlug,
      args = null,
      data = null,
      upload = false,
      conf = {},
      promise = new Promise()
    ) => {
      if (canceler !== false) {
        let cancelHandler = accessor.shared.handleCancellation(cancelers[canceler])
        cancelers[canceler] = cancelHandler.cancellation
        promise = cancelHandler.cancellation
      }
      return new Promise((resolve, reject) => {
        startLoader(method)
        let api = controller !== null ? controller.apis[apiSlug] : api
        accessor.shared.requester[method.toLowerCase()](accessor.shared.resolveUrl(endpoint, map, api, args), promise, data, upload, conf).then(response => {
          accessor.raw = response
          stopLoader(method)
          resolve(response)
        }).catch(error => {
          stopLoader(method)
          reject(accessor.shared.handleError(error))
        })
      }).catch(error => {})
    }

    /**
     * Public / Reserved Method Names
     * @warning Can not be used as a property name in models
     * ---------------
     * Request Fetch @note - Related to Properties
     */
    accessor.fetch = (apiSlug = apiSlug, args = null, replace = true) => {
      return new Promise((resolve, reject) => {
        let loadSlug = 'fetch'
        startLoader(loadSlug)
        accessor.shared.makeRequest(
          loadSlug,
          'GET',
          apiSlug,
          args
        ).then(response => {
          accessor.shared.handleSuccess(response, replace).then(results => {
            stopLoader(loadSlug)
            resolve(results)
          }).catch(error => {
            stopLoader(loadSlug)
            reject(error)
          })
        }).catch(error => {
          stopLoader(loadSlug)
          reject(error)
        })
      }).catch(error => {})
    }
    
    /**
     * Request Save @note - Saves all changed Properties
     * @apiSlug Use custom api by slug
     * @args Custom arguments as object (key: value)
     * @replace replace all properties in endpoint from response
     * @create Attempt to create if save fails (Ex.: if no id provided to endpoint)
     */
    accessor.save = (apiSlug = apiSlug, args = null, replace = true, create = true) => {
      return new Promise((resolve, reject) => {
        let loadSlug = 'save'
        startLoader(loadSlug)
        accessor.shared.makeRequest(
          loadSlug,
          'PUT',
          apiSlug,
          args,
          accessor.removeIdentifiers(
            accessor.reverseMapping(
              accessor.changes()
            )
          )
        ).then(response => {
          accessor.shared.handleSuccess(response, replace).then(results => {
            stopLoader(loadSlug)
            resolve(results)
          }).catch(error => {
            stopLoader(loadSlug)
            reject(error)
          })
        }).catch(error => {
          // If could not save, try create
          if (create) {
            accessor.create(apiSlug, args, replace).then(response => {
              stopLoader(loadSlug)
              resolve(results)
            }).catch(error => {
              stopLoader(loadSlug)
              reject(error)
            })
          } else {
            stopLoader(loadSlug)
            reject(error)
          }
        })
      }).catch(error => {})
    }

    /**
     * Request Create @note - Saves all Properties
     */
    accessor.create = (apiSlug = apiSlug, args = null, replace = true) => {
      return new Promise((resolve, reject) => {
        let loadSlug = 'create'
        startLoader(loadSlug)
        accessor.shared.makeRequest(
          loadSlug,
          'POST',
          apiSlug,
          args,
          accessor.removeIdentifiers(
            accessor.reverseMapping()
          )
        ).then(response => {
          accessor.shared.handleSuccess(response, replace).then(results => {
            stopLoader(loadSlug)
            resolve(results)
          }).catch(error => {
            stopLoader(loadSlug)
            reject(error)
          })
        }).catch(error => {
          stopLoader(loadSlug)
          reject(error)
        })
      }).catch(error => {})
    }

    /**
     * Request Remove @note - Related to Properties
     */
    accessor.remove = (apiSlug = apiSlug, args = null, replace = true) => {
      return new Promise((resolve, reject) => {
        let loadSlug = 'remove'
        startLoader(loadSlug)
        accessor.shared.makeRequest(
          loadSlug,
          'DELETE',
          apiSlug,
          args
        ).then(response => {
          accessor.shared.handleSuccess(response, replace).then(results => {
            stopLoader(loadSlug)
            resolve(results)
          }).catch(error => {
            stopLoader(loadSlug)
            reject(error)
          })
        }).catch(error => {
          stopLoader(loadSlug)
          reject(error)
        })
      }).catch(error => {})
    }

    /**
     * Request Upload @note - Related to Properties
     */
    accessor.upload = (file, apiSlug = apiSlug, args = null, replace = true) => {
      return new Promise((resolve, reject) => {
        let loadSlug = 'upload'
        startLoader(loadSlug)
        accessor.shared.makeRequest(
          loadSlug,
          'PUT',
          apiSlug,
          args,
          file,
          true
        ).then(response => {
          accessor.shared.handleSuccess(response, replace).then(results => {
            stopLoader(loadSlug)
            resolve(results)
          }).catch(error => {
            stopLoader(loadSlug)
            reject(error)
          })
        }).catch(error => {
          stopLoader(loadSlug)
          reject(error)
        })
      }).catch(error => {})
    }

    /**
     * Request Get @note - Unrelated to Properties
     */
    accessor.get = (
      apiSlug = apiSlug,
      data = null,
      args = null,
      upload = false,
      promise = new Promise(),
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
      apiSlug = apiSlug,
      data = null,
      args = null,
      upload = false,
      promise = new Promise(),
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
      apiSlug = apiSlug,
      data = null,
      args = null,
      upload = false,
      promise = new Promise(),
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
      apiSlug = apiSlug,
      data = null,
      args = null,
      upload = false,
      promise = new Promise(),
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
      apiSlug = apiSlug,
      data = null,
      args = null,
      upload = false,
      promise = new Promise(),
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
      apiSlug = apiSlug,
      data = null,
      args = null,
      upload = false,
      promise = new Promise(),
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
      apiSlug = apiSlug,
      data = null,
      args = null,
      upload = false,
      promise = new Promise(),
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
      apiSlug = apiSlug,
      data = null,
      args = null,
      upload = false,
      promise = new Promise(),
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
      apiSlug = apiSlug,
      data = null,
      args = null,
      upload = false,
      promise = new Promise(),
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
     */
    accessor.set = (data, change = true, raw = false, updateKey = null) => {
      Object.keys(data).forEach(key => {
        let hook = accessor
        let prop = key
        if (!raw) {
          if (!accessor.reserved(prop) && (updateKey === null || prop === updateKey)) {
            hook[prop].value = data[key].value
            hook[prop].changed(change)
          }
          if (key === 'invalids') {
            Object.keys(data[key]).forEach(prop => {
              if (updateKey === null || prop === updateKey) {
                hook[key][prop].value = data[key][prop].value
                hook[key][prop].changed(change)
              }
            })
          }
        } else {
          prop = typeof map.props[key] !== 'undefined' ? map.props[key] : key
          if (updateKey === null || prop === updateKey) {
            if (accessor.reserved(prop)) {
              hook = accessor.invalids
            }
            if (typeof hook[prop] !== 'undefined') {
              hook[prop].value = data[key]
              hook[prop].changed(change)
            } else {
              hook[prop] = new Prop(accessor, prop, data[key])
            }
          }
        }
      })
      return (updateKey === null ? accessor : (accessor.reserved(updateKey) ? accessor.invalid[updateKey] : accessor[updateKey]))
    }

    /**
     * Clear Properties
     */
    accessor.clear = (keep = ['id'], change = false) => {
      // Stop Running Property Requests
      Object.keys(cancelers).forEach(key => {
        if (cancelers[key] !== null) {
          cancelers[key]()
        }
      })
      // Reset loaders
      accessor.loading = false
      accessor.loaders = []
      // Reset properties
      Object.keys(accessor).forEach(key => {
        if (!accessor.reserved(key) && keep.indexOf(key) === -1) {
          accessor[key].value = null
          accessor[key].changed(change)
        }
      })
      // Empty invalids
      accessor.invalids = {}
      return accessor
    }

    /**
     * Get all props including invalids as object without reserved methods / variables
     * reference === true returns reference. Else only value is returned
     */
    accessor.props = (reference = false) => {
      let obj = {}
      if (reference) {
        Object.keys(accessor).forEach(key => {
          if (!accessor.reserved(key)) {
            obj[key] = accessor[key]
          }
        })
        Object.keys(accessor.invalids).forEach(key => {
          obj[key] = accessor[key]
        })
      } else {
        Object.keys(accessor).forEach(key => {
          if (!accessor.reserved(key)) {
            obj[key] = accessor[key].value
          }
        })
        Object.keys(accessor.invalids).forEach(key => {
          obj[key] = accessor[key].value
        })
      }
      return obj
    }

    /**
     * Get all changed props including invalids as object without reserved methods / variables
     * reference === true returns reference. Else only value is returned
     */
    accessor.changes = (reference = false) => {
      let obj = {}
      if (reference) {
        Object.keys(accessor).forEach(key => {
          if (!accessor.reserved(key)) {
            if (accessor[key].changed()) {
              obj[key] = accessor[key]
            }
          }
        })
        Object.keys(accessor.invalids).forEach(key => {
          if (accessor[key].changed()) {
            obj[key] = accessor[key]
          }
        })
      } else {
        Object.keys(accessor).forEach(key => {
          if (!accessor.reserved(key)) {
            if (accessor[key].changed()) {
              obj[key] = accessor[key].value
            }
          }
        })
        Object.keys(accessor.invalids).forEach(key => {
          if (accessor[key].changed()) {
            obj[key] = accessor[key].value
          }
        })
      }
      return obj
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
    accessor.clone = (changes = true) => {
      let clone = new Endpoint(endpoint, controller, apiSlug, predefined)
      clone.raw = JSON.parse(JSON.stringify(accessor.raw))
      return clone.set(accessor)
    }

    /**
     * ReverseMapping
     */
    accessor.reverseMapping = (props = accessor.props(), reference = false) => {
      let reverse = {}
      try {
        // Clone props
        if (reference) {
          Object.keys(props).forEach(key => {
            reverse[key] = JSON.parse(JSON.stringify(props[key].value))
          })
        } else {
          reverse = JSON.parse(JSON.stringify(props))
        }
        // Replace keys in props with mappings
        Object.keys(map.props).forEach(key => {
          if (typeof reverse[map.props[key]] !== 'undefined') {
            // @note - If keys in props Collides with mapping, its overwritten
            reverse[key] = reverse[map.props[key]]
            delete reverse[map.props[key]]
          }
        })
      } catch (error) {
        console.error(error)
      }
      return reverse
    }

    /**
     * Remove Identifiers before making request. Takes raw only, not references
     */
    accessor.removeIdentifiers = (props, endpoint = endpoint, map = map) => {
      let path = map !== null ? map.endpoint : endpoint
      let identifiers = accessor.identifiers(path)
      Object.keys(props).forEach(key => {
        if (typeof identifiers[key] !== 'undefined') {
          delete props[key]
        }
      })
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
        optionals.forEach(opt => {
          let index = opt.indexOf('{')
          if (index !== -1) {
            let hook = opt.substring(index) + '}'
            let prop = hook.replace('{', '').replace('}', '')
            let slash = false
            if (hook.indexOf('/') !== -1) {
              prop = hook.replace('/', '')
              slash = true
            }
            identifiers[prop] = {
              slash: slash,
              hook: hook
            }
          }
        })
      }
      return identifiers
    }

  }

}
