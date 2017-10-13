import controller from './services/controller'
import Requester from './services/requester'
import Endpoint from './form/endpoint'

/**
 * Apilake
 */
class Apilake {
  constructor () {
    this.controller = controller
    this.Endpoint = Endpoint
    this.Requester = Requester
  }
}

export default Apilake
