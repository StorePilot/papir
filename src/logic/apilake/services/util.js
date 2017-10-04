class Util {

  constructor () {
    this.timestamp = (length = 30) => {
      return Number(String(new Date().getTime()).substring(0, length))
    }

    this.nonce = (length = 6) => {
      let nonce = ''
      let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      for (let i = 0; i < length; i++) {
        nonce += possible.charAt(Math.floor(Math.random() * possible.length))
      }
      return nonce
    }

    this.indexArrayQuery = (url) => {
      let preserved = ''
      let qIndex = url.indexOf('?')
      if (qIndex !== -1) {
        preserved = url.substr(0, qIndex)
        url = url.substr((qIndex + 1))
      }
      let params = url.split('&')
      let preKey = null
      let filled = []
      let i = 0
      params.forEach(param => {
        if (param.indexOf('[]') !== -1) {
          if (i === 0 || param.indexOf(preKey) === -1) {
            i = 0
            let key = preKey = param.split('=')[0]
            key = key.replace(/\[\]/g, '[0]')
            param = param.replace(preKey, key)
            i++
          } else if (preKey !== null && param.indexOf(preKey) !== -1) {
            let key = param.split('=')[0]
            let index = key.lastIndexOf('[]')
            key = key.substring(0, index) + '[' + i + ']' + key.substring(index + 3)
            key = key.replace(/\[\]/g, '[0]')
            param = param.replace(preKey, key)
            i++
          }
        } else {
          i = 0
          preKey = null
        }
        filled.push(param)
      })
      url = preserved
      filled.forEach(param => {
        url += param + '&'
      })
      return filled.length > 0 ? url.slice(0, -1) : url
    }

    this.stripUri = (url) => {
      let a = document.createElement('a')
      a.setAttribute('href', url)
      return a.protocol + '//' + a.host + a.pathname
    }

    this.getParams = (url) => {
      let params = []
      let split = url.split('?')
      if (typeof split[1] !== 'undefined') {
        let queries = split[1].split('&')
        queries.forEach(q => {
          q = q.split('=')
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
  }

}

export default new Util()
