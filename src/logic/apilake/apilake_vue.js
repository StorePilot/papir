import controller from './services/controller'
import Requester from './services/requester'
import Endpoint from './form/endpoint'

/**
 * Apilake
 */
const Apilake = {
  install (Vue) {
    Vue.prototype.$al = {
      controller: controller,
      Endpoint: Endpoint,
      Requester: Requester
    }
  }
}

export default Apilake
