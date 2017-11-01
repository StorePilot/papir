<template>
  <div>
    <el-row>
      <el-input
          disabled
          v-model="url"
          class="address"
          style="float: left; width: calc(100% - 160px - 75px - 70px);"
          placeholder="Generated URL"></el-input>
      <el-select
          v-model="shared.method"
          style="float: left; width: 150px; padding: 0; margin: 0 5px;"
          placeholder="Method">
        <el-option
            v-for="method in shared.api.methods"
            :key="method"
            :label="method"
            :value="method">
        </el-option>
        <el-option
            label="FETCH"
            value="FETCH">
        </el-option>
        <el-option
            label="SAVE"
            value="SAVE">
        </el-option>
        <el-option
            label="CREATE"
            value="CREATE">
        </el-option>
        <el-option
            label="REMOVE"
            value="REMOVE">
        </el-option>
        <el-option
            label="UPLOAD"
            value="UPLOAD">
        </el-option>
        <el-option
            label="BATCH"
            value="BATCH">
        </el-option>
      </el-select>
      <el-button
          @click="fire()"
          style="float: left; border-radius: 0; width: 70px; margin: 0 5px 0 0"
          type="warning">
        Fire
      </el-button>
      <el-button
          style="float: left; border-radius: 0; width: 70px; margin: 0;"
          @click="open()"
          type="info">
        Open
      </el-button>
    </el-row>
    <el-row>
      <el-col :sm="3" :lg="2">
        <nav-apis
            @save="save"
            :shared="shared">
        </nav-apis>
      </el-col>
      <el-col :sm="5">
        <conf-api :api="shared.api"></conf-api>
      </el-col>
      <el-col :sm="3" :lg="2">
        <nav-endpoints
            @save="save"
            :shared="shared">
        </nav-endpoints>
      </el-col>
      <el-col :sm="5">
        <conf-endpoint :endpoint="shared.endpoint"></conf-endpoint>
      </el-col>
      <el-col :sm="8" :lg="10">
        <el-row>
          <el-col :sm="24">
            <requester :shared="shared"></requester>
          </el-col>
          <el-col :sm="24">
            <receiver :shared="shared"></receiver>
          </el-col>
        </el-row>
      </el-col>
    </el-row>
  </div>
</template>

<script>
  import navApis from './navApis'
  import navEndpoints from './navEndpoints'
  import confApi from './confApi'
  import confEndpoint from './confEndpoint'
  import requester from './requester'
  import receiver from './receiver'
  export default {
    name: 'cockpit',
    components: {
      navApis,
      navEndpoints,
      confApi,
      confEndpoint,
      requester,
      receiver
    },
    data () {
      return {
        shared: {
          responseConfig: {},
          file: null,
          request: {},
          response: {},
          args: [],
          apis: [],
          api: null,
          endpoint: null,
          ep: null,
          method: 'GET',
          exampleApi: {
            base: 'http://localhost:9001/',
            methods: [
              'GET',
              'POST',
              'PUT',
              'DELETE',
              'OPTIONS'
            ],
            slug: 'wc',
            default: false,
            requester: 'oauth',
            config: {
              authentication: 'oauth',
              version: '1.0a',
              type: 'one_legged',
              algorithm: 'HMAC-SHA1',
              base64: true,
              sort: true,
              emptyParams: false,
              key: '',
              secret: '',
              token: {
                key: '',
                secret: ''
              },
              authQuery: true,
              authHeader: false,
              indexArrays: true,
              addDataToQuery: true,
              addAuthHeaders: false,
              nonce: '',
              nonceLength: 6,
              timestampLength: 10,
              ampersand: true,
              taleNonce: '', // _wpnonce=wcApiSettings.nonce
              headers: [],
              put: {
                authQuery: true,
                authHeader: true,
                override: {
                  arg: '_method',
                  method: 'OPTIONS'
                }
              },
              perform: false
            },
            data: '',
            note: '',
            file: null,
            mappings: []
          },
          exampleEndpoint: {
            name: 'example',
            endpoint: '',
            multiple: false,
            child: '',
            params: [], // Custom params (key / value)
            args: [],
            batch: [
              {key: 'save', value: 'update'},
              {key: 'create', value: 'create'},
              {key: 'delete', value: 'delete'}
            ],
            props: [],
            headers: [],
            identifier: '',
            creationIdentifier: '',
            data: '',
            note: ''
          }
        }
      }
    },
    computed: {
      url () {
        if (this.shared.ep !== null) {
          return this.shared.ep.shared.resolveUrl()
        } else {
          return (this.shared.api.base + (this.shared.endpoint === null ? '' : this.shared.endpoint.endpoint))
        }
      },
      config () {
        if (this.shared.api === null) {
          this.shared.api = this.shared.exampleApi
        }
        let clone = JSON.parse(JSON.stringify(this.shared.api))
        clone.mappings = {}
        this.shared.api.mappings.forEach(endpoint => {
          endpoint = JSON.parse(JSON.stringify(endpoint))
          let argsClone = JSON.parse(JSON.stringify(endpoint.args))
          endpoint.args = {}
          if (argsClone.constructor === Array) {
            argsClone.forEach(arg => {
              endpoint.args[arg.key] = arg.value
            })
          }
          let batchClone = JSON.parse(JSON.stringify(endpoint.batch))
          endpoint.batch = {}
          if (batchClone.constructor === Array) {
            batchClone.forEach(batch => {
              endpoint.batch[batch.key] = batch.value
            })
          }
          let propsClone = JSON.parse(JSON.stringify(endpoint.props))
          endpoint.props = {}
          if (propsClone.constructor === Array) {
            propsClone.forEach(prop => {
              endpoint.props[prop.key] = prop.value
            })
          }
          let headersClone = JSON.parse(JSON.stringify(endpoint.headers))
          endpoint.headers = {}
          if (headersClone.constructor === Array) {
            headersClone.forEach(header => {
              endpoint.headers[header.key] = header.value
            })
          }
          let endpointClone = JSON.parse(JSON.stringify(endpoint))
          delete endpointClone.name

          clone.mappings[endpoint.name] = endpointClone
        })
        let headers = JSON.parse(JSON.stringify(clone.config.headers))
        clone.config.headers = {}
        if (headers.constructor === Array) {
          headers.forEach(arg => {
            clone.config.headers[arg.key] = arg.value
          })
        }
        return clone
      }
    },
    created () {
      this.load()
      if (this.shared.apis.length > 0) {
        this.shared.api = this.shared.apis[0]
        if (typeof this.shared.api.mappings !== 'undefined' && this.shared.api.mappings.length > 0) {
          this.shared.endpoint = this.shared.api.mappings[0]
        }
      }
      let ep = this.genEndpoint(this.config)
      this.genRequest(this.shared.method, ep)
    },
    watch: {
      'shared.api' () {
        let ep = this.genEndpoint(this.config)
        this.genRequest(this.shared.method, ep)
      },
      'shared.endpoint' () {
        if (this.shared.endpoint !== null) {
          if (typeof this.shared.endpoint.params === 'undefined') {
            this.shared.endpoint.params = []
          }
          let ep = this.genEndpoint(this.config)
          this.genRequest(this.shared.method, ep)
        }
      },
      'shared.method' () {
        let ep = this.genEndpoint(this.config)
        this.genRequest(this.shared.method, ep)
      },
      config () {
        let ep = this.genEndpoint(this.config)
        this.genRequest(this.shared.method, ep)
        this.save()
      },
      'api.config.authentication' (value) {
        this.api.requester = value
      }
    },
    methods: {
      open () {
        window.open(this.shared.request.url)
      },
      fire () {
        this.axios.request(this.shared.request).then(response => {
          try {
            this.shared.response = JSON.parse(response)
          } catch (e) {
            this.shared.response = response
          }
        }).catch(error => {
          if (error.response) {
            try {
              this.shared.response = JSON.parse(error.response)
            } catch (e) {
              this.shared.response = error.response
            }
          } else if (error.request) {
            try {
              this.shared.response = JSON.parse(error.request)
            } catch (e) {
              this.shared.response = error.request
            }
          } else {
            this.shared.response = error.message
          }
          this.shared.responseConfig = error.config
        })
      },
      save () {
        localStorage.setItem('papir.apis', JSON.stringify(this.shared.apis))
      },
      load () {
        let apis = localStorage.getItem('papir.apis')
        if (apis !== null) {
          let parsed = JSON.parse(apis)
          // Fix config to work with papir debugger
          parsed.forEach(api => {
            api.mappings.forEach(map => {
              if (typeof map.params === 'undefined') {
                map.params = []
              }
            })
          })
          // Apply
          this.shared.apis = parsed
        } else {
          this.shared.apis.push(JSON.parse(JSON.stringify(this.shared.exampleApi)))
          this.shared.apis[0].mappings.push(JSON.parse(JSON.stringify(this.shared.exampleEndpoint)))
        }
      },
      genEndpoint (val) {
        let api = JSON.parse(JSON.stringify(val))
        let controller = this.$al.controller
        controller.apis[api.slug] = api
        if (api.default || controller.default === null) {
          controller.default = api.slug
        }
        if (
          typeof api.requester !== 'undefined' &&
          typeof controller.requesters[api.requester] !== 'undefined'
        ) {
          api.requester = new controller.requesters[api.requester](api.config)
        } else {
          api.requester = new this.$al.Requester(api.config)
        }
        let endpoint = this.shared.endpoint === null ? '' : this.shared.endpoint.name
        return (this.shared.ep = new this.$al.Endpoint(endpoint, controller, api.slug))
      },
      genRequest (method, endpoint) {
        let apiSlug = null
        let args = this.shared.endpoint.args
        let replace = false
        let perform = false
        let create = true
        let save = true // Enables 'save' in batch
        let file = this.shared.file
        let options = {} // Batch options to enable / disable save, create, delete
        let data = {}
        try {
          data = JSON.parse(this.shared.endpoint.data)
        } catch (e) {
          if (this.shared.endpoint !== null) {
            data = this.shared.endpoint.data
          }
        }
        let upload = false
        let promise = new Promise(resolve => {
          resolve()
        })
        let conf = {}
        if (endpoint !== null) {
          switch (method) {
            case 'FETCH':
              endpoint.fetch(apiSlug, args, replace, perform).then(config => {
                this.shared.request = config
                if (typeof this.shared.request.cancelToken !== 'undefined') {
                  delete this.shared.request.cancelToken
                }
              })
              break
            case 'SAVE':
              endpoint.save(apiSlug, args, replace, create, perform).then(config => {
                this.shared.request = config
                if (typeof this.shared.request.cancelToken !== 'undefined') {
                  delete this.shared.request.cancelToken
                }
              })
              break
            case 'CREATE':
              endpoint.create(apiSlug, args, replace, save, perform).then(config => {
                this.shared.request = config
                if (typeof this.shared.request.cancelToken !== 'undefined') {
                  delete this.shared.request.cancelToken
                }
              })
              break
            case 'REMOVE':
              endpoint.remove(apiSlug, args, replace, perform).then(config => {
                this.shared.request = config
                if (typeof this.shared.request.cancelToken !== 'undefined') {
                  delete this.shared.request.cancelToken
                }
              })
              break
            case 'UPLOAD':
              endpoint.upload(file, apiSlug, args, replace, perform).then(config => {
                this.shared.request = config
                if (typeof this.shared.request.cancelToken !== 'undefined') {
                  delete this.shared.request.cancelToken
                }
              })
              break
            case 'BATCH':
              endpoint.batch(options, apiSlug, args, replace, perform).then(config => {
                this.shared.request = config
                if (typeof this.shared.request.cancelToken !== 'undefined') {
                  delete this.shared.request.cancelToken
                }
              })
              break
            default:
              endpoint[method.toLowerCase()](apiSlug, data, args, upload, promise, conf).then(config => {
                this.shared.request = config
                if (typeof this.shared.request.cancelToken !== 'undefined') {
                  delete this.shared.request.cancelToken
                }
              })
              break
          }
        }
      }
    }
  }
</script>

<style>
  .address input {
    border-radius: 0;
  }
</style>
