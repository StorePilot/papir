import Oauth from '../auth/oauth'

/**
 * Form
 */
export default class Form {

  constructor () {
    let me = this
    let defaultApiId = null

    // Supported APIS - First is default
    this.apis = {
      'woocommerce_v2': new WoocommerceV2(),
      'woocommerce_sp_v1': new WoocommerceSPV1()
    }
    // Authorized APIS
    this.permitted = {}

    // Message Observables
    this._success = new Rx.ReplaySubject()
    this._error = new Rx.ReplaySubject()

    // Get / Set default Api id
    this.defaultApiId = function (id = null) {
      if (id !== null) {
        defaultApiId = id
      }
      return defaultApiId
    }

    /**
     * Common Methods for all APIS
     */

    // Authorization handler
    this.authorize = function (api = Object.keys(me.apis)[0], id = null, url = '', key = '', secret = '', defaultApi = false) {
      let promise = new Promise(function (resolve, reject) {
        id = (id === null) ? defaultApiId : id
        if (id !== null) {
          // If no previous default apis is set, this will be default
          if (defaultApiId === null || defaultApi) {
            defaultApiId = id
          }
          // Find url and auth credentials
          let localUrl = localStorage.getItem('storepilot.' + id + '.url')
          url = (url !== '') ? url : ((localUrl !== null) ? localUrl : document.referrer)
          let server = document.createElement('a')
          server.setAttribute('href', url)
          let client = window.location
          if (server.protocol !== client.protocol || server.hostname !== client.hostname || server.port !== client.port) {
            let localKey = localStorage.getItem('storepilot.' + id + '.key')
            let localSecret = localStorage.getItem('storepilot.' + id + '.secret')
            key = (key !== '') ? key : ((localKey !== null) ? localKey : '')
            secret = (secret !== '') ? secret : ((localSecret !== null) ? localSecret : '')
          }
          if (typeof me.apis[api] === 'undefined') {
            me._error.next({
              type: 'api_not_supported',
              api: api,
              id: id,
              message: 'Api \'' + api + '\' not supported'
            })
            reject()
          } else {
            // Find authentication method and type
            let auth = null
            switch (me.apis[api].authorization.method) {
              case 'oauth_1_a':
                switch (me.apis[api].authorization.type) {
                  case 'one_legged':
                    auth = new OAuthOneA(url, key, secret, me.apis[api].base)
                    break
                }
                break
            }
            // Test connection if authentication type is supported
            if (auth !== null) {
              auth.getRequest().subscribe(() => {
                // If success
                localStorage.setItem('storepilot.' + id + '.url', url)
                localStorage.setItem('storepilot.' + id + '.key', key)
                localStorage.setItem('storepilot.' + id + '.secret', secret)
                me.permitted[id] = {
                  api: auth,
                  models: me.apis[api].models,
                  methods: me.apis[api].methods
                }
                me._success.next({
                  type: 'api_approved',
                  api: api,
                  id: id,
                  message: 'API \'' + api + '\' Approved as \'' + id + '\''
                })
                resolve()
              }, error => {
                // If failure
                me._error.next({
                  type: 'api_authentication_failed',
                  api: api,
                  id: id,
                  message: error
                })
                reject()
              })
            } else {
              me._error.next({
                type: 'api_authorization_not_supported',
                api: api,
                id: id,
                message: 'Authorization method required by API \'' + api + '\' is not supported'
              })
              reject()
            }
          }
        } else {
          me._error.next({
            type: 'api_id_not_found',
            api: api,
            id: id,
            message: 'No API id provided and default API id not set'
          })
          reject()
        }
      })
      return promise
    }

    /**
     * @todo
     * Make override optional
     * Add success and error messages
     */

    // Fetch model / property at identified API endpoint and pass it back to model / property
    this.fetch = function (model, property = null, id = null, abort = new Promise(function () {})) {
      id = (id === null) ? defaultApiId : id
      let api = this.permitted[id].api
      let endpointModel = this.permitted[id].models[model._type]
      let endpoint = endpointModel.endpoint
      if (endpoint.indexOf('{/id}') !== -1 || endpoint.indexOf('{id}') !== -1) {
        if (model.id.value !== null) {
          endpoint = endpoint.replace('{id}', model.id.value).replace('{/id}', '/' + model.id.value)
        } else {
          endpoint = endpoint.replace('{id}', '').replace('{/id}', '')
        }
      }
      if (endpoint.indexOf('{/slug}') !== -1 || endpoint.indexOf('{slug}') !== -1) {
        endpoint = endpoint.replace('{slug}', model.slug.value).replace('{/slug}', '/' + model.slug.value)
      }
      if (endpoint.indexOf('{parent_id}') !== -1) {
        endpoint = endpoint.replace('{parent_id}', model.parent_id.value)
      }
      if (property === null) {
        return api.getRequest(endpoint, true, 'GET', abort).map(response => me.toModel(response.body, model, id))
      } else {
        return api.getRequest(endpoint, true, 'GET', abort).map(response => response.body[endpointModel.mappings[property]])
      }
    }

    // Query models at identified API endpoint and pass it back to list
    this.query = function (model, queryString = '', id = null, abort = new Promise(function () {})) {
      id = (id === null) ? defaultApiId : id
      let api = this.permitted[id].api
      let endpointModel = this.permitted[id].models[model._type]
      let endpoint = endpointModel.endpoint
      if (endpoint.indexOf('{/id}') !== -1 || endpoint.indexOf('{id}') !== -1) {
        endpoint = endpoint.replace('{id}', '').replace('{/id}', '')
      }
      if (endpoint.indexOf('{/slug}') !== -1 || endpoint.indexOf('{slug}') !== -1) {
        endpoint = endpoint.replace('{slug}', '').replace('{/slug}', '')
      }
      if (endpoint.indexOf('{parent_id}') !== -1) {
        endpoint = endpoint.replace('{parent_id}', model.parent_id.value)
      }
      return api.getRequest(endpoint + queryString, true, 'GET', abort).map(response => {
        let results = []
        response.body.forEach(raw => {
          results.push(me.toModel(raw, model, id))
        })
        return {
          models: results,
          total: response.response.getResponseHeader(endpointModel.query_mappings.totalHeader),
          pages: response.response.getResponseHeader(endpointModel.query_mappings.pagesHeader)
        }
      })
    }

    // Create model at identified API endpoint and pass it back to model
    this.create = function (model, id = null, abort = new Promise(function () {})) {
      id = (id === null) ? defaultApiId : id
      let api = this.permitted[id].api
      let endpointModel = this.permitted[id].models[model._type]
      let data = {}
      let endpoint = endpointModel.endpoint
      if (endpoint.indexOf('{/id}') !== -1 || endpoint.indexOf('{id}') !== -1) {
        endpoint = endpoint.replace('{id}', '').replace('{/id}', '')
      }
      if (endpoint.indexOf('{/slug}') !== -1 || endpoint.indexOf('{slug}') !== -1) {
        endpoint = endpoint.replace('{slug}', '').replace('{/slug}', '')
      }
      if (endpoint.indexOf('{parent_id}') !== -1) {
        endpoint = endpoint.replace('{parent_id}', model.parent_id.value)
      }
      data = this.toEndpoint(model, false, id)
      // @todo - Fix that data === null is supported
      return api.postRequest(endpoint, JSON.stringify(data), true, false, 'POST', abort).map(response => me.toModel(response.body, model, id))
    }

    // Save model / property at identified API endpoint and pass it back to model / property
    this.save = function (model, property = null, id = null, abort = new Promise(function () {})) {
      id = (id === null) ? defaultApiId : id
      let api = this.permitted[id].api
      let endpointModel = this.permitted[id].models[model._type]
      let data = {}
      let endpoint = endpointModel.endpoint
      if (endpoint.indexOf('{/id}') !== -1 || endpoint.indexOf('{id}') !== -1) {
        endpoint = endpoint.replace('{id}', model.id.value).replace('{/id}', '/' + model.id.value)
      }
      if (endpoint.indexOf('{/slug}') !== -1 || endpoint.indexOf('{slug}') !== -1) {
        endpoint = endpoint.replace('{slug}', model.slug.value).replace('{/slug}', '/' + model.slug.value)
      }
      if (endpoint.indexOf('{parent_id}') !== -1) {
        endpoint = endpoint.replace('{parent_id}', model.parent_id.value)
      }
      if (property === null) {
        data = this.toEndpoint(model, false, id)
        return api.putRequest(endpoint, JSON.stringify(data), true, false, 'POST', abort).map(response => me.toModel(response.body, model, id))
      } else {
        data[endpointModel.mappings[property]] = model[property].value
        return api.putRequest(endpoint, JSON.stringify(data), true, false, 'POST', abort).map(response => response.body[endpointModel.mappings[property]])
      }
    }

    // Delete model at identified API endpoint and pass it back to model
    this.remove = function (model, id = null, force = false, abort = new Promise(function () {})) {
      id = (id === null) ? defaultApiId : id
      let api = this.permitted[id].api
      let endpointModel = this.permitted[id].models[model._type]
      let endpoint = endpointModel.endpoint
      if (endpoint.indexOf('{/id}') !== -1 || endpoint.indexOf('{id}') !== -1) {
        endpoint = endpoint.replace('{id}', model.id.value).replace('{/id}', '/' + model.id.value)
      }
      if (endpoint.indexOf('{/slug}') !== -1 || endpoint.indexOf('{slug}') !== -1) {
        endpoint = endpoint.replace('{slug}', model.slug.value).replace('{/slug}', '/' + model.slug.value)
      }
      if (endpoint.indexOf('{parent_id}') !== -1) {
        endpoint = endpoint.replace('{parent_id}', model.parent_id.value)
      }
      if (force) {
        endpoint += '?' + endpointModel.query_mappings.force + '=true'
      }
      return api.deleteRequest(endpoint, true, 'POST', abort).map(response => me.toModel(response.body, model, id))
    }

    // Upload file to model at identified API endpoint and pass it back to model
    this.upload = function (model, file, id = null, abort = new Promise(function () {})) {
      id = (id === null) ? defaultApiId : id
      let api = this.permitted[id].api
      let endpointModel = this.permitted[id].models[model._type]
      let modelId = (model.id.value !== null && typeof model.id.value !== 'undefined') ? model.id.value : ''
      let modelSlug = (model.slug.value !== null && typeof model.slug.value !== 'undefined') ? model.slug.value : ''
      let endpoint = endpointModel.endpoint
      if (endpoint.indexOf('{/id}') !== -1 || endpoint.indexOf('{id}') !== -1) {
        endpoint = endpoint.replace('{id}', modelId).replace('{/id}', ((modelId === '') ? '' : ('/' + modelId)))
      }
      if (endpoint.indexOf('{/slug}') !== -1 || endpoint.indexOf('{slug}') !== -1) {
        endpoint = endpoint.replace('{slug}', modelSlug).replace('{/slug}', ((modelSlug === '') ? '' : ('/' + modelSlug)))
      }
      if (endpoint.indexOf('{parent_id}') !== -1) {
        endpoint = endpoint.replace('{parent_id}', model.parent_id.value)
      }
      if (modelId !== '' || modelSlug !== '') {
        return api.putRequest(endpoint, file, false, true, 'POST', abort).map(response => me.toModel(response.body, model, id))
      } else {
        return api.postRequest(endpoint, file, false, true, 'POST', abort).map(response => me.toModel(response.body, model, id))
      }
    }

    // Create model at identified API endpoint and pass it back to model
    this.batch = function (model, update, id = null, abort = new Promise(function () {})) {
      id = (id === null) ? defaultApiId : id
      let api = this.permitted[id].api
      let endpointModel = this.permitted[id].models[model._type]
      let endpoint = endpointModel.endpoint.replace('{id}', '').replace('{/id}', '')
      endpoint = endpoint.replace('{slug}', '').replace('{/slug}', '')
      if (endpoint.indexOf('{parent_id}') !== -1) {
        endpoint = endpoint.replace('{parent_id}', model.parent_id.value)
      }
      let path = endpointModel.batch_mappings.path
      let data = {}
      if (typeof update.remove !== 'undefined') {
        data[endpointModel.batch_mappings.remove] = update.remove
      }
      if (typeof update.create !== 'undefined') {
        let create = []
        update.create.forEach(m => {
          m = m.clone()
          delete m.id
          let d = me.toEndpoint(m, true, id)
          if (d !== null) {
            create.push(d)
          }
        })
        data[endpointModel.batch_mappings.create] = create
      }
      if (typeof update.save !== 'undefined') {
        let save = []
        update.save.forEach(m => {
          m = m.clone()
          let d = me.toEndpoint(m, true, id)
          if (d !== null) {
            save.push(d)
          }
        })
        data[endpointModel.batch_mappings.save] = save
      }
      // Split request into multiple requests limited by models limit for batch in apis
      let promise = new Promise(function (resolve, reject) {
        let response = {
          body: {
            create: [],
            save: [],
            remove: []
          }
        }
        let found = 0
        Object.keys(data).forEach(function (key) {
          let requestData = {}
          let count = 0
          let i = 0
          let completed = 0
          let stack = 0
          requestData[key] = []
          data[key].forEach(value => {
            requestData[key].push(value)
            count++
            i++
            found++
            if (count === endpointModel.batch_mappings.limit || i === data[key].length) {
              stack++
              api.postRequest(endpoint + path, JSON.stringify(requestData), true, false, 'POST', abort).take(1).subscribe(res => {
                completed++
                if (typeof res.body[endpointModel.batch_mappings.create] !== 'undefined') {
                  res.body[endpointModel.batch_mappings.create].forEach(raw => {
                    response.body.create.push(raw)
                  })
                }
                if (typeof res.body[endpointModel.batch_mappings.save] !== 'undefined') {
                  res.body[endpointModel.batch_mappings.save].forEach(raw => {
                    response.body.save.push(raw)
                  })
                }
                if (typeof res.body[endpointModel.batch_mappings.remove] !== 'undefined') {
                  res.body[endpointModel.batch_mappings.remove].forEach(raw => {
                    response.body.remove.push(raw)
                  })
                }
                if (completed === stack) {
                  let results = []
                  response.body.create.forEach(raw => {
                    results.push(me.toModel(raw, model, id))
                  })
                  response.body.save.forEach(raw => {
                    results.push(me.toModel(raw, model, id))
                  })
                  resolve({
                    models: results,
                    total: res.response.getResponseHeader(endpointModel.query_mappings.totalHeader),
                    pages: res.response.getResponseHeader(endpointModel.query_mappings.pagesHeader)
                  })
                }
              }, error => {
                reject(error)
              })
              requestData[key] = []
              count = 0
            }
          })
        })
        if (found === 0) {
          resolve({
            models: [],
            total: 0,
            pages: 0
          })
        }
      })
      return promise
    }

    /**
     * MAPPING
     */

    this.toEndpoint = function (model, batch = false, id = null) {
      id = (id === null) ? defaultApiId : id
      let data = null
      let endpointModel = this.permitted[id].models[model._type]
      let i = 0
      let idProp = false
      Object.keys(endpointModel.mappings).forEach(function (property) {
        if ((endpointModel.locked.indexOf(String(property)) === -1 && (model[property].changed() || (typeof model.id !== 'undefined' && model.id.value === null))) || (String(property) === 'id' && batch)) {
          if (
            typeof model[property] !== 'undefined' &&
            model[property].value !== null &&
            typeof model[property].value !== 'undefined' &&
            (model[property].value.constructor !== Array || model[property].value.length !== 0)) {
            if (data === null) {
              data = {}
            }
            data[endpointModel.mappings[property]] = model[property].value
            if (String(property) === 'id' && batch) {
              idProp = true
            }
            i++
          }
        }
      })
      if (i === 1 && idProp) {
        data = null
      }
      return data
    }

    this.toModel = function (raw, model, id = null) {
      if (typeof raw.error !== 'undefined') {
        return raw
      } else {
        id = (id === null) ? defaultApiId : id
        let data = {}
        let endpointModel = this.permitted[id].models[model._type]
        Object.keys(endpointModel.mappings).forEach(function (property) {
          data[property] = raw[endpointModel.mappings[property]]
        })
        return data
      }
    }
  }
}
