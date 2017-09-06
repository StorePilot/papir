import Property from './property'

/**
 * Model
 */
export default class Model {

  constructor (apis, type, properties, id = null, parentId = null) {
    let model = this
    this._type = type
    this._success = new Rx.ReplaySubject()
    this._error = new Rx.ReplaySubject()

    this.props = this.properties = properties
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
    let abortCreate
    let abortCreatePromise = new Promise(function (resolve) {
      abortCreate = resolve
    })
    let abortRemove
    let abortRemovePromise = new Promise(function (resolve) {
      abortRemove = resolve
    })

    this.f = this.fetch = function (api = null) {
      // Secure one fetch request at a time
      abortFetch()
      abortFetchPromise = new Promise(function (resolve) {
        abortFetch = resolve
      })
      model.loaders++
      model.checkLoading()
      return new Promise((resolve, reject) => {
        if (model['id'].value !== null) {
          apis.fetch(model, null, api, abortFetchPromise).take(1).subscribe(response => {
            model._success.next('model_fetched')
            model.set(response, true)
            model.loaders--
            model.checkLoading()
            resolve(model)
          }, error => {
            model._error.next('model_unexpected_error')
            model.loaders--
            model.checkLoading()
            reject(error)
          })
        } else if (model['parent_id'].value !== null) {
          apis.fetch(model, null, api, abortFetchPromise).take(1).subscribe(response => {
            model._success.next('model_fetched')
            model.set(response, true)
            model.loaders--
            model.checkLoading()
            resolve(model)
          }, error => {
            model._error.next('model_unexpected_error')
            model.loaders--
            model.checkLoading()
            reject(error)
          })
        } else {
          model._error.next('model_id_missing')
          model.loaders--
          model.checkLoading()
          reject('model_id_missing')
        }
      }).catch(e => {})
    }

    this.s = this.save = function (api = null) {
      // Secure one save request at a time
      abortSave()
      abortSavePromise = new Promise(function (resolve) {
        abortSave = resolve
      })
      model.loaders++
      model.checkLoading()
      return new Promise((resolve, reject) => {
        if (model['id'].value !== null) {
          if (typeof model['meta_data'] !== 'undefined') {
            model['meta_data'].value.forEach(meta => {
              if (meta.key === 'sp_batch_create_id') {
                meta.key = null
                meta.value = null
              }
            })
          }
          apis.save(model, null, api, abortSavePromise).take(1).subscribe(response => {
            model._success.next('model_saved')
            model.set(response, true)
            model.loaders--
            model.checkLoading()
            resolve(model)
          }, error => {
            model._error.next('model_unexpected_error')
            model.loaders--
            model.checkLoading()
            reject(error)
          })
        } else {
          model.create(api).then(model => {
            model.loaders--
            model.checkLoading()
            resolve(model)
          }).catch(error => {
            model.loaders--
            model.checkLoading()
            reject(error)
          })
        }
      }).catch(e => {})
    }

    this.cr = this.create = function (api = null) {
      // Secure one create request at a time
      abortCreate()
      abortCreatePromise = new Promise(function (resolve) {
        abortCreate = resolve
      })
      model.loaders++
      model.checkLoading()
      return new Promise((resolve, reject) => {
        apis.create(model, api, abortCreatePromise).take(1).subscribe(response => {
          model._success.next('model_created')
          model.set(response, true)
          model.loaders--
          model.checkLoading()
          resolve(model)
        }, error => {
          model._error.next('model_unexpected_error')
          model.loaders--
          model.checkLoading()
          reject(error)
        })
      }).catch(e => {})
    }

    this.r = this.remove = function (force = false, api = null) {
      // Secure one remove request at a time
      abortRemove()
      abortRemovePromise = new Promise(function (resolve) {
        abortRemove = resolve
      })
      model.loaders++
      model.checkLoading()
      return new Promise((resolve, reject) => {
        if (model['id'].value !== null) {
          apis.remove(model, api, force, abortRemovePromise).take(1).subscribe(response => {
            model._success.next('model_deleted')
            model.set(response, true)
            model.loaders--
            model.checkLoading()
            resolve(model)
          }, error => {
            model._error.next('model_unexpected_error')
            model.loaders--
            model.checkLoading()
            reject(error)
          })
        } else {
          model._error.next('model_id_missing')
          model.loaders--
          model.checkLoading()
          reject('model_id_missing')
        }
      }).catch(e => {})
    }

    this.u = this.upload = function (file, api = null) {
      // Do not abort pre upload requests as it could be multiple
      model.loaders++
      model.checkLoading()
      return new Promise((resolve, reject) => {
        apis.upload(model, file, api).take(1).subscribe(response => {
          model._success.next('model_file_uploaded')
          model.set(response, true)
          model.loaders--
          model.checkLoading()
          resolve(model)
        }, error => {
          model._error.next('model_unexpected_error')
          model.loaders--
          model.checkLoading()
          reject(error)
        })
      }).catch(e => {})
    }

    this.c = this.clone = function (changed = true) {
      let clone = new Model(apis, type, properties, id, parentId)
      Object.keys(properties).forEach(function (property) {
        if (typeof model[property].value !== 'undefined' && model[property].value !== null) {
          clone[property].value = model[property].cloneVal()
        }
        if (!changed) {
          clone[property].changed(false)
        } else {
          clone[property].changed(model[property].changed())
        }
        if (property === 'id' || property === 'parent_id') {
          clone[property].changed(false)
        }
      })
      model._success.next('model_cloned')
      return clone
    }

    this.i = this.init = this.clear = function () {
      Object.keys(properties).forEach(function (property) {
        model[property] = new Property(apis, model, property, properties[property])
      })
      model._success.next('model_initialized')
    }

    this.set = function (mod, raw = false) {
      Object.keys(mod).forEach(function (property) {
        if (typeof model[property] !== 'undefined' && typeof model[property].value !== 'undefined') {
          let val = mod[property]
          if (!raw) {
            val = mod[property].value
          }
          try {
            val = JSON.parse(JSON.stringify(val).replace(/\\n/g, ''))
          } catch (e) {
            if (typeof val === 'string') {
              val = val.replace(/\\n/g, '')
            }
          }
          model[property].value = val
          model[property].changed(false)
        }
      })
      return model
    }

    this.changes = function () {
      let changes = []
      Object.keys(properties).forEach(function (property) {
        if (typeof model[property] !== 'undefined' && typeof model[property].value !== 'undefined' && model[property].changed()) {
          changes.push(property)
        }
      })
      return changes
    }

    this.checkLoading = function () {
      this.loaders = this.loaders < 0 ? 0 : this.loaders
      this.loading = this.loaders > 0
      return this.loading
    }

    this.init()
    if (id !== null) {
      model.id.value = id
    }
    if (parentId !== null) {
      model.parent_id.value = parentId
    }
  }
}
