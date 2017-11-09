import util from './util'
import axios from 'axios'
import sign from './sign'

/**
 * Requester
 */
export default class Requester {
  constructor (customConf = {}) {
    this.requester = 'default'
    this.conf = {
      responseType: 'json', // ['arraybuffer', 'blob', 'document', 'json', 'text', 'stream']
      headers: {},
      override: {
        arg: '_method', // The query argument to be given actual method
        method: null // The replacement method. (will be fired instead of actual method. Ex.: 'OPTIONS')
      },
      addDataToQuery: true,
      authQuery: true,
      authHeader: false,
      authentication: 'oauth',
      version: '1.0a',
      type: 'one_legged',
      algorithm: 'HMAC-SHA1',
      key: '',
      secret: '',
      token: { key: '', secret: '' },
      nonce: '',
      nonceLength: 6,
      nonceTale: '',
      timestampLength: 30,
      indexArrays: true,
      emptyParams: false,
      requester: null,
      base64: true,
      ampersand: true,
      sort: true,
      // Conf specific per method type. (Same Options as above)
      get: {},
      post: {},
      put: {},
      patch: {},
      delete: {},
      head: {},
      trace: {},
      connect: {},
      options: {},
      perform: true // If false, axios config will be returned instead
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
      /**
       * Correct order of creating a request:
       */
      let request = {}

      // 1. Append protocol (http / https)
      // 2. Append base (://baseurl.com)
      // 3. Append path (/api/v1/users/362)
      // 4.1 Append arguments (?arg1=0&arg2=1)

      request.url = url

      // 4.2 Encode arguments after first divider until second divider.
      // Ex.: ignored?encoded?ignored?ignored
      request.url = util.querystring.encode(request.url, {
        protocol: 'rfc3986',
        divider: '?',
        delimiter: '&',
        splitter: '=',
        encodeNull: true,
        keepEmpty: true,
        encodeNames: true,
        encodeValues: true
      })

      // 5.1 Append data to querystring arguments if required

      if (conf.addDataToQuery && !upload) {
        request.url = this.makeDataQuery(request.url, data, {
          name: null,
          protocol: 'rfc3986',
          encodeNull: true,
          dateFormat: '', // Default ISO 8601
          keepEmpty: true,
          delimiter: '&',
          splitter: '=',
          dotNotation: false,
          encodeNames: true,
          encodeValues: true,
          indexArrays: true,
          excludes: [], // At first level
          includes: [] // At first level. includes overrides excludes
        })
        data = null
      }

      // 5.2. Append index to arrays in querystring if required

      if (conf.indexArrays) {
        request.url = util.querystring.indexArrays(request.url)
      }

      // 6 Sort arguments if required
      let querystring = ''
      let sortable = []
      util.getParams(request.url).forEach(param => {
        sortable.push(param.key + '=' + param.value + '&')
      })
      sortable.sort()
      sortable.forEach(param => {
        querystring += param
      })
      if (querystring !== '') {
        querystring = querystring.slice(0, -1)
        request.url = util.stripUri(request.url) + '?' + querystring
      } else {
        request.url = util.stripUri(request.url)
      }

      // 7. Append data to request

      if (data !== null) {
        request.data = data
      }

      // 8. Append method

      request.method = method

      // 9. Append method override if required

      if (conf.override.method !== null && method !== conf.override.method) {
        request.method = conf.override.method
        request.url += request.url.indexOf('?') === -1 ? '?' : '&'
        request.url += conf.override.arg + '=' + method
      }

      // 10. Append headers

      /**
       * @note - Simple headers which passes preflight:
       * Accept (This should be declared in api config. [what response content does the client accept?]) 'application/json'
       * Accept-Language
       * Content-Language (This should be declared in api config. [what request content does the client send?]) 'application/json'
       * Content-Type [application/x-www-form-urlencoded, multipart/form-data, text/plain] (Others creates preflight)
       * DPR
       * Downlink
       * Save-Data
       * Viewport-Width
       * Width
       * (Other headers creates preflight)
       */

      // Get predefined headers
      request.headers = conf.headers

      // If no data provided, set content-type to text/plain so preflight is avoided
      if (typeof request.data === 'undefined') {
        request.headers['Content-Type'] = 'text/plain'
      }

      // If data provided and it is a upload request, tell the server
      if (upload) {
        // @todo - Could be changed to multipart/form-data for multiupload, multi content later?
        request.headers['Content-Type'] = 'application/x-www-form-urlencoded'
      }

      // 11. Authorize

      if (conf.authentication === 'oauth') {
        // OAUTH

        // 1. Prepare configuration to be signed

        conf.url = request.url
        conf.method = request.method

        // 2. If authentication should be applied to querystring

        if (conf.authQuery) {
          request.url = util.stripUri(request.url) + '?' + sign.gen(conf).string
        }

        // 3. If authentication should be applied to header

        if (conf.authHeader) {
          request.headers['Authorization'] = sign.gen(conf).header
        }
      } else if (conf.authentication === 'nonce') {
        // ADD TOKEN / NONCE AT END OF QUERYSTRING
        request = this.makeTale(request, conf)
      }

      // 12. Make request abortable

      request = this.makeAbortable(request, abortPromise)

      // 13. Transform response

      // Set response type ['arraybuffer', 'blob', 'document', 'json', 'text', 'stream']
      request.responseType = conf.responseType

      // Transform Response to raw
      request.transformResponse = (response) => {
        return response
      }

      // 14. If request should be applied, perform and return
      if (conf.perform) {
        return axios.request(request)
      }

      // 15. If only the axios config object is needed, return resolved promise
      return new Promise(resolve => {
        resolve(request)
      })
    }

    this.makeDataQuery = (url, data, options) => {
      if (data !== null) {
        let queryString = util.querystring.stringify(data, options)
        if (url.indexOf('?') === -1 && queryString !== '') {
          url += '?' + queryString
        } else if (queryString !== '') {
          url += '&' + queryString
        }
      }
      return url
    }

    this.makeTale = (request, conf = this.conf) => {
      // Set nonce based on localized object / var
      if (conf.nonceTale !== '') {
        let query = conf.nonceTale.split('=')
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
      return request
    }

    this.makeAbortable = (request, promise) => {
      let cancel
      request.cancelToken = axios.CancelToken(function executor (c) {
        cancel = c
      })
      promise.then(() => {
        cancel()
      })
      return request
    }

    this.verifyToken = (url, token = '') => {
      window.open(url + '?' + (token !== '' ? util.querystring.stringify({ oauth_token: token }) : ''),
        '_blank'
      )
    }

    this.getTokenRequest = (url) => {
      let scope = this
      let conf = JSON.parse(JSON.stringify(this.getConf))
      conf.addDataToQuery = false
      conf.addAuthHeaders = true
      return new Promise((resolve, reject) => {
        scope.get(url, null, false, false, conf).then(res => {
          resolve(res)
        }).catch(e => {
          reject(e)
        })
      })
    }

    this.getTokenAccess = (url, requestToken, requestTokenSecret, verifierToken) => {
      url = url + '?oauth_verifier=' + verifierToken
      let scope = this
      let conf = JSON.parse(JSON.stringify(this.getConf))
      conf.addDataToQuery = false
      conf.addAuthHeaders = true
      conf.key = requestToken
      conf.secret = requestTokenSecret
      return new Promise((resolve, reject) => {
        scope.get(url, null, false, false, conf).then(res => {
          resolve(res)
        }).catch(e => {
          reject(e)
        })
      })
    }
  }
}
