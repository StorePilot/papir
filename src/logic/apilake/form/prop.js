/**
 * Prop
 */
export default class Prop {
  constructor (parent, key, value = null) {
    /**
     * Public Scope
     */
    let accessor = this

    /**
     * Public Variables
     */
    accessor.value = JSON.parse(JSON.stringify(value))
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
      if (changed !== null && !changed) {
        try {
          value = JSON.parse(JSON.stringify(accessor.value))
        } catch (error) {
          console.error(error)
        }
      } else if (changed !== null && changed) {
        value = accessor.value !== null ? null : 0
      }
      if (typeof accessor.value !== 'undefined') {
        return JSON.stringify(accessor.value) !== JSON.stringify(value)
      } else {
        return false
      }
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
      obj[key] = accessor.value
      return new Promise((resolve, reject) => {
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
      }).catch(error => {
        console.error(error)
      })
    }

    accessor.fetch = (apiSlug = parent.shared.defaultApi, args = null, replace = true, perform = true) => {
      return new Promise((resolve, reject) => {
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
          console.log(response)
          console.log(replace)
          console.log(key)
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
      }).catch(error => {
        console.error(error)
      })
    }

    this.clone = () => {
      let clone = new Prop(parent, key, value)
      try {
        clone.value = JSON.parse(JSON.stringify(accessor.value))
      } catch (error) {
        console.error(error)
      }
      return clone
    }
  }
}
