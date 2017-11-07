import crypto from 'crypto'
import util from './util'
import encode from './encode'

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
        sort: true,
        protocol: 'rfc3986',
        encodeNull: true,
        encodeNames: true,
        encodeValues: true
      }

      Object.keys(conf).forEach((key) => {
        if (typeof opt[key] !== 'undefined') {
          conf[key] = opt[key]
        }
      })

      let baseString = conf.method + '&' + encode.encode(util.stripUri(conf.url)) + '&'
      let hash = ''
      let mergedParams = []
      util.getParams(conf.url).forEach(param => {
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
        baseString += encode.encode(paramString.string)

        let signKey = scope.signKey(conf.secret, conf.token.secret, conf.ampersand)

        if (conf.base64 && conf.algorithm === 'HMAC-SHA1') {
          // baseString = baseString.replace(/%00/g, '%2500').replace(/%0A/g, '%250A').replace(/%0D/g, '%250D')
          // @note At this point %00 = %252500, %0A = %25250A, %0D = %25250D
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
        let key = param.name
        let value = param.value
        if (conf.encodeNames) {
          key = encode.encode(key, conf.protocol, conf.encodeNull)
        }
        if (conf.encodeValues) {
          value = encode.encode(value, conf.protocol, conf.encodeNull)
        }
        if (value !== '') {
          header += key + '="' + value + '",'
        } else {
          header += key + '",'
        }
      })

      let queryString = ''
      let i = 0
      params.forEach((param) => {
        let key = param.name
        let value = param.value
        if (conf.encodeNames) {
          key = encode.encode(key, conf.protocol, conf.encodeNull)
        }
        if (conf.encodeValues) {
          value = encode.encode(value, conf.protocol, conf.encodeNull)
        }
        if (value !== '') {
          queryString += key + '=' + value
        } else {
          queryString += key
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
        return encode.encode(secret) + '&' + encode.encode(tokenSecret)
      } else {
        return encode.encode(secret)
      }
    }

    this.paramString = (params, emptyParams = false, sort = true) => {
      let paramString = ''
      let enc = []
      params.forEach((param) => {
        if (param.value !== '') {
          enc.push(param.key + '=' + param.value + '&')
        } else if (param.value === '' && param.key !== 'oauth_token' && emptyParams) {
          enc.push(param.key + '=&')
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
            key: encode.decode(p[0]),
            value: encode.decode(p[1]).slice(0, -1)
          })
        } else {
          dec.push({
            key: encode.decode(p[0]),
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
  }
}

export default new Sign()
