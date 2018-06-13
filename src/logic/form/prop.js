import { clone } from '../services/util'
/**
 * Prop
 */
export default class Prop {
  constructor (parent = null, key = null, value = null, config = {}, transpiler = null) {
    /**
     * Public Scope
     */
    let accessor = this

    accessor.parent = parent

    /**
     * Public Variables
     */
    try {
      accessor.value = clone({}, value)
    } catch (e) {
      try {
        accessor.value = value.clone()
      } catch (e) {
        accessor.value = value
      }
    }
    accessor.transpiler = transpiler
    // Default Config (config level 0 - greater is stronger)
    accessor.config = {
      emptyArrayToZero: false,
      keepArrayTags: true
    }
    if (parent !== null) {
      accessor.config = Object.assign(accessor.config, parent.shared.config)
    }
    if (key.constructor === Object) {
      if (typeof key.config !== 'undefined') {
        // Mapped Config (config level 1 - greater is stronger)
        accessor.config = Object.assign(accessor.config, key.config)
      }
      if (typeof key.key !== 'undefined') {
        accessor.key = key.key
      } else {
        accessor.key = key
        console.error('Property is missing key', accessor)
      }
    }
    // Custom Config (config level 2 - greater is stronger)
    accessor.config = Object.assign(accessor.config, config)
    accessor.key = key
    accessor.loading = false
    accessor.loaders = []
    accessor.raw = null

    /**
     * Private methods
     * ---------------
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
     * Public methods
     */

    /**
     * Check if prop is changed
     */
    accessor.changed = (changed = null) => {
      let isChanged = false
      if (changed !== null && !changed) {
        try {
          value = JSON.parse(JSON.stringify(accessor.value))
        } catch (e) {
          try {
            value = accessor.value.clone()
          } catch (e) {
            value = accessor.value
          }
        }
      } else if (changed !== null && changed) {
        value = accessor.value !== null ? null : 0
      }
      if (typeof accessor.value !== 'undefined' && accessor.value !== null && value !== null) {
        if (accessor.value.constructor === value.constructor) {
          if (accessor.value.constructor === Array) {
            if (accessor.value.length !== value.length) {
              isChanged = true
            } else {
              isChanged = JSON.stringify(accessor.value) !== JSON.stringify(value)
            }
          } else {
            isChanged = JSON.stringify(accessor.value) !== JSON.stringify(value)
          }
        } else {
          isChanged = true
        }
      } else {
        isChanged = (typeof accessor.value !== typeof value || accessor.value !== value)
      }
      return isChanged
    }

    /**
     * Request Save @note - Saves only this property
     * @apiSlug Use custom api by slug
     * @args Custom arguments as array [{key: '', value: ''}]
     * @replace replace all properties in endpoint from response
     * @create Attempt to create if save fails (Ex.: if no id provided to endpoint)
     */
    accessor.save = (apiSlug = parent.shared.defaultApi, args = null, replace = true, create = true, perform = true) => {
      let obj = {}
      obj[key] = accessor.apiValue()
      return new Promise((resolve, reject) => {
        if (parent !== null) {
          let loadSlug = 'save'
          startLoader(loadSlug)
          parent.shared.makeRequest(
            loadSlug,
            'PUT',
            apiSlug,
            args,
            parent.shared.accessor.removeIdentifiers(
              parent.shared.accessor.reverseMapping(obj)
            ),
            false,
            {
              perform: perform
            }
          ).then(response => {
            accessor.raw = response
            parent.shared.handleSuccess(response, replace, key).then(results => {
              stopLoader(loadSlug)
              resolve(accessor)
            }).catch(error => {
              stopLoader(loadSlug)
              reject(error)
            })
          }).catch(error => {
            accessor.raw = error
            // If could not save, try create and update all properties
            if (create) {
              parent.shared.accessor.create(apiSlug, args, replace).then(() => {
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
        } else {
          reject('Missing Endpoint')
        }
      }).catch(error => {
        console.error(error)
      })
    }

    accessor.fetch = (apiSlug = parent.shared.defaultApi, args = null, replace = true, perform = true) => {
      return new Promise((resolve, reject) => {
        if (parent !== null) {
          let loadSlug = 'fetch'
          startLoader(loadSlug)
          parent.shared.makeRequest(
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
            accessor.raw = response
            parent.shared.handleSuccess(response, replace, key).then(results => {
              stopLoader(loadSlug)
              resolve(accessor)
            }).catch(error => {
              stopLoader(loadSlug)
              reject(error)
            })
          }).catch(error => {
            accessor.raw = error
            stopLoader(loadSlug)
            reject(error)
          })
        } else {
          reject('Missing Endpoint')
        }
      }).catch(error => {
        console.error(error)
      })
    }

    /**
     * Returns value ready to be posted to API with configurations applied
     */
    accessor.apiValue = () => {
      if (accessor.transpiler !== null) {
        return accessor.transpiler(accessor)
      } else if (
        (accessor.value === null || typeof accessor.value === 'undefined' || (accessor.value.constructor === Array && accessor.value.length === 0)) &&
        accessor.config.emptyArrayToZero
      ) {
        return 0
      } else {
        return accessor.value
      }
    }

    /**
     * Clones the Property
     */
    accessor.clone = () => {
      let cl = new Prop(parent, accessor.key, accessor.value, accessor.config, accessor.transpiler)
      try {
        cl.value = clone({}, accessor.value)
      } catch (error) {
        console.error(error)
      }
      return cl
    }
  }
}
