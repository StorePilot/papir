import glob from 'glob'
import path from 'path'
import Requester from './requester'

/**
 * Controller
 */
export class Controller {

  constructor () {

    this.default = null
    this.requesters = {}
    this.apis = {}

    // Load Requesters
    glob.sync('./requesters/**/*.js').forEach(file => {
      let requester = require(path.resolve(file))
      this.requesters[requester.requester] = requester
    })

    // Load and configure Apis
    glob.sync('./apis/**/*.json').forEach(file => {
      let api = require(path.resolve(file))
      if (api.default || this.default === null) {
        this.default = api.slug
      }
      if (
        typeof api.requester !== 'undefined' &&
        typeof this.requesters[api.requester] !== 'undefined'
      ) {
        api.requester = new this.requesters[api.requester](api.config)
      } else {
        api.requester = new Requester(api.config)
      }
      this.apis[api.slug] = api
    })

  }

}

export default new Controller()
