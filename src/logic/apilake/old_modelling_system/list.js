import Query from './query'

/**
 * List
 */
export default class List {

  constructor (apis, model) {
    let list = this
    this._success = new Rx.ReplaySubject()
    this._error = new Rx.ReplaySubject()

    this.loading = false
    this.loaders = 0

    this.p = this.pages = 0
    this.t = this.total = 0
    this.m = this.models = []
    this.model = model

    let abortFetch
    let abortFetchPromise = new Promise(function (resolve) {
      abortFetch = resolve
    })

    this.q = this.query = function (clear = true, api = null) {
      return new Query(this, apis, model, clear, api)
    }

    this.f = this.fetch = function (queryString, clear = true, api = null) {
      // Secure one fetch request at a time
      abortFetch()
      abortFetchPromise = new Promise(function (resolve) {
        abortFetch = resolve
      })
      this.loaders++
      this.checkLoading()
      return new Promise((resolve, reject) => {
        apis.query(model, queryString, api, abortFetchPromise).take(1).subscribe(response => {
          list._success.next('models_fetched')
          if (clear) {
            list.set(response, true)
          } else {
            list.add(response, true)
          }
          list.loaders--
          list.checkLoading()
          resolve(list)
        }, error => {
          list._error.next('models_unexpected_error')
          list.loaders--
          list.checkLoading()
          reject(error)
        })
      }).catch(e => {})
    }

    this.s = this.save = function (api = null) {
      this.loaders++
      this.checkLoading()
      let update = {
        save: [],
        create: []
      }
      this.models.forEach(m => {
        if (m['id'].value !== null) {
          if (typeof m['meta_data'] !== 'undefined') {
            m['meta_data'].value.forEach(meta => {
              if (meta.key === 'sp_batch_create_id') {
                meta.key = null
                meta.value = null
              }
            })
          }
          update.save.push(m)
        } else {
          if (typeof m['meta_data'] !== 'undefined') {
            if (m['meta_data'].value !== null) {
              m['meta_data'].value.push({
                key: 'sp_batch_create_id',
                value: Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 15)
              })
            } else {
              m['meta_data'].value = [{
                key: 'sp_batch_create_id',
                value: Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 15)
              }]
            }
          }
          update.create.push(m)
        }
      })
      return new Promise((resolve, reject) => {
        list.batch(update, api).then(() => {
          list._success.next('list_updated')
          list.loaders--
          list.checkLoading()
          resolve(list)
        }).catch(error => {
          list.loaders--
          list.checkLoading()
          reject(error)
        })
      }).catch(e => {})
    }

    this.r = this.remove = function (api = null) {
      list.loaders++
      list.checkLoading()
      let update = {
        remove: []
      }
      this.models.forEach(m => {
        if (m['id'].value !== null) {
          update.remove.push(m['id'].value)
        }
      })
      return new Promise((resolve, reject) => {
        list.batch(update, api).then(() => {
          list._success.next('list_removed')
          list.clear()
          list.loaders--
          list.checkLoading()
          resolve(list)
        }).catch(error => {
          list.loaders--
          list.checkLoading()
          reject(error)
        })
      }).catch(e => {})
    }

    this.b = this.batch = function (update, api = null) {
      // Do not abort pre batch requests as it could be different models
      list.loaders++
      list.checkLoading()
      return new Promise((resolve, reject) => {
        apis.batch(model, update, api).then(response => {
          list._success.next('list_processed')
          list.update(response).then(() => {
            list.loaders--
            list.checkLoading()
            resolve(list)
          }).catch(error => {
            list.loaders--
            list.checkLoading()
            reject(error)
          })
        }).catch(error => {
          list._error.next('list_unexpected_error')
          list.loaders--
          list.checkLoading()
          reject(error)
        })
      }).catch(e => {})
    }

    this.c = this.clone = function () {
      let clone = new List(apis, model)
      this.models.forEach(m => {
        let c = m.clone()
        clone.models.push(c)
      })
      model._success.next('list_cloned')
      return clone
    }

    this.i = this.init = this.clear = function () {
      this.models = []
      this.p = this.pages = 0
      this.t = this.total = 0
      list._success.next('list_initialized')
    }

    this.set = function (response, raw = false) {
      this.clear()
      list._success.next('list_set')
      this.add(response, raw)
    }

    this.update = function (response) {
      return new Promise(function (resolve, reject) {
        let succeeded = []
        let failed = []
        response.models.forEach(raw => {
          if (typeof raw.error !== 'undefined') {
            failed.push(raw.error)
          } else {
            succeeded.push(list.exchange(raw, true))
          }
        })
        if (failed.length === 0) {
          resolve(succeeded)
        } else {
          reject({
            success: succeeded,
            error: failed
          })
        }
        list._success.next('list_updated_models')
      }).catch(e => {})
    }

    this.exchange = function (mod, raw = false, safe = true) {
      let exchange = model.clone()
      if (raw) {
        exchange.set(mod, true)
      } else {
        exchange.set(mod)
      }
      let match = exchange // No match yet
      let found = false
      let highestEquals = 0
      this.models.forEach(m => {
        if (typeof m.id !== 'undefined' && m.id.value !== null && m.id.value === exchange.id.value) {
          found = true
          m.set(mod, raw)
          if (typeof m['parent_id'] !== 'undefined') {
            m.parent_id.changed(false)
          }
          list._success.next('list_model_exchanged')
          match = m
        } else {
          let equals = list.equals(m, exchange)
          if (equals > highestEquals) {
            highestEquals = equals
          }
        }
      })
      if (!found) {
        if (typeof exchange['meta_data'] !== 'undefined' && exchange['meta_data'].value !== null) {
          let id = null
          exchange['meta_data'].value.forEach(meta => {
            if (meta.key === 'sp_batch_create_id') {
              id = meta.value
            }
          })
          if (id !== null) {
            this.models.forEach(m => {
              if (typeof m['meta_data'] !== 'undefined' && m['meta_data'].value !== null) {
                m['meta_data'].value.forEach(meta => {
                  if (meta.key === 'sp_batch_create_id' && meta.value === id) {
                    found = true
                    meta.key = null
                    meta.value = null
                    m.set(mod, raw)
                    if (typeof m['parent_id'] !== 'undefined') {
                      m.parent_id.changed(false)
                    }
                    match = m
                  }
                })
              }
            })
          }
        }
      }
      if (!found && !safe && highestEquals !== 0) {
        this.models.forEach(m => {
          if (m.id.value === null) {
            let equals = list.equals(m, exchange)
            if (equals === highestEquals && !found) {
              found = true
              m.set(mod, raw)
              if (typeof m['parent_id'] !== 'undefined') {
                m.parent_id.changed(false)
              }
              match = m
            }
          }
        })
      }
      return match
    }

    // Returns equality from 0 to 1 where 1 is exact clone and 0 is not equal at all
    this.equals = function (mod1, mod2) {
      let equals = 0
      Object.keys(mod1.props).forEach(function (prop) {
        if (mod1[prop].changed()) {
          let val1
          let val2
          try {
            val1 = JSON.stringify(mod1[prop].value)
          } catch (e) {
            val1 = mod1[prop].value
          }
          try {
            val2 = JSON.stringify(mod2[prop].value)
          } catch (e) {
            val2 = mod2[prop].value
          }
          if (val1 === val2) {
            equals++
          }
        }
      })
      return equals
    }

    this.sort = function (property = 'menu_order') {
      let compare = function (a, b) {
        if (a[property].value < b[property].value) {
          return -1
        } else if (a[property].value > b[property].value) {
          return 1
        }
        return 0
      }
      this.models.sort(compare)
    }

    this.add = function (response, raw = false) {
      response.models.forEach(m => {
        let clone = model.clone()
        if (raw) {
          clone.set(m, true)
        } else {
          clone.set(m)
        }
        list.models.push(clone)
      })
      this.p = this.pages = response.pages
      this.t = this.total = response.total
      list._success.next('list_added_models')
    }

    this.checkLoading = function () {
      this.loaders = this.loaders < 0 ? 0 : this.loaders
      this.loading = this.loaders > 0
      return this.loading
    }

    this.init()
  }
}
