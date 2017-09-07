import Sign from './sign'
import $ from 'jquery'

export default class Oauth {

  constructor () {
    let sign = new Sign()

    this.conf = {
      addDataToQuery: true,
      addAuthHeaders: false,
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
      tale: '' //'_wpnonce=' + wcApiSettings.nonce
    }

    this.getConf = JSON.parse(JSON.stringify(conf))
    this.postConf = JSON.parse(JSON.stringify(conf))
    this.putConf = JSON.parse(JSON.stringify(conf))
    this.putConf.dualAuth = true
    this.deleteConf = JSON.parse(JSON.stringify(conf))
    this.optionsConf = JSON.parse(JSON.stringify(conf))

    this.get = (
      url,
      data = null,
      upload = false,
      conf = getConf
    ) => {
      return this.custom('GET', url, data, upload, conf)
    }

    this.post = (
      url,
      data = null,
      upload = false,
      conf = postConf
    ) => {
      return this.custom('POST', url, data, upload, conf)
    }

    this.put = (
      url,
      data = null,
      upload = false,
      conf = putConf
    ) => {
      return this.custom('PUT', url, data, upload, conf)
    }

    this.delete = (
      url,
      data = null,
      upload = false,
      conf = deleteConf
    ) => {
      return this.custom('DELETE', url, data, upload, conf)
    }

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
        type: method
      }
      conf = JSON.parse(JSON.stringify(conf))
      let dualAuth = conf.dualAuth
      let indexArrays = conf.indexArrays
      let addDataToQuery = conf.addDataToQuery
      let addAuthHeaders = conf.addAuthHeaders

      if (data !== null) {
        if (upload) {
          request = this.makeUpload(request, data, indexArrays, conf)
        } else if (addDataToQuery) {
          request = this.makeDataQuery(request, data, indexArrays)
        } else if (dualAuth) {
          request = this.makeDataDualAuth(request, data, indexArrays, conf)
        } else {
          request = this.makeData(request, data, indexArrays, conf)
        }
      } else if (addAuthHeaders) {
        let config = JSON.parse(JSON.stringify(conf))
        config.url = request.url
        config.method = request.type
        let signGen = sign.gen(config)
        request.url = sign.stripUri(request.url) + '?' + signGen.string
        request.headers = {
          Authorization: signGen.header
        }
      }

      request = this.makeAbortable(request, abortPromise)
      let promise = this.makePromise(request)
      $.ajax(request)

      return promise
    }

    this.makeDataDualAuth = (request, data, indexArrays = true, conf = this.conf) => {
      let config = JSON.parse(JSON.stringify(conf))
      config.indexArrays = indexArrays
      let method = request.type
      let url = request.url
      request.type = config.method = 'OPTIONS'
      request.contentType = 'application/json'
      request.data = data

      // Make Url
      config.url = request.url.replace('_method=' + method + '&', '').replace('_method=' + method, '')
      let signGen = sign.gen(config)
      request.url = sign.stripUri(config.url) + '?' + signGen.string

      // Make Header
      config.url = url
      signGen = sign.gen(config)
      request.headers = {
        Authorization: signGen.header
      }

      return request
    }

    this.makeDataQuery = (request, data, indexArrays = true) => {
      if (request.url.indexOf('?') !== -1) {
        request.url += '&' + $.param(JSON.parse(data))
      } else {
        request.url += '?' + $.param(JSON.parse(data))
      }
      if (indexArrays) {
        request.url = sign.indexArrayQuery(request.url)
      }
      request.processData = false
      request.headers = {
        Accept: 'application/json'
      }
      request.contentType = 'text/plain'
      return request
    }

    this.makeData = (request, data, indexArrays = true, conf = this.conf) => {
      let config = JSON.parse(JSON.stringify(conf))
      config.url = request.url
      config.method = request.type
      config.indexArrays = indexArrays
      let signGen = sign.gen(config)
      request.url = sign.stripUri(request.url) + '?' + signGen.string
      request.headers = {
        Authorization: signGen.header
      }
      request.contentType = 'application/json'
      request.data = data
      return request
    }

    this.makeUpload = (request, data, indexArrays = true, conf = this.conf) => {
      request = this.makeData(request, data, indexArrays, conf)
      request.cache = false
      request.contentType = false
      request.processData = false
      return request
    }

    this.makeTale = (request, conf = this.conf) => {
      if (conf.tale !== '') {
        if (request.url.indexOf('?') === -1) {
          request.url += '?' + conf.tale
        } else {
          request.url += '&' + conf.tale
        }
      }
      return request
    }

    this.makePromise = (request) => {
      return new Promise((resolve, reject) => {
        request.success = (body, status, response) => {
          resolve({
            body: body,
            status: status,
            response: response
          })
        }
        request.error = (error) => {
          reject(error)
        }
      })
    }

    this.makeAbortable = (request, promise) => {
      let xhr = new window.XMLHttpRequest()
      request.xhr = () => {
        return xhr
      }
      promise.then(() => {
        xhr.abort()
      })
      return request
    }

    this.verifyToken = (url, token = '') => {
      window.open(url + '?' + (token !== '' ? $.param({ oauth_token: token }) : ''),
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
      let url = url + '?oauth_verifier=' + verifierToken
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
