import crypto from 'crypto'
import axios from 'axios'
import qs from 'querystring'
import { Controller } from 'papir'

export default class Woo {
  constructor(
    url = 'localhost',
    appname = 'MyApp',
    authenticaton = 'none',
    client_id = '', // or nonce key
    client_secret = '', // or nonce value
    salt = 'HMAC short living salt',
    pepper = 'HMAC short living pepper'
  ) {
    this.url = url
    this.authenticaton = authenticaton
    this.client_id = client_id
    this.client_secret = client_secret
    this.token = crypto
      .createHmac('sha256', salt)
      .update(pepper)
      .digest('hex')
    this.controller = new Controller({
      config: {},
      apis: [
        {
          base: url,
          slug: 'wc',
          default: true,
          requester: 'oauth',
          config: {
            authQuery: true,
            authHeader: false,
            indexArrays: true,
            addDataToQuery: true,
            timestampLength: 10,
            put: { override: { arg: '_method', method: 'POST' } },
            delete: {
              authQuery: true,
              override: { arg: '_method', method: 'POST' }
            }
          },
          mappings: {}
        }
      ]
    })
    this.authUrl =
      `${url}/wc-auth/v1/authorize?` +
      qs.stringify({
        app_name: appname,
        scope: 'read_write',
        user_id: this.token,
        return_url:
          'https://storepilot.lib.id/storepilot-service/return/?fallback_url=https://storepilot.com/account?fallback&installation_url=https://storepilot.com/account?authorized&token=' +
          this.token,
        callback_url: 'https://storepilot.lib.id/storepilot-service/callback/'
      })
  }

  authenticate() {
    window.open(this.authUrl)
    return this.validate()
  }

  validate() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        axios
          .post('https://storepilot.lib.id/storepilot-service/authorize/', {
            token: this.token
          })
          .then(results => {
            if (results.data.success) {
              resolve(results.data.data)
            } else {
              this.validate()
                .then(() => {
                  resolve(results.data.data)
                })
                .catch(e => {
                  reject(e)
                })
            }
          })
          .catch(e => {
            reject(e)
          })
      }, 1000)
    })
  }

  authorize() {
    if (this.authenticaton === 'none') {
      this.controller.config({
        config: {
          authentication(request) {
            request.url.indexOf('?') === -1
              ? (request.url += '?')
              : (request.url += '&')
            return request
          }
        }
      })
    } else if (this.authenticaton === 'nonce') {
      this.controller.config({
        config: {
          authentication(request) {
            request.url.indexOf('?') === -1
              ? (request.url += '?')
              : (request.url += '&')
            this.client_id = this.client_id ? this.client_id : 'wp_nonce'
            this.client_secret = this.client_secret ? this.client_secret : ''
            return request + this.client_id + '=' + this.client_secret
          }
        }
      })
    } else if (this.url.substr(0, 5) === 'https') {
      this.controller.config({
        config: {
          authentication(request) {
            request.url.indexOf('?') === -1
              ? (request.url += '?')
              : (request.url += '&')
            request.url +=
              `consumer_key=${this.client_id}` +
              `&consumer_secret=${this.client_secret}`
            return request
          }
        }
      })
    } else {
      this.controller.config({
        config: {
          key: this.client_id,
          secret: this.client_secret,
          authentication: 'oauth',
          version: '1.0a',
          type: 'one_legged',
          algorithm: 'HMAC-SHA1',
          timestampLength: 10
        }
      })
    }
  }
}
