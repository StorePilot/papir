import Requester from './requester'

/**
 * Controller
 */
export class Controller {
  constructor (options = {}) {
    options = Object.assign({
      config: {},
      serverBase: null,
      apis: require('../apis.json')
    }, options)
    this.default = null
    this.apis = {}
    this.server = options.serverBase

    // Load and configure Apis
    options.apis.forEach(api => {
      if (api.default || this.default === null) {
        this.default = api.slug
      }
      if (this.server !== null && (typeof api.base === 'undefined' || api.base === '')) {
        api.base = this.server
      }
      let config = Object.assign(api.config, options.conf)
      api.requester = new Requester(config)
      this.apis[api.slug] = api
    })
  }
}

export default Controller
