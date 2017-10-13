import util from './util'
import { axios, CancelToken } from 'axios'
import qs from 'qs'

/**
 * Requester
 */
export default class Requester {
  constructor (customConf = {}) {
    this.requester = 'default'
    this.conf = {
      addDataToQuery: true,
      dualAuth: false,
      authentication: 'oauth',
      version: '1.0a',
      type: 'one_legged',
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
      responseType: 'json', // options 'arraybuffer', 'blob', 'document', 'json', 'text', 'stream'
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
    }

    this.deepClone = (obj = {}) => {
      return JSON.parse(JSON.stringify(obj))
    }

    this.objMerge = (target, custom) => {
      return Object.assign(this.deepClone(target), custom)
    }

    this.conf = this.objMerge(this.conf, customConf)
    this.getConf = this.objMerge(this.conf, this.conf.get)
    this.postConf = this.objMerge(this.conf, this.conf.post)
    this.putConf = this.objMerge(this.conf, this.conf.put)
    this.patchConf = this.objMerge(this.conf, this.conf.patch)
    this.deleteConf = this.objMerge(this.conf, this.conf.delete)
    this.headConf = this.objMerge(this.conf, this.conf.head)
    this.traceConf = this.objMerge(this.conf, this.conf.trace)
    this.connectConf = this.objMerge(this.conf, this.conf.connect)
    this.optionsConf = this.objMerge(this.conf, this.conf.options)

    // READ
    this.get = (
      url,
      promise,
      data = null,
      upload = false,
      conf = {}
    ) => {
      conf = this.objMerge(this.getConf, conf)
      return this.custom('GET', url, promise, data, upload, conf)
    }

    // CREATE
    this.post = (
      url,
      promise,
      data = null,
      upload = false,
      conf = {}
    ) => {
      conf = this.objMerge(this.postConf, conf)
      return this.custom('POST', url, promise, data, upload, conf)
    }

    // UPDATE / REPLACE
    this.put = (
      url,
      promise,
      data = null,
      upload = false,
      conf = {}
    ) => {
      conf = this.objMerge(this.putConf, conf)
      return this.custom('PUT', url, promise, data, upload, conf)
    }

    // UPDATE / MODIFY
    this.patch = (
      url,
      promise,
      data = null,
      upload = false,
      conf = {}
    ) => {
      conf = this.objMerge(this.patchConf, conf)
      return this.custom('PATCH', url, promise, data, upload, conf)
    }

    // DELETE
    this.delete = (
      url,
      promise,
      data = null,
      upload = false,
      conf = {}
    ) => {
      conf = this.objMerge(this.deleteConf, conf)
      return this.custom('DELETE', url, promise, data, upload, conf)
    }

    // GET HEADERS ONLY / NO CONTENT
    this.head = (
      url,
      promise,
      data = null,
      upload = false,
      conf = {}
    ) => {
      conf = this.objMerge(this.headConf, conf)
      return this.custom('HEAD', url, promise, data, upload, conf)
    }

    // GET ADDITIONS / CHANGES
    this.trace = (
      url,
      promise,
      data = null,
      upload = false,
      conf = {}
    ) => {
      conf = this.objMerge(this.traceConf, conf)
      return this.custom('TRACE', url, promise, data, upload, conf)
    }

    // CONVERT TO TCP / IP TUNNEL
    this.connect = (
      url,
      promise,
      data = null,
      upload = false,
      conf = {}
    ) => {
      conf = this.objMerge(this.connectConf, conf)
      return this.custom('CONNECT', url, promise, data, upload, conf)
    }

    // PERMISSION
    this.options = (
      url,
      promise,
      data = null,
      upload = false,
      conf = {}
    ) => {
      conf = this.objMerge(this.optionsConf, conf)
      return this.custom('OPTIONS', url, promise, data, upload, conf)
    }

    this.custom = (
      method,
      url,
      promise,
      data = null,
      upload = false,
      conf = this.conf
    ) => {
      conf = this.objMerge(this.conf, conf)
      return this.request(method, url, promise, data, upload, conf)
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

      request = this.makeTale(request, conf)
      request = this.makeAbortable(request, abortPromise)
      request.responseType = conf.responseType
      request.transformResponse = (response) => {
        return response
      }

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
              // @warning - eval can be harmful if used server side
              /* eslint-disable */
              let nonce = String(eval(hook))
              /* eslint-enable */
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
      request.cancelToken = new CancelToken(function executor (c) {
        cancel = c
      })
      promise.then(() => {
        cancel()
      })
      return request
    }
  }
}
