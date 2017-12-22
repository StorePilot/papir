import Endpoint from './endpoint'

/**
 * List
 */
export default class List extends Endpoint {
  constructor (Endpoint, controller = null, apiSlug = null, predefined = {}, config = {}) {
    /**
     * If no controller defined, create one from endpoint if it is not a string
     */
    let endpoint
    if (controller !== null) {
      // Check if Endpoint is constructor and try to resolve
      try {
        endpoint = new Endpoint(controller, apiSlug, predefined, config)
      } catch (e) {
        // Controller was not a constructor
      }
    } else if (controller === null && Endpoint.constructor === Object) {
      // If controller is not set, assume endpoint already is a constructed Endpoint object
      endpoint = Endpoint
      controller = endpoint.shared.controller // Get the controller from endpoint
    } else {
      console.error('No controller defined for List', Endpoint)
    }
    /**
     * Pass to Endpoint model controller, id = null, apiSlug = controller.default, predefined = {}
     */
    super(
      endpoint,
      controller,
      apiSlug,
      Object.assign({
        batch: 'batch'
      }, predefined),
      Object.assign({
        multiple: true,
        batch: {
          save: 'update',
          create: 'create',
          delete: 'delete'
        }
      }, config)
    )
  }
}
