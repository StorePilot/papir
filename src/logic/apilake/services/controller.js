import glob from 'glob'
import path from 'path'
import Requester from 'requester'
import RequesterOauth from 'requesterOauth'

/**
 * Controller
 */
class Controller {

  constructor () {

    this.default = null
    this.apis = {}

    glob.sync('../apis/**/*.json').forEach(file => {
      let api = require(path.resolve(file))
      if (api.default || this.default === null) {
        this.default = api.slug
      }
      if (api.config.type.indexOf('oauth') !== -1) {
        api.requester = new RequesterOauth(api.config)
      } else {
        api.requester = new Requester(api.config)
      }
      this.apis[api.slug] = api
    })

  }

}

export default new Controller()
