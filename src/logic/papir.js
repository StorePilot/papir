import Controller from './services/controller'
import Requester from './services/requester'
import Endpoint from './form/endpoint'

/**
 * Papir
 */
class Papir {
  constructor (opt = {}) {
    // Default integration
    this.init = (options = opt) => {
      this.controller = new Controller(options)
      this.Endpoint = Endpoint
      this.Requester = Requester
    }
    // Vue integration
    this.install = (Vue, options = opt) => {
      Vue.prototype.$pap = {
        controller: new Controller(options),
        Endpoint: Endpoint,
        Requester: Requester
      }
    }
  }
}

export default new Papir()
