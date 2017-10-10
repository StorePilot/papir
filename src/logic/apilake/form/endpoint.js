import Controller from '../services/controller'
import Requester from '../services/requester'
import Prop from './prop'

/**
 * Endpoint
 */
export default class Endpoint {

  constructor (endpoint: string, controller: Controller | Requester, apiSlug = null, predefined = {}) {

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
     * Shared Variables
     */
    accessor.shared = {
      defaultApi: apiSlug,
      map: null,
      endpoint: endpoint,
      controller: controller,
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
        'identifier',
        'identifiers',
        'removeIdentifiers',
        'reverseMapping'
      ]
    }
    
    /**
     * Private Variables
     */
    let api = null
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
        accessor.shared.defaultApi = accessor.shared.defaultApi === null ? controller.default : accessor.shared.defaultApi
        api = controller.apis[accessor.shared.defaultApi]
        accessor.shared.requester = api.requester
        accessor.shared.map = resolveMap(endpoint, api)
        accessor.shared.buildProps(accessor.shared.map, predefined)
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
    accessor.shared.buildProps = (map = accessor.shared.map, predefined = predefined) => {
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
          console.error('Error in property mapping for api ' + accessor.shared.defaultApi)
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
      if (map !== null && typeof map.identifier !== 'undefined') {
        let mappedIdentifier = map.identifier
        if (map.props[map.identifier] !== 'undefined') {
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
    accessor.shared.resolveUrl = (endpoint = endpoint, map = accessor.shared.map, api = api, args = null) => {
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
        } else {
          path = path.replace(hook, '')
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
    accessor.shared.handleMapping = (response, key = null, batch, multiple, map = accessor.shared.map) => {
      return new Promise((resolve, reject) => {
        let resolved = false
        let data = response.data // Raw from server
        let headers = response.headers // In lowercase
        try {
          let parsed = JSON.parse(data)
          if (!batch && !multiple) {
            // Parse Data
            let response = accessor.set(parsed, false, true, key)
          } else if (batch && map !== null) {
            parsed.forEach(method => {
              if (
                (typeof map.batch !== 'undefined' && typeof map.batch.delete !== 'undefined' && method !== map.batch.delete) ||
                ((typeof map.batch === 'undefined' || typeof map.batch.delete === 'undefined') && method !== 'delete')
              ) {
                method.forEach(child => {
                  let endpoint = new Endpoint(map.child, controller, apiSlug, child)
                  accessor.shared.exchange(endpoint)
                }) // @todo - create exchange
              }
            })
          } else if (multiple && map !== null) {
            parsed.forEach(child => {
              let endpoint = new Endpoint(map.child, controller, apiSlug, child)
              accessor.shared.exchange(endpoint)
            })
          }
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
          resolved = true
          resolve(response)
        } catch (error) {
          // Not valid JSON, go to next parser
        }
        // @todo - Add additional parsers. Ex. xml

        if (!resolved) {
          reject({
            error: 'Invalid Data',
            message: 'Could not parse data from response',
            data: data,
            response: response
          })
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
    accessor.shared.handleSuccess = (response, replace = true, key = null, batch = false) => {
      let multiple = (map !== null && typeof map.multiple !== null && map.multiple)
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
        accessor.shared.requester[method.toLowerCase()](accessor.shared.resolveUrl(endpoint, accessor.shared.map, api, args), promise, data, upload, conf).then(response => {
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
    accessor.fetch = (apiSlug = accessor.shared.defaultApi, args = null, replace = true) => {
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
    accessor.save = (
      apiSlug = accessor.shared.defaultApi,
      args = null,
      replace = true,
      create = true,
      map = accessor.shared.map
    ) => {
      if (map !== null && typeof map.multiple !== null && map.multiple) {
        return accessor.batch({ create: create }, apiSlug, args, replace, map)
      } else {
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
    }

    /**
     * Request Create @note - Saves all Properties
     */
    accessor.create = (
      apiSlug = accessor.shared.defaultApi,
      args = null,
      replace = true,
      save = true,
      map = accessor.shared.map
    ) => {
      if (map !== null && typeof map.multiple !== null && map.multiple) {
        return accessor.batch({ save: save }, apiSlug, args, replace, map)
      } else {
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
    }

    /**
     * Request Remove @note - Related to Properties
     */
    accessor.remove = (
      apiSlug = accessor.shared.defaultApi,
      args = null,
      replace = true,
      map = accessor.shared.map
    ) => {
      if (map !== null && typeof map.multiple !== null && map.multiple) {
        return accessor.batch({ save: false, create: false, delete: true }, apiSlug, args, replace, map)
      } else {
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
    }

    /**
     * Request Upload @note - Related to Properties
     * @note: batch upload not yet supported
     */
    accessor.upload = (file, apiSlug = accessor.shared.defaultApi, args = null, replace = true) => {
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
     * Request Batch @note - Updates all children
     */
    accessor.batch = (options = {}, apiSlug = accessor.shared.defaultApi, args = null, replace = true, map = accessor.shared.map) => {
      options = Object.assign({
        create: true,
        save: true,
        delete: false,
        merge: true // Merge with parent props if any (usually there is none)
      }, options)
      let data = {}
      let hook = 'create'
      // Handle create
      if (options.create) {
        let hook = (map !== null && typeof map.batch !== 'undefined' && typeof map.batch.create !== 'undefined') ? map.batch.create : 'create'
        data[hook] = []
        accessor.children.forEach(child => {
          if (child.identifier === null || child.identifier.value === null) {
            data[hook].push(accessor.reverseMapping(child.props()))
          }
        })
      }
      // Handle save
      if (options.save) {
        let hook = (map !== null && typeof map.batch !== 'undefined' && typeof map.batch.save !== 'undefined') ? map.batch.save : 'save'
        data[hook] = []
        accessor.children.forEach(child => {
          if (child.identifier !== null && child.identifier.value !== null) {
            // If endpoint has identifier, secure that identifier is added for update and only post changes
            let obj = child.changes()
            obj[child.identifier.key] = child.identifier.value
            data[hook].push(accessor.reverseMapping(obj))
          } else if (child.identifier === null) {
            // If endpoint has no identifier, add the whole child, and not only props
            data[hook].push(accessor.reverseMapping(child.props()))
          }
        })
      }
      // Handle delete
      if (options.delete) {
        let hook = (map !== null && typeof map.batch !== 'undefined' && typeof map.batch.delete !== 'undefined') ? map.batch.delete : 'delete'
        data[hook] = []
        accessor.children.forEach(child => {
          if (child.identifier !== null && child.identifier.value !== null) {
            // If endpoint has identifier only add id to array
            data[hook].push(child.identifier.value)
          } else if (child.identifier === null) {
            // If endpoint has no identifier, add the whole child, and not only props
            data[hook].push(accessor.reverseMapping(child.props()))
          }
        })
      }
      // Handle merge
      if (options.merge) {
        data = Object.assign(
          accessor.removeIdentifiers(
            accessor.reverseMapping(
              accessor.props()
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
          data
        ).then(response => {
          accessor.shared.handleSuccess(response, replace, null, true).then(results => {
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
      apiSlug = accessor.shared.defaultApi,
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
      apiSlug = accessor.shared.defaultApi,
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
      apiSlug = accessor.shared.defaultApi,
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
      apiSlug = accessor.shared.defaultApi,
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
      apiSlug = accessor.shared.defaultApi,
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
      apiSlug = accessor.shared.defaultApi,
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
      apiSlug = accessor.shared.defaultApi,
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
      apiSlug = accessor.shared.defaultApi,
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
      apiSlug = accessor.shared.defaultApi,
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
    accessor.set = (data, change = true, raw = false, updateKey = null, map = accessor.shared.map) => {
      Object.keys(data).forEach(key => {
        let hook = accessor
        let prop = key
        if (!raw) {
          if (!accessor.reserved(prop) && (updateKey === null || prop === updateKey) && hook[prop].value !== data[key].value) {
            hook[prop].value = data[key].value
            hook[prop].changed(change ? data[key].changed() : false)
          }
          if (key === 'invalids') {
            Object.keys(data[key]).forEach(prop => {
              if ((updateKey === null || prop === updateKey) && hook[key][prop].value !== data[key][prop].value) {
                hook[key][prop].value = data[key][prop].value
                hook[key][prop].changed(change ? data[key][prop].changed() : false)
              }
            })
          }
        } else {
          prop = (map !== null && typeof map.props !== 'undefined' && typeof map.props[key] !== 'undefined') ? map.props[key] : key
          if (updateKey === null || prop === updateKey) {
            if (accessor.reserved(prop)) {
              hook = accessor.invalids
            }
            if (typeof hook[prop] !== 'undefined' && hook[prop].value !== data[key]) {
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
        if (!accessor.reserved(key) && keep.indexOf(key) === -1 && accessor[key].value !== null) {
          accessor[key].value = null
          accessor[key].changed(change)
        }
      })
      // Empty invalids
      accessor.invalids = {}
      accessor.children = []
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
    accessor.clone = (change = true) => {
      let clone = new Endpoint(endpoint, controller, accessor.shared.defaultApi, predefined)
      clone.raw = JSON.parse(JSON.stringify(accessor.raw))
      clone.set(accessor, change)
      accessor.children.forEach(child => {
        clone.children.push(child.clone(change))
      })
      return clone
    }

    /**
     * ReverseMapping
     */
    accessor.reverseMapping = (props = accessor.props(), reference = false, map = accessor.shared.map) => {
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
        if (map !== null && typeof map.props !== 'undefined') {
          // Replace keys in props with mappings
          Object.keys(map.props).forEach(key => {
            if (typeof reverse[map.props[key]] !== 'undefined') {
              // @note - If keys in props Collides with mapping, its overwritten
              reverse[key] = reverse[map.props[key]]
              delete reverse[map.props[key]]
            }
          })
        }
      } catch (error) {
        console.error(error)
      }
      return reverse
    }

    /**
     * Remove Identifiers before making request. Takes raw only, not references
     */
    accessor.removeIdentifiers = (props, endpoint = endpoint, map = accessor.shared.map) => {
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
