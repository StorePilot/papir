import Controller from './services/controller'
import Requester from './services/requester'
import Endpoint from './form/endpoint'

/**
 * Papir
 */
class Papir {
  constructor (options = {}) {
    this.controller = new Controller(options)
    this.Endpoint = Endpoint
    this.Requester = Requester
    // Vue integration
    this.install = (Vue, options = {}) => {
      Vue.prototype.$al = {
        controller: new Controller(options),
        Endpoint: Endpoint,
        Requester: Requester
      }
    }
  }
}

export default new Papir()
