import Endpoint from './endpoint'

/**
 * List
 */
export default class List extends Endpoint {
  constructor (endpoint, predefined = {}) {
    /**
     * Pass to Endpoint model controller, id = null, apiSlug = controller.default, predefined = {}
     */
    super(
      endpoint.shared.endpoint,
      endpoint.shared.controller,
      endpoint.shared.defaultApi,
      predefined,
      {
        multiple: true
      }
    )
  }
}
