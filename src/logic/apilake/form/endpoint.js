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
    let shared = {
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
        'reserved'
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
        shared.requester = api.requester
        map = resolveMap(endpoint, api)
        shared.buildProps(map, predefined)
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
    shared.buildProps = (map = map, predefined = predefined) => {
      if (map !== null && typeof map.props !== 'undefined') {
        try {
          Object.keys(map.props).forEach(key => {
            if (!accessor.reserved(key)) {
              accessor[map.props[key]] = new Prop(shared, map.props[key], null)
            } else if (key === 'invalids') {
              accessor.invalids[map.props[key]] = new Prop(shared, map.props[key], null)
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
            accessor[key] = new Prop(shared, key, predefined[key])
          } else if (key === 'invalids' && typeof accessor.invalids[key] === 'undefined') {
            accessor.invalids[key] = new Prop(shared, key, predefined[key])
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
    shared.resolveUrl = (endpoint = endpoint, map = map, api = api, args = null) => {
      let base = ''
      let path = endpoint
      // If mapping is set
      if (map !== null) {
        path = map.endpoint
        base = api.base
        // Remove last slash if any from base
        if (base[(base.length - 1)] === '/') {
          base = base.slice(0, -1)
        }
        // Add slash to path if missing
        if (path[0] !== '/') {
          path = '/' + path
        }
        // Resolve Optionals
        if (path.indexOf('}') !== '-1') {
          let optionals = path.split('}')
          optionals.forEach(opt => {
            let index = opt.indexOf('{')
            if (index !== -1) {
              let repl = opt.substring(index) + '}'
              let prop = repl.replace('{', '').replace('}', '')
              let val = ''
              if (repl.indexOf('/') !== -1) {
                prop = repl.replace('/', '')
                val = '/'
              }
              if (typeof scope[prop] !== 'undefined') {
                path = path.replace(repl, val + scope[prop].value)
              }
            }
          })
        }
      }
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
    shared.startLoader = (loadSlug) => {
      accessor.loading = true
      return accessor.loaders.push(loadSlug)
    }

    /**
     * Stop Loader
     */
    shared.stopLoader = (loadSlug) => {
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
    shared.handleCancellation = (cancellation) => {
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
    shared.handleMapping = (response) => {
      return new Promise((resolve, reject) => {
        let data = response.data // Raw from server
        let headers = response.headers // In lowercase
        try {
          // Parse Data
          let response = accessor.set(JSON.parse(data))
          // Parse Headers
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
          resolve(response)
        } catch (error) {
          // Not valid JSON
        }
        // @todo - Add additional parsers. Ex. xml
        reject({
          error: 'Invalid Data',
          message: 'Could not resolve properties from responded data',
          data: data,
          response: response
        })
      })
    }

    /**
     * ReverseMapping @todo
     */
    shared.reverseMapping = (raw) => {
      return raw
    }

    /**
     * Handle Request Error Catching
     */
    shared.handleError = (error) => {
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
    shared.handleSuccess = (response, replace = true) => {
      return new Promise((resolve, reject) => {
        if (replace) {
          shared.handleMapping(response).then(results => {
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
    shared.makeRequest = (
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
        let cancelHandler = shared.handleCancellation(cancelers[canceler])
        cancelers[canceler] = cancelHandler.cancellation
        promise = cancelHandler.cancellation
      }
      return new Promise((resolve, reject) => {
        shared.startLoader(method)
        let api = controller !== null ? controller.apis[apiSlug] : api
        shared.requester[method.toLowerCase()](shared.resolveUrl(endpoint, map, api, args), promise, data, upload, conf).then(response => {
          accessor.raw = response
          shared.stopLoader(method)
          resolve(response)
        }).catch(error => {
          shared.stopLoader(method)
          reject(shared.handleError(error))
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
        shared.startLoader(loadSlug)
        shared.makeRequest(
          loadSlug,
          'GET',
          apiSlug,
          args
        ).then(response => {
          shared.handleSuccess(response, replace).then(results => {
            shared.stopLoader(loadSlug)
            resolve(results)
          }).catch(error => {
            shared.stopLoader(loadSlug)
            reject(error)
          })
        })
      }).catch(error => {})
    }

    /**
     * Request Save @note - Related to Properties
     */
    accessor.save = (apiSlug = apiSlug, args = null, replace = true) => {
      return new Promise((resolve, reject) => {
        let loadSlug = 'save'
        shared.startLoader(loadSlug)
        shared.makeRequest(
          loadSlug,
          'PUT',
          apiSlug,
          args,
          reverseMapping(accessor.changes())
        ).then(response => {
          shared.handleSuccess(response, replace).then(results => {
            shared.stopLoader(loadSlug)
            resolve(results)
          }).catch(error => {
            shared.stopLoader(loadSlug)
            reject(error)
          })
        })
      }).catch(error => {})
    }

    /**
     * Request Create @note - Related to Properties
     */
    accessor.create = (apiSlug = apiSlug, args = null, replace = true) => {
      return new Promise((resolve, reject) => {
        let loadSlug = 'create'
        shared.startLoader(loadSlug)
        shared.makeRequest(
          loadSlug,
          'POST',
          apiSlug,
          args,
          reverseMapping(props())
        ).then(response => {
          shared.handleSuccess(response, replace).then(results => {
            shared.stopLoader(loadSlug)
            resolve(results)
          }).catch(error => {
            shared.stopLoader(loadSlug)
            reject(error)
          })
        })
      }).catch(error => {})
    }

    /**
     * Request Remove @note - Related to Properties
     */
    accessor.remove = (apiSlug = apiSlug, args = null, replace = true) => {
      return new Promise((resolve, reject) => {
        let loadSlug = 'remove'
        shared.startLoader(loadSlug)
        shared.makeRequest(
          loadSlug,
          'DELETE',
          apiSlug,
          args
        ).then(response => {
          shared.handleSuccess(response, replace).then(results => {
            shared.stopLoader(loadSlug)
            resolve(results)
          }).catch(error => {
            shared.stopLoader(loadSlug)
            reject(error)
          })
        })
      }).catch(error => {})
    }

    /**
     * Request Upload @note - Related to Properties
     */
    accessor.upload = (file, apiSlug = apiSlug, args = null, replace = true) => {
      return new Promise((resolve, reject) => {
        let loadSlug = 'upload'
        shared.startLoader(loadSlug)
        shared.makeRequest(
          loadSlug,
          'PUT',
          apiSlug,
          args,
          file,
          true
        ).then(response => {
          shared.handleSuccess(response, replace).then(results => {
            shared.stopLoader(loadSlug)
            resolve(results)
          }).catch(error => {
            shared.stopLoader(loadSlug)
            reject(error)
          })
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
      return shared.makeRequest(
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
      return shared.makeRequest(
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
      return shared.makeRequest(
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
      return shared.makeRequest(
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
      return shared.makeRequest(
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
      return shared.makeRequest(
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
      return shared.makeRequest(
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
      return shared.makeRequest(
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
      return shared.makeRequest(
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
    accessor.set = (data, change = true, raw = false) => {
      Object.keys(data).forEach(key => {
        let hook = accessor
        let prop = key
        if (!raw) {
          if (!accessor.reserved(prop)) {
            hook[prop].value = data[key].value
            hook[prop].changed(change)
          }
          if (key === 'invalids') {
            Object.keys(data[key]).forEach(prop => {
              hook[key][prop].value = data[key][prop].value
              hook[key][prop].changed(change)
            })
          }
        } else {
          prop = typeof map.props[key] !== 'undefined' ? map.props[key] : key
          if (accessor.reserved(prop)) {
            hook = accessor.invalids
          }
          if (typeof hook[prop] !== 'undefined') {
            hook[prop].value = data[key]
            hook[prop].changed(change)
          } else {
            hook[prop] = new Prop(shared, prop, data[key])
          }
        }
      })
      return accessor
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
      return shared.reserved.indexOf(key) !== -1
    }

    /**
     * Clone Endpoint
     */
    accessor.clone = (changes = true) => {
      let clone = new Endpoint(endpoint, controller, apiSlug, predefined)
      clone.raw = JSON.parse(JSON.stringify(accessor.raw))
      return clone.set(accessor)
    }

  }

}
