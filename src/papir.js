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
  constructor (/* opt = {} */) {
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
export {
  papir,
  clone
}

export { default as Controller } from './services/controller'
export { default as Requester } from './services/requester'
export { default as Endpoint } from './form/endpoint'
export { default as List } from './form/list'
export { default as Prop } from './form/prop'
