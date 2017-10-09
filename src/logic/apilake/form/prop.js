/**
 * Prop
 */
export default class Prop {
  constructor (shared, key, value) {

    /**
     * Public Scope
     */
    let accessor = this

    /**
     * Public Variables
     */
    accessor.value = JSON.parse(JSON.stringify(value))
    accessor.loading = false
    accessor.loaders = 0

    /**
     * Private methods
     */
    
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
     * @args Custom arguments as object (key: value)
     * @replace replace all properties in endpoint from response
     * @create Attempt to create if save fails (Ex.: if no id provided to endpoint)
     */
    accessor.save = (apiSlug = apiSlug, args = null, replace = true, create = true) => {
      let obj = {}
      obj[key] = accessor.value
      return new Promise((resolve, reject) => {
        let loadSlug = 'save'
        startLoader(loadSlug)
        shared.makeRequest(
          loadSlug,
          'PUT',
          apiSlug,
          args,
          accessor.removeIdentifiers(
            accessor.reverseMapping(obj)
          )
        ).then(response => {
          shared.handleSuccess(response, replace, key).then(results => {
            stopLoader(loadSlug)
            resolve(results)
          }).catch(error => {
            stopLoader(loadSlug)
            reject(error)
          })
        }).catch(error => {
          // If could not save, try create and update all properties
          if (create) {
            shared.accessor.create(apiSlug, args, replace).then(() => {
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
      }).catch(error => {})
    }

    accessor.fetch = (apiSlug = apiSlug, args = null, replace = true) => {
      return new Promise((resolve, reject) => {
        let loadSlug = 'fetch'
        startLoader(loadSlug)
        shared.makeRequest(
          loadSlug,
          'GET',
          apiSlug,
          args
        ).then(response => {
          shared.handleSuccess(response, replace, key).then(results => {
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

    this.clone = (clone = accessor.value) => {
      let clone = new Prop(shared, key, value)
      try {
        clone.value = JSON.parse(JSON.stringify(accessor.value))
      } catch (error) {
        console.error(error)
      }
      return clone
    }

  }
}
