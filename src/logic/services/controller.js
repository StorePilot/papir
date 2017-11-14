import Requester from './requester'

/**
 * Controller
 */
export class Controller {
  constructor (options = {}) {
    options = {
      config: typeof options.config !== 'undefined' ? options.config : {},
      serverBase: typeof options.serverBase !== 'undefined' ? options.serverBase : null,
      apis: typeof options.apis !== 'undefined' ? options.apis : require('../apis.json')
    }
    this.default = null
    this.apis = {}
    this.server = options.serverBase

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
          this.apis[key].requester = new Requester(this.storeAuth(this.apis[key], this.apis[key].config))
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
        this.apis[opt1].requester = new Requester(this.storeAuth(this.apis[opt1], this.apis[opt1].config))
      }
    }

    this.storeAuth = (api, config) => {
      if (typeof config.key !== 'undefined') {
        localStorage.setItem('papir.' + api.slug + '.key', config.key)
      }
      if (typeof config.secret !== 'undefined') {
        localStorage.setItem('papir.' + api.slug + '.secret', config.secret)
      }
      if (typeof config.token !== 'undefined' && config.token.constructor === Object) {
        localStorage.setItem('papir.' + api.slug + '.token', JSON.stringify(config.token))
      }
      config = Object.assign(config, {
        key: (localStorage.getItem('papir.' + api.slug + '.key') !== null ? localStorage.getItem('papir.' + api.slug + '.key') : ''),
        secret: (localStorage.getItem('papir.' + api.slug + '.secret') !== null ? localStorage.getItem('papir.' + api.slug + '.secret') : ''),
        token: (localStorage.getItem('papir.' + api.slug + '.token') !== null ? JSON.parse(localStorage.getItem('papir.' + api.slug + '.token')) : { key: '', secret: '' })
      })
      return config
    }

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
      options.config = Object.assign(api.config, options.config)
      api.requester = new Requester(this.storeAuth(api, options.config))
      this.apis[api.slug] = api
    })
  }
}

export default Controller
