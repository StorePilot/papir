/**
 * Query
 */
export default class Query {

  constructor (list, apis, model, clear = true, api = null) {
    if (api === null) {
      api = apis.defaultApiId()
    }
    let query = this
    let queryMappings = apis.permitted[api].models[model._type].query_mappings
    let queries = []

    this._append = function (q, v) {
      let newQ = []
      queries.forEach(query => {
        if (query.q !== q) {
          newQ.push(query)
        }
      })
      newQ.push({
        q: q,
        v: v
      })
      queries = newQ
    }

    this._build = function () {
      let qs = '?'
      queries.forEach(query => {
        if (qs !== '?') {
          qs += '&'
        }
        if (query.v !== '') {
          qs += query.q + '=' + query.v
        } else {
          qs += query.q
        }
      })
      return qs
    }

    this.order = function (value = 'desc') {
      query._append(queryMappings.order, value)
      return query
    }

    this.orderby = function (value = 'menu_order') {
      query._append(queryMappings.order_by, value)
      return query
    }

    this.offset = function (value = 100) {
      query._append(queryMappings.offset, value)
      return query
    }

    this.search = function (value = '') {
      query._append(queryMappings.search, value)
      return query
    }

    this.page = function (value = 1) {
      query._append(queryMappings.page, value)
      return query
    }

    this.perPage = function (value = 12) {
      query._append(queryMappings.per_page, value)
      return query
    }

    this.category = function (value = 0) {
      query._append(queryMappings.category, value)
      return query
    }

    this.tag = function (value = 0) {
      query._append(queryMappings.tag, value)
      return query
    }

    this.custom = function (value = '') {
      query._append(value, '')
      return query
    }

    this.fetch = function () {
      return list.fetch(query._build(), clear, api)
    }
  }
}
