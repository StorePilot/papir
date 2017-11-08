import Requester from './requester'
import RequesterOauth from '../requesters/oauth'

/**
 * Controller
 */
export class Controller {
  constructor (options = {}) {
    options = Object.assign({
      serverBase: null,
      apis: require('../apis.json')
    }, options)
    this.default = null
    this.requesters = {}
    this.apis = {}
    this.server = options.serverBase

    // Load requesters
    this.requesters.oauth = RequesterOauth

    // Load and configure Apis
    options.apis.forEach(api => {
      if (api.default || this.default === null) {
        this.default = api.slug
      }
      if (this.server !== null && (typeof api.base === 'undefined' || api.base === '')) {
        api.base = this.server
      }
      if (
        typeof api.requester !== 'undefined' &&
        typeof this.requesters[api.requester] !== 'undefined'
      ) {
        api.requester = new this.requesters[api.requester](api.config)
      } else {
        api.requester = new Requester(api.config)
      }
      this.apis[api.slug] = api
    })
  }
}

export default Controller
