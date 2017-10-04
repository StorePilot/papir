/**
 * Endpoint
 */
export default class Endpoint {

  constructor (endpoint, controller, apiSlug = null) {

    // Endpoint Scope
    let scope = this

    // Private Variables
    let requester = controller
    let api = null
    let map = null

    // Private Methods
    /**
     * Initialization
     */
    let init = () => {
      /**
       * Map Resolver
       */
      let resolveMap = (endpoint = endpoint, api = api) => {
        let map = null
        try {
          map = api.mappings[endpoint]
        } catch (e) {}
        return map
      }
      /**
       * Resolve Requester
       */
      if (typeof controller.apis !== 'undefined') {
        apiSlug = controller.default
        api = controller.apis[apiSlug]
        requester = api.requester
        map = resolveMap(endpoint, api)
      } else {
        controller = null
      }
    }
    init() // Run at once

    /**
     * Url Resolver
     */
    let resolveUrl = (endpoint = endpoint, map = map, api = api) => {
      let base = ''
      let path = endpoint
      // If mapping is set
      if (map !== null) {
        base = api.base
        // Remove last slash if any from base
        if (base[(base.length - 1)] === '/') {
          base = base.slice(0, -1)
        }
        // Add slash to path if missing
        if (path[0] !== '/') {
          path = '/' + path
        }
        // Resolve Optionals
        if (path.indexOf('}') !== '-1') {
          let optionals = path.split('}')
          optionals.forEach(opt => {
            let index = opt.indexOf('{')
            if (index !== -1) {
              let repl = opt.substring(index) + '}'
              let prop = repl.replace('{', '').replace('}', '')
              let val = ''
              if (repl.indexOf('/') !== -1) {
                prop = repl.replace('/', '')
                val = '/'
              }
              if (typeof scope[prop] !== 'undefined') {
                path = path.replace(repl, val + scope[prop].value)
              }
            }
          })
        }
      }
      return base + path
    }

    // Reserved Public Methods which can not be used as properties

  }

}