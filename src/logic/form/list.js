import Endpoint from './endpoint'

/**
 * List
 */
export default class List extends Endpoint {
  constructor (endpoint, controller = null, apiSlug = null, predefined = {}, config = {}) {
    /**
     * If no controller defined, create one from endpoint if it is not a string
     */
    if (controller === null && endpoint.constructor === Object) {
      controller = endpoint.shared.controller
    } else if (controller === null) {
      console.error('No controller defined for List', endpoint)
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
