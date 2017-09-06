import Sign from './sign'
import $ from 'jquery'

export default class Oauth {

  constructor () {
    let scope = this
    let config = {
      addDataToQuery: true,
      type: 'oauth_1.0a',
      version: '1.0',
      algorithm: 'HMAC-SHA1',
      key: '',
      token: { key: '', secret: '' },
      secret: '',
      nonce: '',
      nonceLength: 6,
      timestampLength: 30,
      indexArrays: true,
      emptyParams: false,
      requester: null,
      base64: true,
      ampersand: true,
      sort: true,
      tale: '_wpnonce=' + wcApiSettings.nonce
    }
    let sign = new Sign()

    this.get = (url, data = null, upload = false) => {
      return scope.custom('GET', url, data, upload)
    }

    this.post = (url, data = null, upload = false) => {
      return scope.custom('POST', url, data, upload)
    }

    this.put = (url, data = null, upload = false) => {
      return scope.custom('PUT', url, data, upload)
    }

    this.delete = (url, data = null, upload = false) => {
      return scope.custom('DELETE', url, data, upload)
    }

    this.options = (url, data = null, upload = false) => {
      return scope.custom('OPTIONS', url, data, upload)
    }
    
    this.custom = (method, url, data = null, upload = false) => {
      let abort
      let abortPromise = new Promise((resolve) => {
        abort = resolve
      })
      let request = scope.request(method, url, abortPromise, data, upload)
      request.abort = abort
      return request
    }
    
    this.request = (
      method,
      url,
      abortPromise,
      data = null,
      upload = false
    ) => {
      let xhr = new window.XMLHttpRequest()

      if (config.addDataToQuery && upload === false && data !== null) {
        if (options.url.indexOf('?') !== -1) {
          url += '&' + $.param(JSON.parse(data))
        } else {
          url += '?' + $.param(JSON.parse(data))
        }
      }

      if (config.indexArrays) {
        url = sign.indexArrayQuery(url)
      }

      let genSign = sign.gen(
        config.type,
        config.version,
        config.algorithm,
        url,
        method,
        config.key,
        config.token,
        config.secret,
        config.nonce,
        config.nonceLength,
        config.timestampLength,
        config.indexArrays,
        config.emptyParams,
        config.requester,
        config.base64,
        config.ampersand,
        config.sort
      )

      if (!config.addDataToQuery) {
        url = sign.stripUri(url)
        url += '?' + genSign.string
      }

      if (config.indexArrays) {
        url = sign.indexArrayQuery(url)
      }

      return new Promise((resolve, reject) => {
        let request = {
          url: url,
          type: method,
          success: (body, status, response) => {
            resolve({
              body: body,
              status: status,
              response: response
            })
          },
          xhr: () => {
            return xhr
          },
          error: (error) => {
            reject(error)
          }
        }

        if (!config.addDataToQuery) {
          request.headers = {
            Authorization: genSign.header
          }
          request.contentType = 'application/json'
          request.data = data
        } else {
          request.processData = false
          request.headers = {
            Accept: 'application/json'
          }
          request.contentType = 'text/plain'
        }

        if (config.addDataToQuery && url.indexOf('_method=PUT') !== -1) {
          let url1 = url.replace('_method=PUT&', '')
          let url2 = url

          let genSign1 = sign.gen(
            config.type,
            config.version,
            config.algorithm,
            url1,
            'OPTIONS',
            config.key,
            config.token,
            config.secret,
            config.nonce,
            config.nonceLength,
            config.timestampLength,
            config.indexArrays,
            config.emptyParams,
            config.requester,
            config.base64,
            config.ampersand,
            config.sort
          )

          let genSign2 = sign.gen(
            config.type,
            config.version,
            config.algorithm,
            url2,
            'OPTIONS',
            config.key,
            config.token,
            config.secret,
            config.nonce,
            config.nonceLength,
            config.timestampLength,
            config.indexArrays,
            config.emptyParams,
            config.requester,
            config.base64,
            config.ampersand,
            config.sort
          )

          url1 = sign.stripUri(url1)
          url1 += '?' + genSign1.string
          url1 = sign.indexArrayQuery(url1)

          request.url = url1
          request.type = 'OPTIONS'
          request.headers = {
            Authorization: genSign2.header
          }
          request.contentType = 'application/json'
          request.data = data
        }

        if (upload) {
          request.cache = false
          request.contentType = false
          request.processData = false
          request.data = data
        }

        if (config.tale !== '') {
          if (request.url.indexOf('?') === -1) {
            request.url += '?' + tale
          } else {
            request.url += '&' + tale
          }
        }

        $.ajax(request)

        abortPromise.then(() => {
          xhr.abort()
        })

      })
    }

  }

}

/**

 @todo
 getRequestToken (endpoint = '') {
    let url = this.getUrl() + endpoint
    return rx.Observable.fromPromise($.ajax({
      url: url,
      type: 'GET',
      headers: this.oauth.toHeader(this.oauth.authorize({
        url: url,
        method: 'GET'
      }))
    }).promise()).map(results => {
      let token = this.decodeTokenResponse(results)
      return token
    })
  }

 getVerifierToken (endpoint = '', requestToken) {
    window.open(
      this.getUrl() + endpoint + '?' + $.param({
        oauth_token: requestToken
      }),
      '_blank'
    )
  }

 getAccessToken (endpoint = '', requestToken, requestTokenSecret, verifierToken) {
    let url = this.getUrl() + endpoint + '?oauth_verifier=' + verifierToken
    return rx.Observable.fromPromise($.ajax({
      url: url,
      type: 'GET',
      headers: {
        Authorization: this.oauth.toHeader(this.oauth.authorize({
          url: url,
          method: 'GET'
        }, {
          key: requestToken,
          secret: requestTokenSecret
        })).Authorization
      }
    }).promise()).map(results => {
      let token = this.decodeTokenResponse(results)
      this.setToken(token)
      return token
    })
  }

 decodeTokenResponse (results) {
    let token = {
      required: false,
      confirmed: false
    }
    let isJson = function (string) {
      let is = true
      try {
        $.parseJSON(string)
      } catch (e) {
        is = false
      }
      return is
    }
    if (typeof results === 'string') {
      if (isJson(results)) {
        // @todo - Automatically find which keys contains tokenKey / tokenSecret / confirmed
        token = $.parseJSON(results)
        token.required = true
      } else {
        let split = results.split('&')
        split.forEach(param => {
          let par = param.split('=')
          switch (par[0]) {
            case 'oauth_token':
              token.key = par[1]
              token.required = true
              break
            case 'oauth_token_secret':
              token.secret = par[1]
              token.required = true
              break
            case 'oauth_callback_confirmed':
              token.confirmed = String(par[1]) === 'true'
              break
          }
        })
      }
    }
    return token
  }

 **/