import encode from './encode'
import moment from 'moment'

class Util {
  constructor () {
    this.timestamp = (length = 30) => {
      let now = ''
      while (now.length < length) {
        now += '0'
      }
      now = (String(new Date().getTime()) + now).substring(0, length)
      return Number(now)
    }

    this.nonce = (length = 6) => {
      let nonce = ''
      let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      for (let i = 0; i < length; i++) {
        nonce += possible.charAt(Math.floor(Math.random() * possible.length))
      }
      return nonce
    }

    this.stripUri = (url) => {
      let a = document.createElement('a')
      a.setAttribute('href', url)
      return a.protocol + '//' + a.host + a.pathname
    }

    this.getParams = (url, delimiter = '&', splitter = '=', divider = '?') => {
      let params = []
      let split = url.split(divider)
      if (typeof split[1] !== 'undefined') {
        let queries = split[1].split(delimiter)
        queries.forEach(q => {
          q = q.split(splitter)
          if (q.length === 2) {
            params.push({
              key: q[0],
              value: q[1]
            })
          } else {
            params.push({
              key: q[0],
              value: ''
            })
          }
        })
      }
      return params
    }

    this.querystring = {
      /**
       *
       * @param value: any Value to be appended to name. Takes also JSON strings
       * @param options: any Takes also JSON strings
       * @param options.name: String Name to be appended a value
       * @param options.protocol: String URL / Percentage encode protocol. options [ 'rfc3986', 'rfc1738' ]
       * @param options.dateFormat: String @see http://momentjs.com
       * @param options.keepEmpty: boolean Keep or remove keys with empty values
       * @returns querystring - Ex.: 'name=val1&name2[]=val2&name2[]=val3&name3[name4]=val4&name3[name5][]=val5'
       */
      stringify: (value = null, options, first = true) => {
        options = Object.assign({
          name: null,
          protocol: 'rfc3986',
          encodeNull: true,
          dateFormat: '', // Default ISO 8601
          keepEmpty: true,
          delimiter: '&',
          splitter: '=',
          dotNotation: false,
          encodeNames: true,
          encodeValues: true,
          excludes: [], // At first level
          includes: [], // At first level. includes overrides excludes
          arrayIndexOpen: '[',
          arrayIndexClose: ']'
        }, options)
        let querystring = ''
        let name = options.name
        let error = false
        if (
          first &&
          name !== null &&
          typeof name === 'string' &&
          options.excludes.indexOf(name) !== -1 &&
          options.includes.indexOf(name) === -1
        ) {
          options.name = null
        }
        if (first && options.encodeNames && name !== null) {
          name = encode.encode(name, options.protocol, options.encodeNull)
        }
        try {
          value = JSON.parse(value)
        } catch (e) {} finally {
          if (typeof value === 'undefined' && name !== null) {
            // undefined
          } else if (value === null && name !== null) {
            // null
          } else if (typeof value === 'string' && name !== null) {
            // string
          } else if (typeof value === 'number' && name !== null) {
            // number
          } else if (typeof value === 'boolean' && name !== null) {
            // boolean
          } else if (typeof value === 'function' && name !== null) {
            // function
            value = value.toString()
          } else if (value.constructor === Date && name !== null) {
            // date
            value = moment(value).format(options.dateFormat)
          } else if (value.constructor === Array && name !== null) {
            value.forEach(val => {
              let arrayIdentifier = (options.arrayIndexOpen + options.arrayIndexClose)
              querystring += this.querystring.stringify(val, Object.assign(options, {
                name: name + (options.encodeNames ? encode.encode(arrayIdentifier, options.protocol, options.encodeNull) : arrayIdentifier)
              }), false)
            })
            // Array
          } else if (value.constructor === Object) {
            Object.keys(value).forEach(key => {
              if (
                options.excludes.indexOf(key) === -1 ||
                options.includes.indexOf(key) !== -1 ||
                !first
              ) {
                if (name === null) {
                  querystring += this.querystring.stringify(value[key], Object.assign(options, {
                    name: options.encodeNames ? encode.encode(key, options.protocol, options.encodeNull) : key
                  }), false)
                } else {
                  let keyConverted = options.dotNotation ? ('.' + key) : (options.arrayIndexOpen + key + options.arrayIndexClose)
                  keyConverted = options.encodeNames ? encode.encode(keyConverted, options.protocol, options.encodeNull) : keyConverted
                  querystring += this.querystring.stringify(value[key], Object.assign(options, {
                    name: name + keyConverted
                  }), false)
                }
              }
            })
            // Object
          } else {
            console.error({
              message: 'Uknown datatype. Could not stringify value to querystring',
              data: options
            })
            error = true
            // Unknown
          }
          if (!error && value.constructor !== Array && value.constructor !== Object) {
            if (name !== null && name !== '' && value !== '') {
              if (options.encodeValues) {
                value = encode.encode(value, options.protocol, options.encodeNull)
              }
              querystring += name + options.splitter + value + options.delimiter
            } else if (name !== null && name !== '' && options.keepEmpty) {
              querystring += name + options.splitter + options.delimiter
            }
          }
        }
        // Remove last delimiter
        if (first && querystring !== '') {
          querystring = querystring.slice(0, -1)
        }
        return querystring
      },
      /**
       *
       * @param querystring
       * @param delimiter
       * @param splitter
       * @param divider
       * @param indexEncodedArrays
       * @returns {*}
       */
      indexArrays: (querystring, delimiter = '&', splitter = '=', divider = '?', indexEncodedArrays = true) => {
        let preserved = ''
        let qIndex = querystring.indexOf(divider)
        if (qIndex !== -1) {
          preserved = querystring.substr(0, (qIndex + 1))
          querystring = querystring.substr((qIndex + 1))
        }
        let params = querystring.split(delimiter)
        let preKey = null
        let filled = []
        let i = 0
        params.forEach(param => {
          if (param.indexOf('[]') !== -1) {
            if (i === 0 || param.indexOf(preKey) === -1) {
              i = 0
              let key = preKey = param.split(splitter)[0]
              key = key.replace(/\[\]/g, '[0]')
              param = param.replace(preKey, key)
              i++
            } else if (preKey !== null && param.indexOf(preKey) !== -1) {
              let key = param.split(splitter)[0]
              let index = key.lastIndexOf('[]')
              key = key.substring(0, index) + '[' + i + ']' + key.substring(index + 3)
              key = key.replace(/\[\]/g, '[0]')
              param = param.replace(preKey, key)
              i++
            }
          } else if (param.indexOf('%5B%5D') !== -1 && indexEncodedArrays) {
            if (i === 0 || param.indexOf(preKey) === -1) {
              i = 0
              let key = preKey = param.split(splitter)[0]
              key = key.replace(/%5B%5D/g, '%5B0%5D')
              param = param.replace(preKey, key)
              i++
            } else if (preKey !== null && param.indexOf(preKey) !== -1) {
              let key = param.split(splitter)[0]
              let index = key.lastIndexOf('%5B%5D')
              key = key.substring(0, index) + '%5B' + i + '%5D' + key.substring(index + 7)
              key = key.replace(/%5B%5D/g, '%5B0%5D')
              param = param.replace(preKey, key)
              i++
            }
          } else {
            i = 0
            preKey = null
          }
          filled.push(param)
        })
        querystring = preserved
        filled.forEach(param => {
          querystring += param + delimiter
        })
        return filled.length > 0 ? querystring.slice(0, -1) : querystring
      },
      /**
       * Encode arguments after first divider until second divider
       * Ex.: ignored?encoded?ignored?ignored @todo - encode all after first ?
       * @param string
       * @param options
       * @returns {string}
       */
      encode: (string, options) => {
        options = Object.assign({
          protocol: 'rfc3986',
          divider: '?',
          delimiter: '&',
          splitter: '=',
          encodeNull: true,
          keepEmpty: true,
          encodeNames: true,
          encodeValues: true
        }, options)
        let split = [
          string.substring(0, string.indexOf(options.divider)),
          string.substring(string.indexOf(options.divider) + 1)
        ]
        let encoded = ''
        if (string.indexOf(options.divider) !== -1) {
          let params = split[1].split(options.delimiter)
          params.forEach(param => {
            let query = param.split(options.splitter)
            let key = ''
            let value = ''
            if (query.length > 1) {
              let i = 0
              query.forEach(q => {
                if (i === 0) {
                  key = options.encodeNames ? encode.encode(q, options.protocol, options.encodeNull) : q
                } else if (i === 1) {
                  value = options.encodeValues ? encode.encode(q, options.protocol, options.encodeNull) : q
                } else {
                  value +=
                    (options.encodeValues ? encode.encode(options.splitter, options.protocol, options.encodeNull) : options.splitter) +
                    (options.encodeValues ? encode.encode(q, options.protocol, options.encodeNull) : q)
                }
                i++
              })
            } else if (query.length === 1) {
              key = options.encodeNames ? encode.encode(query[0], options.protocol, options.encodeNull) : query[0]
            }
            if (key !== '' && value !== '') {
              encoded += key + options.splitter
              encoded += value + options.delimiter
            } else if (key !== '' && options.keepEmpty) {
              encoded += key + options.splitter + options.delimiter
            }
          })
          if (encoded !== '') {
            encoded = encoded.slice(0, -1)
          }
        } else {
          split[0] = string
          delete split[1]
        }
        // Rebuild arguments
        string = ''
        let i = 0
        split.forEach(part => {
          if (i === 1) {
            string += encoded + options.divider
          } else {
            string += part + options.divider
          }
          i++
        })
        if (string !== '') {
          string = string.slice(0, -1)
        }
        return string
      }
    }
  }
}

export default new Util()
