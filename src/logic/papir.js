import controller from './services/controller'
import Requester from './services/requester'
import Endpoint from './form/endpoint'

/**
 * Papir
 */
class Papir {
  constructor () {
    this.controller = controller
    this.Endpoint = Endpoint
    this.Requester = Requester
    // Vue integration
    this.install = (Vue) => {
      Vue.prototype.$al = {
        controller: controller,
        Endpoint: Endpoint,
        Requester: Requester
      }
    }
  }
}

export default new Papir()
