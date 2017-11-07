import sign from '../services/sign'
import util from '../services/util'
import Requester from '../services/requester'
import axios from 'axios'

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

      /**
       * OAuth 1.0a Authorization protocol Start
       */

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

      /**
       * OAuth 1.0a Authorization protocol End
       */

      // 12. Append argument to querystring after request is made. Ex. for cookie authentication
      // @todo - Make own requester for cookie authentication

      request = this.makeTale(request, conf)

      // 13. Make request abortable

      request = this.makeAbortable(request, abortPromise)

      // 14. Transform response

      // Set response type ['arraybuffer', 'blob', 'document', 'json', 'text', 'stream']
      request.responseType = conf.responseType

      // Transform Response to raw
      request.transformResponse = (response) => {
        return response
      }

      // 15. If request should be applied, perform and return
      if (conf.perform) {
        return axios.request(request)
      }

      // 16. If only the axios config object is needed, return resolved promise
      return new Promise(resolve => {
        resolve(request)
      })
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
