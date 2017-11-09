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
      if (typeof api.config === 'undefined') {
        api.config = {}
      }
      let config = Object.assign(api.config, options.conf)
      api.requester = new Requester(config)
      this.apis[api.slug] = api
    })

    this.config = (opt1, opt2, replace = false) => {
      if (typeof opt2 === 'undefined' && typeof opt1 !== 'undefined' && opt1.constructor === Object) {
        Object.keys(this.apis).forEach(key => {
          if (replace) {
            this.apis[key] = opt1
          } else {
            this.apis[key] = Object.assign(this.apis[key], opt1)
          }
          if (typeof this.apis[key].config === 'undefined') {
            this.apis[key].config = {}
          }
          this.apis[key].requester = new Requester(this.apis[key].config)
        })
      } else if (typeof opt1 === 'string' && typeof opt2 !== 'undefined' && opt2.constructor === Object) {
        if (typeof this.apis[opt1] !== 'undefined' && !replace) {
          this.apis[opt1] = Object.assign(this.apis[opt1], opt2)
        } else {
          this.apis[opt1] = opt2
        }
        if (typeof this.apis[opt1].config === 'undefined') {
          this.apis[opt1].config = {}
        }
        this.apis[opt1].requester = new Requester(this.apis[opt1].config)
      }
    }
  }
}

export default Controller
