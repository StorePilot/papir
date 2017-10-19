import crypto from 'crypto'
import util from './util'

class Sign {
  constructor () {
    let scope = this

    this.gen = (opt) => {
      let conf = {
        authentication: 'oauth',
        version: '1.0a',
        type: 'one_legged',
        algorithm: 'HMAC-SHA1',
        url: location.href,
        method: 'GET',
        key: '',
        secret: '',
        token: { key: '', secret: '' },
        nonce: '',
        nonceLength: 6,
        timestampLength: 10,
        emptyParams: false,
        requester: null,
        base64: true,
        ampersand: true,
        sort: true
      }

      Object.keys(conf).forEach((key) => {
        if (typeof opt[key] !== 'undefined') {
          conf[key] = opt[key]
        }
      })

      let baseString = conf.method + '&' + scope.encode(util.stripUri(conf.url)) + '&'
      let hash = ''
      let mergedParams = []
      scope.getParams(conf.url).forEach(param => {
        mergedParams.push({
          key: param.key,
          value: param.value
        })
      })

      if (conf.authentication === 'oauth' && conf.version === '1.0a') {
        mergedParams = mergedParams.concat([
          {
            key: 'oauth_consumer_key',
            value: conf.key
          },
          {
            key: 'oauth_signature_method',
            value: conf.algorithm
          },
          {
            key: 'oauth_token',
            value: conf.token.key
          },
          {
            key: 'oauth_timestamp',
            value: util.timestamp(conf.timestampLength)
          },
          {
            key: 'oauth_nonce',
            value: (conf.nonce === '' && conf.nonceLength > 0) ? util.nonce(conf.nonceLength) : conf.nonce
          },
          {
            key: 'oauth_version',
            value: '1.0'
          }
        ])

        if (conf.requester !== null) {
          mergedParams.push({
            key: 'xoauth_requester_id',
            value: conf.requester
          })
        }
        let paramString = scope.paramString(mergedParams, conf.emptyParams, conf.sort)
        mergedParams = paramString.decoded
        baseString += scope.encode(paramString.string)

        let signKey = scope.signKey(conf.secret, conf.token.secret, conf.ampersand)

        if (conf.base64 && conf.algorithm === 'HMAC-SHA1') {
          baseString = baseString.replace(/%00/g, '%2500').replace(/%0A/g, '%250A')
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

    this.signKey = (secret, tokenSecret, ampersand = true) => {
      if (ampersand || tokenSecret !== '') {
        return scope.encode(secret) + '&' + scope.encode(tokenSecret)
      } else {
        return scope.encode(secret)
      }
    }

    this.paramString = (params, emptyParams = false, sort = true) => {
      params.forEach((param) => {
        param.key = scope.decode(param.key)
        param.value = scope.decode(param.value)
      })

      let paramString = ''
      let enc = []
      params.forEach((param) => {
        if (param.value !== '') {
          enc.push(scope.encode(param.key) + '=' + scope.encode(param.value) + '&')
        } else if (param.value === '' && param.key !== 'oauth_token' && emptyParams) {
          enc.push(scope.encode(param.key) + '&')
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
            key: this.decode(p[0]),
            value: this.decode(p[1]).replace(/&/g, '%26').slice(0, -3) // 'keep & decoded as its a key character'
          })
        } else {
          dec.push({
            key: this.decode(p[0]),
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
    this.encode = (url) => {
      return encodeURIComponent(url.replace(/%00/g, 'null').replace(/\n\r/g, '%0A').replace(/\n/g, '%0A').replace(/\r/g, '%0A'))
        .replace(/!/g, '%21')
        .replace(/\*/g, '%2A')
        .replace(/'/g, '%27')
        .replace(/\)/g, '%29')
        .replace(/\(/g, '%28')
        .replace(/null/g, '%00')
        .replace(/%250A/g, '%0A')
    }

    // Decode encoded !*'()/ recursively from string
    this.decode = (url) => {
      let decode = (u) => {
        return decodeURIComponent(String(u).replace(/%0A/g, '%250A').replace(/%00/g, 'null'))
          .replace(/null/g, '%00')
          .replace(/%250A/g, '%0A')
          .replace(/%21/g, '!')
          .replace(/%2A/g, '*')
          .replace(/%27/g, '\'')
          .replace(/%29/g, ')')
          .replace(/%28/g, '(')
          .replace(/%2F/g, '/')
          .replace(/\n\r/g, '%0A')
          .replace(/\n/g, '%0A')
          .replace(/\r/g, '%0A')
      }
      let encoded = (u) => {
        u = u || ''
        return u !== decode(u)
      }
      while (encoded(url)) {
        url = decode(url)
      }
      return url
    }

    this.getParams = (url) => {
      let params = []
      let split = url.split('?')
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

export default new Sign()
