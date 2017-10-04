import util from './util'
import axios from 'axios'
import qs from 'qs'

/**
 * Requester
 */
export default class Requester {

  constructor (customConf = {}) {

    this.conf = Object.assign({
      addDataToQuery: true,
      dualAuth: false,
      type: 'oauth_1.0a',
      version: '1.0',
      algorithm: 'HMAC-SHA1',
      key: '',
      secret: '',
      token: { key: '', secret: '' },
      nonce: '',
      nonceLength: 6,
      timestampLength: 30,
      indexArrays: true,
      emptyParams: false,
      requester: null,
      base64: true,
      ampersand: true,
      sort: true,
      taleBefore: '', // Queryparams which will be added at the end of url, after all is set, before nonce
      taleNonce: '', // @note: Ex. To use for nonce through cookies: '_wpnonce=wcApiSettings.nonce'
      taleAfter: '', // Queryparams which will be added at the end of url, after all is set, after nonce
      // Conf specific per method type. (Same Options as above)
      get: {},
      post: {},
      put: {},
      patch: {},
      delete: {},
      head: {},
      trace: {},
      connect: {},
      options: {}
    }, customConf)

    this.getConf = Object.assign(this.deepClone(this.conf), this.deepClone(this.conf.get))
    this.postConf = Object.assign(this.deepClone(this.conf), this.deepClone(this.conf.post))
    this.putConf = Object.assign(this.deepClone(this.conf), this.deepClone(this.conf.put))
    this.patchConf = Object.assign(this.deepClone(this.conf), this.deepClone(this.conf.patch))
    this.deleteConf = Object.assign(this.deepClone(this.conf), this.deepClone(this.conf.delete))
    this.headConf = Object.assign(this.deepClone(this.conf), this.deepClone(this.conf.head))
    this.traceConf = Object.assign(this.deepClone(this.conf), this.deepClone(this.conf.trace))
    this.connectConf = Object.assign(this.deepClone(this.conf), this.deepClone(this.conf.connect))
    this.optionsConf = Object.assign(this.deepClone(this.conf), this.deepClone(this.conf.options))

    this.deepClone = (obj = {}) => {
      return JSON.parse(JSON.stringify(obj))
    }

    // READ
    this.get = (
      url,
      data = null,
      upload = false,
      conf = getConf
    ) => {
      return this.custom('GET', url, data, upload, conf)
    }

    // CREATE
    this.post = (
      url,
      data = null,
      upload = false,
      conf = postConf
    ) => {
      return this.custom('POST', url, data, upload, conf)
    }

    // UPDATE / REPLACE
    this.put = (
      url,
      data = null,
      upload = false,
      conf = putConf
    ) => {
      return this.custom('PUT', url, data, upload, conf)
    }

    // UPDATE / MODIFY
    this.patch = (
      url,
      data = null,
      upload = false,
      conf = patchConf
    ) => {
      return this.custom('PATCH', url, data, upload, conf)
    }

    // DELETE
    this.delete = (
      url,
      data = null,
      upload = false,
      conf = deleteConf
    ) => {
      return this.custom('DELETE', url, data, upload, conf)
    }

    // GET HEADERS ONLY / NO CONTENT
    this.head = (
      url,
      data = null,
      upload = false,
      conf = headConf
    ) => {
      return this.custom('HEAD', url, data, upload, conf)
    }

    // GET ADDITIONS / CHANGES
    this.trace = (
      url,
      data = null,
      upload = false,
      conf = traceConf
    ) => {
      return this.custom('TRACE', url, data, upload, conf)
    }

    // CONVERT TO TCP / IP TUNNEL
    this.connect = (
      url,
      data = null,
      upload = false,
      conf = connectConf
    ) => {
      return this.custom('CONNECT', url, data, upload, conf)
    }

    // PERMISSION
    this.options = (
      url,
      data = null,
      upload = false,
      conf = optionsConf
    ) => {
      return this.custom('OPTIONS', url, data, upload, conf)
    }

    this.custom = (
      method,
      url,
      data = null,
      upload = false,
      conf = this.conf
    ) => {
      let abort
      let abortPromise = new Promise((resolve) => {
        abort = resolve
      })
      let request = this.request(method, url, abortPromise, data, upload, conf)
      request.abort = abort
      return request
    }

    this.request = (
      method,
      url,
      abortPromise,
      data = null,
      upload = false,
      conf = this.conf
    ) => {
      let request = {
        url: url,
        method: method
      }
      conf = JSON.parse(JSON.stringify(conf))
      let indexArrays = conf.indexArrays
      let addDataToQuery = conf.addDataToQuery

      if (data !== null) {
        if (upload) {
          request = this.makeUpload(request, data, indexArrays, conf)
        } else if (addDataToQuery) {
          request = this.makeDataQuery(request, data, indexArrays)
        } else {
          request = this.makeData(request, data, indexArrays, conf)
        }
      }

      request = this.makeTale(request, abortPromise)
      request = this.makeAbortable(request, abortPromise)

      return axios(request)
    }

    this.makeDataQuery = (request, data, indexArrays = true) => {
      if (request.url.indexOf('?') !== -1) {
        request.url += '&' + qs.stringify(JSON.parse(data))
      } else {
        request.url += '?' + qs.stringify(JSON.parse(data))
      }
      if (indexArrays) {
        request.url = util.indexArrayQuery(request.url)
      }
      request.headers['Accept'] = 'application/json'
      request.headers['Content-Type'] = 'text/plain'
      return request
    }

    this.makeData = (request, data, indexArrays = true, conf = this.conf) => {
      let config = JSON.parse(JSON.stringify(conf))
      config.url = request.url
      config.method = request.method
      config.indexArrays = indexArrays
      request.headers['Content-Type'] = 'application/json'
      request.data = data
      return request
    }

    this.makeUpload = (request, data, indexArrays = true, conf = this.conf) => {
      request = this.makeData(request, data, indexArrays, conf)
      request.headers['Content-Type'] = 'application/x-www-form-urlencoded'
      return request
    }

    this.makeTale = (request, conf = this.conf) => {
      if (conf.taleBefore !== '') {
        if (request.url.indexOf('?') === -1) {
          request.url += '?' + conf.taleBefore
        } else {
          request.url += '&' + conf.taleBefore
        }
      }
      // Set nonce based on localized object / var
      if (conf.taleNonce !== '') {
        let query = conf.taleNonce.split('=')
        if (query.length === 2) {
          let param = query[0]
          let hook = query[1]
          if (param.length > 0) {
            try {
              let nonce = String(eval(hook))
              if (request.url.indexOf('?') === -1) {
                request.url += '?' + param + '=' + nonce
              } else {
                request.url += '&' + param + '=' + nonce
              }
            } catch (e) {}
          }
        }
      }
      if (conf.taleAfter !== '') {
        if (request.url.indexOf('?') === -1) {
          request.url += '?' + conf.taleAfter
        } else {
          request.url += '&' + conf.taleAfter
        }
      }
      return request
    }

    this.makeAbortable = (request, promise) => {
      let cancel
      request.cancelToken = new CancelToken(function executor(c) {
        cancel = c
      })
      promise.then(() => {
        cancel()
      })
      return request
    }

  }

}
