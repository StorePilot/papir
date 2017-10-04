import Endpoint from '../endpoint'

/**
 * Product
 */
export default class Product extends Endpoint {

  constructor (controller, api = controller.default) {
    super('product', controller, api)

    this.id = () => {
      return ''
    }
  }

}