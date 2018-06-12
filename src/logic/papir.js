import Controller from './services/controller'
import Requester from './services/requester'
import Endpoint from './form/endpoint'
import List from './form/list'
import Prop from './form/prop'
import { clone } from './services/util'

/**
 * Papir
 */
class Papir {
  constructor (opt = {}) {
    // Default integration
    this.init = (options) => {
      Object.assign({
        conf: {},
        controller: new Controller(options.conf)
      }, options)
      this.controller = options.controller
      this.Endpoint = Endpoint
      this.List = List
      this.Requester = Requester
      this.Prop = Prop
    }
    // Vue integration
    this.install = (Vue, options) => {
      Object.assign({
        conf: {},
        controller: new Controller(options.conf)
      }, options)
      Vue.prototype.$pap = {
        controller: options.controller,
        Endpoint: Endpoint,
        List: List,
        Requester: Requester,
        Prop: Prop
      }
    }
  }
}
let papir = new Papir()
export { papir as papir }
export { Controller as Controller }
export { Requester as Requester }
export { Endpoint as Endpoint }
export { Prop as Prop }
export { List as List }
export { clone as clone }
