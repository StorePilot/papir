import Endpoint from '../endpoint'
import Prop from '../prop'

/**
 * Product
 */
export default class Product extends Endpoint {

  constructor (controller, id = null, api = controller.default) {

    /**
     * Pass to Endpoint model
     */
    super('product', controller, api)

    /**
     * Make code editor recognize supported Props
     */
    this.id = new Prop(this, 'id', id)
    this.description = new Prop(this, 'description')

  }

}