/**
 * Query
 */
export default class Query {
  constructor(endpoint) {
    let accessor = this
    let queries = []
    let argsMap = {}
    if (endpoint.shared.map !== null && typeof endpoint.shared.map.args !== 'undefined') {
      argsMap = endpoint.shared.map.args
    }

    accessor.custom = (key, value) => {
      // Resolve mapping
      if (typeof argsMap[key] !== 'undefined') {
        key = argsMap[key]
      }
      // Ensures new arg (key, value) is added at end of query
      let newQ = []
      queries.forEach(query => {
        if (query.key !== key) {
          newQ.push(query)
        }
      })
      newQ.push({
        key: key,
        value: value
      })
      queries = newQ
      return accessor
    }

    accessor.exclude = (value) => {
      return accessor.custom('exclude', value)
    }

    accessor.include = (value) => {
      return accessor.custom('include', value)
    }

    accessor.parent = (value) => {
      return accessor.custom('parent', value)
    }

    accessor.parentExclude = (value) => {
      return accessor.custom('parent_exclude', value)
    }

    accessor.slug = (value) => {
      return accessor.custom('slug', value)
    }

    accessor.status = (value) => {
      return accessor.custom('status', value)
    }

    accessor.type = (value) => {
      return accessor.custom('type', value)
    }

    accessor.sku = (value) => {
      return accessor.custom('sku', value)
    }

    accessor.featured = (value) => {
      return accessor.custom('featured', value)
    }

    accessor.shippingClass = (value) => {
      return accessor.custom('shipping_class', value)
    }

    accessor.attribute = (value) => {
      return accessor.custom('attribute', value)
    }

    accessor.attributeTerm = (value) => {
      return accessor.custom('attribute_term', value)
    }

    accessor.taxClass = (value) => {
      return accessor.custom('tax_class', value)
    }

    accessor.inStock = (value = true) => {
      return accessor.custom('in_stock', value)
    }

    accessor.onSale = (value = true) => {
      return accessor.custom('on_sale', value)
    }

    accessor.product = (value) => {
      return accessor.custom('product', value)
    }

    accessor.minPrice = (value = 0) => {
      return accessor.custom('min_price', value)
    }

    accessor.maxPrice = (value = 10000) => {
      return accessor.custom('max_price', value)
    }

    accessor.after = (value) => {
      return accessor.custom('after', value)
    }

    accessor.before = (value) => {
      return accessor.custom('before', value)
    }

    accessor.hideEmpty = (value = true) => {
      return accessor.custom('hide_empty', value)
    }

    accessor.order = (value = 'desc') => {
      return accessor.custom('order', value)
    }

    accessor.orderby = (value = 'menu_order') => {
      return accessor.custom('orderby', value)
    }

    accessor.offset = (value = 100) => {
      return accessor.custom('offset', value)
    }

    accessor.search = (value = '') => {
      return accessor.custom('search', value)
    }

    accessor.page = (value = 1) => {
      return accessor.custom('page', value)
    }

    accessor.perPage = (value = 12) => {
      return accessor.custom('per_page', value)
    }

    accessor.category = (value = 0) => {
      return accessor.custom('category', value)
    }

    accessor.context = (value = 'view') => {
      return accessor.custom('context', value)
    }

    accessor.tag = (value = 0) => {
      return accessor.custom('tag', value)
    }

    accessor.fetch = (apiSlug = endpoint.shared.defaultApi, args = null, replace = true) => {
      // Merge args with queries as its just two different ways of using args
      if (args !== null) {
        args.forEach(arg => {
          return accessor.custom(arg.key, arg.value)
        })
      }
      return endpoint.fetch(apiSlug, queries, replace)
    }
  }
}
