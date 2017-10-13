import controller from './services/controller'
import Endpoint from './form/endpoint'

/**
 * Apilake
 */
class Apilake {
  constructor () {
    this.controller = controller
    this.Endpoint = Endpoint
  }
}

/**
 * ApilakeVue
 */
const ApilakeVue = {
  install (Vue) {
    Vue.prototype.$al = {
      controller: controller,
      Endpoint: Endpoint
    }
  }
}

export default {
  Apilake,
  ApilakeVue
}
