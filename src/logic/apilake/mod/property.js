/**
 * Property
 */
export default class Property {
  constructor (apis, model, property, type, val = null, locked = false) {
    let prop = this
    this.value = JSON.parse(JSON.stringify(val))

    this.changed = function (changed = null) {
      if (changed !== null && !changed) {
        val = prop.cloneVal()
      } else if (changed !== null && changed) {
        val = this.value !== null ? null : 0
      }
      if (typeof prop.value !== 'undefined') {
        return (JSON.stringify(prop.value) !== JSON.stringify(val))
      } else {
        return false
      }
    }

    this.loading = false
    this.loaders = 0

    let abortFetch
    let abortFetchPromise = new Promise(function (resolve) {
      abortFetch = resolve
    })
    let abortSave
    let abortSavePromise = new Promise(function (resolve) {
      abortSave = resolve
    })

    this.save = function (api = null, force = false) {
      // Secure one fetch request at a time
      abortSave()
      abortSavePromise = new Promise(function (resolve) {
        abortSave = resolve
      })
      prop.loaders++
      prop.checkLoading()
      return new Promise(function (resolve, reject) {
        if (property.length > 0 && (prop.changed() || force) && typeof prop.value !== 'undefined') {
          if (model.id.value !== null) {
            apis.save(model, property, api, abortSavePromise).take(1).subscribe(response => {
              try {
                response = JSON.parse(JSON.stringify(response).replace(/\\n/g, ''))
              } catch (e) {
                if (typeof response === 'string') {
                  response = response.replace(/\\n/g, '')
                }
              }
              val = response
              prop.value = prop.cloneVal(val)
              model._success.next('property_saved')
              prop.loaders--
              prop.checkLoading()
              resolve()
            }, error => {
              prop.loaders--
              prop.checkLoading()
              reject(error)
            })
          } else {
            model.save().then(() => {
              prop.loaders--
              prop.checkLoading()
              resolve()
            }).catch(error => {
              prop.loaders--
              prop.checkLoading()
              reject(error)
            })
          }
        } else {
          prop.loaders--
          prop.checkLoading()
          resolve()
        }
      }).catch(e => {})
    }

    this.fetch = function (api = null) {
      // Secure one fetch request at a time
      abortFetch()
      abortFetchPromise = new Promise(function (resolve) {
        abortFetch = resolve
      })
      prop.loaders++
      prop.checkLoading()
      return new Promise(function (resolve, reject) {
        if (property.length > 0) {
          apis.fetch(model, property, api, abortFetchPromise).take(1).subscribe(response => {
            try {
              response = JSON.parse(JSON.stringify(response).replace(/\\n/g, ''))
            } catch (e) {
              if (typeof response === 'string') {
                response = response.replace(/\\n/g, '')
              }
            }
            val = response
            prop.value = prop.cloneVal(val)
            model._success.next('property_fetched')
            prop.loaders--
            prop.checkLoading()
            resolve()
          }, () => {
            prop.loaders--
            prop.checkLoading()
            reject()
          })
        } else {
          prop.loaders--
          prop.checkLoading()
          resolve()
        }
      }).catch(e => {})
    }

    this.cloneVal = function (clone = prop.value) {
      try {
        clone = JSON.parse(JSON.stringify(clone))
      } catch (e) {
        if (typeof clone !== 'undefined' && clone !== null) {
          clone = prop.value.clone()
        }
      }
      return clone
    }

    this.checkLoading = function () {
      this.loaders = this.loaders < 0 ? 0 : this.loaders
      this.loading = this.loaders > 0
      return this.loading
    }

    this.type = function () {
      return type
    }

    this.locked = function (l = locked) {
      locked = l
      return locked
    }
  }
}
