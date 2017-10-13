import controller from './services/controller'
import Endpoint from './form/endpoint'

/**
 * Apilake
 */
export default class Apilake {

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
