import qs from 'qs'
import sign from '../services/sign'
import util from '../services/util'
import Requester from '../services/requester'

/**
 * OauthRequester
 */
export default class RequesterOauth extends Requester {

  constructor (customConf = {}) {

    customConf = Object.assign({
      addAuthHeaders: false,
      dualAuth: false,
      put: {
        dualAuth: true
      }
    }, customConf)

    super(customConf)

    this.requester = 'oauth'

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
        config.method = request.method
        let signGen = sign.gen(config)
        request.url = util.stripUri(request.url) + '?' + signGen.string
        request.headers['Authorization'] = signGen.header
      }

      request = this.makeTale(request, config)
      request = this.makeAbortable(request, abortPromise)
      request.responseType = conf.responseType
      request.transformResponse = (response) => {
        return response
      }

      return axios(request)
    }

    this.makeDataDualAuth = (request, data, indexArrays = true, conf = this.conf) => {
      let config = JSON.parse(JSON.stringify(conf))
      config.indexArrays = indexArrays
      let method = request.method
      let url = request.url
      request.method = config.method = 'OPTIONS'
      request.headers['Content-Type'] = 'application/json'
      request.data = data

      // Make Url
      config.url = request.url.replace('_method=' + method + '&', '').replace('_method=' + method, '')
      let signGen = sign.gen(config)
      request.url = util.stripUri(config.url) + '?' + signGen.string

      // Make Header
      config.url = url
      signGen = sign.gen(config)
      request.headers['Authorization'] = signGen.header

      return request
    }

    this.makeData = (request, data, indexArrays = true, conf = this.conf) => {
      let config = JSON.parse(JSON.stringify(conf))
      config.url = request.url
      config.method = request.method
      config.indexArrays = indexArrays
      let signGen = sign.gen(config)
      request.url = util.stripUri(request.url) + '?' + signGen.string
      request.headers['Authorization'] = signGen.header
      request.headers['Content-Type'] = 'application/json'
      request.data = data
      return request
    }

    this.verifyToken = (url, token = '') => {
      window.open(url + '?' + (token !== '' ? qs.stringify({ oauth_token: token }) : ''),
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
