import Endpoint from '../form/endpoint'
import Prop from '../form/prop'

/**
 * Example model
 */
export default class Example extends Endpoint {
  constructor (controller, id = null, apiSlug = controller.default, predefined = {}) {
    /**
     * Pass to Endpoint model
     */
    super('example', controller, apiSlug, predefined)

    /**
     * Define properties
     * @note Props fetched which is not defined is available, but is not recognized in code editors
     */
    this.id = new Prop(this, 'id', id)
    this.description = new Prop(this, 'description')
  }
}
