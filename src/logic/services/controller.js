import fs from 'fs'
import path from 'path'
import Requester from './requester'

/**
 * Controller
 */
export class Controller {
  constructor (serverUrl = null) {
    this.default = null
    this.requesters = {}
    this.apis = {}
    this.server = serverUrl

    // Load Requesters
    fs.readdirSync(path.join(__dirname, '../requesters/')).forEach(file => {
      let Requester = require('../requesters/' + file).default
      let requester = new Requester()
      this.requesters[requester.requester] = Requester
    })

    // Load and configure Apis
    fs.readdirSync(path.join(__dirname, '../apis/')).forEach(file => {
      let api = require('../apis/' + file)
      if (api.default || this.default === null) {
        this.default = api.slug
      }
      if (this.server !== null) {
        api.base = this.server
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
