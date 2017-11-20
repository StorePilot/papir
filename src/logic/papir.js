import Controller from './services/controller'
import Requester from './services/requester'
import Endpoint from './form/endpoint'
import List from './form/list'
import Prop from './form/prop'

/**
 * Papir
 */
class Papir {
  constructor (opt = {}) {
    // Default integration
    this.init = (options = opt) => {
      this.controller = new Controller(options)
      this.Endpoint = Endpoint
      this.List = List
      this.Requester = Requester
      this.Prop = Prop
    }
    // Vue integration
    this.install = (Vue, options = opt) => {
      Vue.prototype.$pap = {
        controller: new Controller(options),
        Endpoint: Endpoint,
        List: List,
        Requester: Requester,
        Prop: Prop
      }
    }
  }
}

export default new Papir()
