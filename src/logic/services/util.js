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
       * @param first: boolean
       * @returns querystring - Ex.: 'name=val1&name2[]=val2&name2[]=val3&name3[name4]=val4&name3[name5][]=val5'
       */
      stringify: (value = null, options, first = true) => {
        options = Object.assign({
          name: null,
          protocol: 'rfc3986',
          encodeNull: true,
          dateFormat: '', // Default ISO 8601
          keepEmpty: true,
          keepNull: true,
          delimiter: '&',
          splitter: '=',
          dotNotation: false,
          encodeNames: true,
          encodeValues: true,
          indexArrays: true,
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
          if (value !== "\"\"") {
            value = JSON.parse(value)
          }
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
            let i = 0
            // Handle empty arrays @todo - Make customable values. Ex. null, '', '[]', 0 or delete it etc.
            if (value.length === 0) {
              value = [{ id: null }]
            }
            value.forEach(val => {
              let arrayIdentifier = (options.arrayIndexOpen + (options.indexArrays ? i : '') + options.arrayIndexClose)
              querystring += this.querystring.stringify(val, Object.assign(options, {
                name: name + (options.encodeNames ? encode.encode(arrayIdentifier, options.protocol, options.encodeNull) : arrayIdentifier)
              }), false)
              i++
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
            /* console.error({
              message: 'Unknown datatype. Could not stringify value to querystring',
              data: options
            }) */
            error = true
            // Unknown
          }
          if (!error && (value === null || (value.constructor !== Array && value.constructor !== Object))) {
            if (name !== null && name !== '' && value !== '') {
              if (options.encodeValues && (value !== null || options.keepNull)) {
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
       * @see https://jsfiddle.net/b4su0jvs/48/
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
        let doIndexing = (params, arrStart = '[', arrEnd = ']') => {
          let arrUnindexed = arrStart + arrEnd
          let indices = []
          let prevKey = ''
          let parsed = []
          params.forEach(param => {
            let key = param.split(splitter)[0]
            let value = param.split(splitter)[1]
            // Secure that we have indices for all arrays in param
            while (indices.length < (key.split(arrUnindexed).length - 1)) {
              indices.push(0) // Start indexing from 0
            }
            // Secure that indices is not more than amount of arrays
            while (indices.length !== (key.split(arrUnindexed).length - 1)) {
              indices.pop() // Remove indices not used
            }
            // Iterate through arrays in param
            let count = 0 // Hold track for which array we are in
            indices.forEach(i => {
              let index = key.indexOf(arrUnindexed) // index position start of array in param
              let arraySpace = (arrStart + i + arrEnd).length // space used by array
              let endIndex = index + arraySpace // index position end of array in param
              if (
                key.replace(arrUnindexed, arrStart + i + arrEnd).substring(0, endIndex) === prevKey.substring(0, endIndex) &&
                key.replace(arrUnindexed, arrStart + i + arrEnd).indexOf(arrUnindexed) !== -1
              ) {
                // param is equal to prev at this index and has more unindexed arrays
                key = key.replace(arrUnindexed, arrStart + i + arrEnd)
              } else if (
                key.replace(arrUnindexed, arrStart + i + arrEnd).substring(0, endIndex) === prevKey.substring(0, endIndex) &&
                key.replace(arrUnindexed, arrStart + i + arrEnd).indexOf(arrUnindexed) === -1
              ) {
                if (key.length > (index + arrUnindexed.length)) {
                  // param has more indexed arrays after this index
                  let increment = false
                  parsed.forEach(parse => {
                    let parseKey = parse.split(splitter)[0]
                    if (key.substring((endIndex - 1)) === parseKey.substring(endIndex)) {
                      // keystring after this array index is equal to some prev
                      if (key.substring(0, index) === parseKey.substring(0, index)) {
                        // keystring before this array index is equal to some prev
                        increment = true
                      }
                    }
                  })
                  if (increment) {
                    i++
                  }
                } else {
                  // this is the last element on key
                  i++
                }
                key = key.replace(arrUnindexed, arrStart + i + arrEnd)
              } else {
                // param is not equal to prev param at this index
                i = 0
                key = key.replace(arrUnindexed, arrStart + i + arrEnd)
                // if param matches other parsed params at this index, increment prev array +1 from match
                parsed.forEach(parse => {
                  if (parse.substring(0, endIndex) === key.substring(0, endIndex)) {
                    let subparse = parse.substring(0, parse.lastIndexOf(arrStart + i + arrEnd))
                    let start = subparse.lastIndexOf(arrStart)
                    let end = subparse.lastIndexOf(arrEnd)
                    let preIndex = Number(key.substring((start + 1), end))
                    // Find last array before current index of param where array is indexed by number
                    while (subparse.lastIndexOf(arrStart) !== -1 && isNaN(preIndex) && end > start && start !== -1) {
                      subparse = subparse.substring(0, subparse.lastIndexOf(arrStart))
                      start = subparse.lastIndexOf(arrStart)
                      end = subparse.lastIndexOf(arrEnd)
                      preIndex = Number(key.substring((start + 1), end))
                    }
                    if (isNaN(preIndex)) {
                      // No other arrays before this index is indexed by number, increment last '[' + i + ']'
                      key = key.substring(0, key.lastIndexOf(arrStart + i + arrEnd)) + arrStart + (i + 1) + arrEnd
                      i++
                    } else {
                      // preIndex should increment
                      key = key.substring(0, (start + 1)) + (preIndex + 1) + key.substring(end)
                      i = 0
                      indices[(count - 1)] = (preIndex + 1) // update prev indice
                    }
                  }
                })
              }
              indices[count] = i
              count++
            })
            prevKey = key
            parsed.push(key + (param.split(splitter).length > 1 ? (splitter + (typeof value !== 'undefined' ? value : '')) : ''))
          })
          return parsed
        }
        querystring = preserved
        let parsed = doIndexing(params)
        if (indexEncodedArrays) {
          parsed = doIndexing(params, '%5B', '%5D')
        }
        parsed.forEach(param => {
          querystring += param + delimiter
        })
        return parsed.length > 0 ? querystring.slice(0, -1) : querystring
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
