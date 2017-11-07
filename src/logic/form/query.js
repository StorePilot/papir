/**
 * Query
 */
export default class Query {
  constructor (endpoint) {
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
    }

    accessor.exclude = (value) => {
      accessor.custom('exclude', value)
      return accessor
    }

    accessor.include = (value) => {
      accessor.custom('include', value)
      return accessor
    }

    accessor.parent = (value) => {
      accessor.custom('parent', value)
      return accessor
    }

    accessor.parentExclude = (value) => {
      accessor.custom('parent_exclude', value)
      return accessor
    }

    accessor.slug = (value) => {
      accessor.custom('slug', value)
      return accessor
    }

    accessor.status = (value) => {
      accessor.custom('status', value)
      return accessor
    }

    accessor.type = (value) => {
      accessor.custom('type', value)
      return accessor
    }

    accessor.sku = (value) => {
      accessor.custom('sku', value)
      return accessor
    }

    accessor.featured = (value) => {
      accessor.custom('featured', value)
      return accessor
    }

    accessor.shippingClass = (value) => {
      accessor.custom('shipping_class', value)
      return accessor
    }

    accessor.attribute = (value) => {
      accessor.custom('attribute', value)
      return accessor
    }

    accessor.attributeTerm = (value) => {
      accessor.custom('attribute_term', value)
      return accessor
    }

    accessor.taxClass = (value) => {
      accessor.custom('tax_class', value)
      return accessor
    }

    accessor.inStock = (value = true) => {
      accessor.custom('in_stock', value)
      return accessor
    }

    accessor.onSale = (value = true) => {
      accessor.custom('on_sale', value)
      return accessor
    }

    accessor.product = (value) => {
      accessor.custom('product', value)
      return accessor
    }

    accessor.minPrice = (value = 0) => {
      accessor.custom('min_price', value)
      return accessor
    }

    accessor.maxPrice = (value = 10000) => {
      accessor.custom('max_price', value)
      return accessor
    }

    accessor.after = (value) => {
      accessor.custom('after', value)
      return accessor
    }

    accessor.before = (value) => {
      accessor.custom('before', value)
      return accessor
    }

    accessor.hideEmpty = (value = true) => {
      accessor.custom('hide_empty', value)
      return accessor
    }

    accessor.order = (value = 'desc') => {
      accessor.custom('order', value)
      return accessor
    }

    accessor.orderby = (value = 'menu_order') => {
      accessor.custom('orderby', value)
      return accessor
    }

    accessor.offset = (value = 100) => {
      accessor.custom('offset', value)
      return accessor
    }

    accessor.search = (value = '') => {
      accessor.custom('search', value)
      return accessor
    }

    accessor.page = (value = 1) => {
      accessor.custom('page', value)
      return accessor
    }

    accessor.perPage = (value = 12) => {
      accessor.custom('per_page', value)
      return accessor
    }

    accessor.category = (value = 0) => {
      accessor.custom('category', value)
      return accessor
    }

    accessor.context = (value = 'view') => {
      accessor.custom('context', value)
      return accessor
    }

    accessor.tag = (value = 0) => {
      accessor.custom('tag', value)
      return accessor
    }

    accessor.fetch = (apiSlug = endpoint.shared.defaultApi, args = null, replace = true) => {
      // Merge args with queries as its just two different ways of using args
      if (args !== null) {
        args.forEach(arg => {
          accessor.custom(arg.key, arg.value)
        })
      }
      return endpoint.fetch(apiSlug, accessor.queries, replace)
    }
  }
}
