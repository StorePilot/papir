import crypto from 'crypto'

export default class Sign {

  constructor () {
    let scope = this

    this.gen = (
      type = 'oauth_1.0a',
      version = '1.0',
      algorithm = 'HMAC-SHA1',
      uri = location.href,
      method = 'GET',
      key = '',
      token = { key: '', secret: '' },
      secret = '',
      nonce = '',
      nonceLength = 6,
      timestampLength = 30,
      indexArrays = true,
      emptyParams = false,
      requester = null,
      base64 = true,
      ampersand = true,
      sort = true
    ) => {
      let baseString = method + '&' + scope.encode(scope.strip(uri)) + '&'
      let hash = ''
      let mergedParams = []
      scope.getParams(uri).forEach(param => {
        mergedParams.push({
          key: param.key,
          value: param.value
        })
      })

      if (type === 'oauth_1.0a') {
        mergedParams.concat([
          {
            key: 'oauth_consumer_key',
            value: key
          },
          {
            key: 'oauth_signature_method',
            value: algorithm
          },
          {
            key: 'oauth_token',
            value: token.key
          },
          {
            key: 'oauth_timestamp',
            value: scope.timestamp(timestampLength)
          },
          {
            key: 'oauth_nonce',
            value: (nonce === '' && nonceLength > 0) ? scope.nonce(nonceLength) : nonce
          },
          {
            key: 'oauth_version',
            value: version
          }
        ])

        if (requester !== null) {
          mergedParams.push({
            key: 'xoauth_requester_id',
            value: requester
          })
        }

        let paramString = scope.paramString(mergedParams, emptyParams, sort, indexArrays)
        mergedParams = paramString.decoded
        baseString += scope.encode(paramString.string)

        let signKey = scope.signKey(secret, token.secret, ampersand)

        if (base64 && algorithm === 'HMAC-SHA1') {
          hash = crypto.createHmac('sha1', signKey).update(baseString).digest('base64')
        }
      }

      // Convert params to html-form type (change 'key' to 'name')
      let params = []
      mergedParams.forEach((param) => {
        params.push({
          name: param.key,
          value: param.value
        })
        if (param.key === 'oauth_nonce') {
          params.push({
            name: 'oauth_signature',
            value: hash
          })
        }
      })

      // Generate OAuth header
      let header = 'OAuth '
      params.forEach((param) => {
        if (param.value !== '') {
          header += param.name + '="' + param.value + '",'
        } else {
          header += param.name + '",'
        }
      })

      let queryString = ''
      let i = 0
      params.forEach((param) => {
        if (param.value !== '') {
          queryString += param.name + '=' + param.value
        } else {
          queryString += param.name
        }
        if (i !== (params.length - 1)) {
          queryString += '&'
        }
        i++
      })

      return {
        params: params,
        header: header.slice(0, -1),
        string: queryString
      }
    }

    this.timestamp = (length = 30) => {
      return Number(String(new Date().getTime()).substring(0, length))
    }

    this.nonce = (length = 6) => {
      let nonce = ''
      let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      for (let i = 0; i < length; i++) {
        nonce += possible.charAt(Math.floor(Math.random() * possible.length))
      }
      return nonce
    }

    this.signKey = (secret, tokenSecret, ampersand = true) => {
      if (ampersand || tokenSecret !== '') {
        return scope.encode(secret) + '&' + scope.encode(tokenSecret)
      } else {
        return scope.encode(secret)
      }
    }

    this.paramString = (params, emptyParams = false, sort = true, indexArrays  = true) => {
      params.forEach((param) => {
        param.key = scope.decode(param.key)
        param.value = scope.decode(param.value)
      })

      let paramString = ''
      let enc = []
      params.forEach((param) => {
        if (param.value !== '') {
          enc.push(scope.encode(param.key, indexArrays) + '=' + scope.encode(param.value, indexArrays) + '&')
        } else if (param.value === '' && param.key !== 'oauth_token' && emptyParams) {
          enc.push(scope.encode(param.key, indexArrays) + '&')
        }
      })

      if (sort) {
        enc.sort()
      }

      // Decode encoded to get equal sorting as encoded
      let dec = []
      enc.forEach((param) => {
        let p = param.split('=')
        if (p.length === 2) {
          dec.push({
            key: decode(p[0]),
            value: decode(p[1]).replace(/&/g, '%26').slice(0, -3) // 'keep & decoded as its a key character'
          })
        } else {
          dec.push({
            key: decode(p[0]),
            value: ''
          })
        }
      })

      enc.forEach(param => {
        paramString += param
      })

      if (enc.length > 0) {
        paramString = paramString.slice(0, -1)
      }

      return {
        string: paramString,
        encoded: enc,
        decoded: dec
      }
    }

    // Encode decoded !*'()/ from string
    this.encode = (uri, indexArrays = true) => {
      if (indexArrays) {
        uri = scope.indexArrayQuery(uri)
      }
      return encodeURIComponent(value)
        .replace(/!/g, '%21')
        .replace(/\*/g, '%2A')
        .replace(/'/g, '%27')
        .replace(/\)/g, '%29')
        .replace(/\(/g, '%28')
    }

    // Decode encoded !*'()/ recursively from string
    this.decode = (uri) => {
      let decode = (u) => {
        return decodeURIComponent(u)
          .replace(/%21/g, '!')
          .replace(/%2A/g, '*')
          .replace(/%27/g, '\'')
          .replace(/%29/g, ')')
          .replace(/%28/g, '(')
          .replace(/%2F/g, '/')
      }
      let encoded = (u) => {
        u = u || ''
        return u !== decode(u)
      }
      while (encoded(uri)) {
        uri = decode(uri)
      }
      return uri
    }

    this.indexArrayQuery = (uri) => {
      let preserved = ''
      let qIndex = uri.indexOf('?')
      if (qIndex !== -1) {
        preserved = uri.substr(0, qIndex)
        uri = uri.substr((qIndex + 1))
      }
      let params = uri.split('&')
      let preKey = null
      let filled = []
      let i = 0
      params.forEach(param => {
        if (param.indexOf('[]') !== -1) {
          if (i === 0 || param.indexOf(preKey) === -1) {
            i = 0
            let key = preKey = param.split('=')[0]
            key = key.replace(/\[\]/g, '[0]')
            param = param.replace(preKey, key)
            i++
          } else if (preKey !== null && param.indexOf(preKey) !== -1) {
            let key = param.split('=')[0]
            let index = key.lastIndexOf('[]')
            key = key.substring(0, index) + '[' + i + ']' + key.substring(index + 3)
            key = key.replace(/\[\]/g, '[0]')
            param = param.replace(preKey, key)
            i++
          }
        } else {
          i = 0
          preKey = null
        }
        filled.push(param)
      })
      uri = preserved
      filled.forEach(param => {
        uri += param + '&'
      })
      return filled.length > 0 ? uri.slice(0, -1) : uri
    }

    this.stripUri = (uri) => {
      let a = document.createElement('a')
      a.setAttribute('href', uri)
      return a.protocol + '//' + a.host + a.pathname
    }

    this.getParams = (uri) => {
      let params = []
      let split = uri.split('?')
      if (typeof split[1] !== 'undefined') {
        let queries = split[1].split('&')
        queries.forEach(q => {
          q = q.split('=')
          if (q.length === 2) {
            params.push({
              key: q[0],
              value: q[1]
            })
          } else {
            params.push({
              key: q[0],
              value: ''
            })
          }
        })
      }
      return params
    }

  }

}
