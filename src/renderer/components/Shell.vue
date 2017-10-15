<template>
  <el-row style="height: 100%;">
    <el-col :sm="5" :lg="3" style="min-height: calc(100% - 36px);">
      <el-menu style="min-height: calc(100vh - 36px);" default-active="0" class="el-menu-vertical-demo" theme="dark">
        <h3 style="color: white; margin: 20px;">API's</h3>
        <el-menu-item v-for="(api, index) in apis" :index="String(index)" :key="api.slug">
          {{api.slug}}
        </el-menu-item>
      </el-menu>
    </el-col>
    <el-col :sm="5" :lg="3">
      <el-menu style="min-height: calc(100vh - 36px);" default-active="0" class="el-menu-vertical-demo">
        <h3 style="margin: 20px;">Endpoints</h3>
        <el-menu-item v-for="(endpoint, index) in api.mappings" :index="String(index)" :key="endpoint.name">
          {{endpoint.name}}
        </el-menu-item>
      </el-menu>
    </el-col>
    <el-col :sm="14" :lg="18">
      <el-tabs type="border-card" style="max-height: 44vh; overflow-y: scroll;" v-model="activeTab">

        <el-tab-pane name="api" label="API">
          <el-col :lg="12" style="padding: 10px;">
            <h3>API - Base URL</h3>
            <el-input v-model="api.base" placeholder="http://myapi.com/v2"></el-input>
            <h3>Supports</h3>
            <el-select
                v-model="api.methods"
                multiple
                filterable
                allow-create
                placeholder="Choose tags for your article">
              <el-option
                  v-for="item in api.methods"
                  :key="item"
                  :label="item"
                  :value="item">
              </el-option>
            </el-select>
          </el-col>
          <el-col :lg="12" style="padding: 10px;">
            <h3>Slug</h3>
            <el-input v-model="api.slug" placeholder="Used by APILake for API lookup"></el-input>
            <h3>Default / Primary API</h3>
            <el-switch
                v-model="api.default"
                on-color="#13ce66"
                off-color="#ff4949">
            </el-switch>
          </el-col>
        </el-tab-pane>

        <el-tab-pane name="endpoint" label="Endpoint">
          <el-col :lg="12" style="padding: 10px;">
            <h3>Endpoint - Path</h3>
            <el-input v-model="endpoint.endpoint" placeholder="/users{/id}"></el-input>
            <h3>Identifier</h3>
            <el-input v-model="endpoint.identifier" placeholder="Usually the id property"></el-input>
            <h3>Creation Identifier</h3>
            <el-input v-model="endpoint.creationIdentifier" placeholder="Usually the id property"></el-input>
          </el-col>
          <el-col :lg="12" style="padding: 10px;">
            <h3>
              Multiple
              <span style="font-size: .7em">
                Does the endpoint respond with single or multiple elements
              </span>
            </h3>
            <el-switch
                v-model="endpoint.multiple"
                on-color="#13ce66"
                off-color="#ff4949">
            </el-switch>
            <h3 v-show="endpoint.multiple">
              Child
              <span style="font-size: .7em">
                If this endpoint has multiple elements, map to children endpoint
              </span>
            </h3>
            <el-input
                v-show="endpoint.multiple"
                v-model="endpoint.child"
                placeholder="Ex. if this EP is 'products' you can insert 'product'"></el-input>
          </el-col>
        </el-tab-pane>

        <el-tab-pane name="mapping" label="Endpoint Mapping">
          <el-col :lg="12" style="padding: 10px;">
            <h3>Properties Mapping</h3>
            <div class="el-table">
              <table style="width: 100%; text-align: left">
                <tr>
                  <th>Key</th>
                  <th>Value</th>
                  <th>Delete</th>
                </tr>
                <tr v-for="(prop, index) in endpoint.props">
                  <td>
                    <el-input v-model="prop.key"></el-input>
                  </td>
                  <td>
                    <el-input v-model="prop.value"></el-input>
                  </td>
                  <td>
                    <el-button style="margin-bottom: 20px" @click="endpoint.props.splice(index, 1)">Clear</el-button>
                  </td>
                </tr>
              </table>
            </div>
            <el-button style="margin-top: 10px;" @click="endpoint.props.push({ key: '', value: '' })">Add</el-button>
            <h3>Headers Mapping</h3>
            <div class="el-table">
              <table style="width: 100%; text-align: left">
                <tr>
                  <th>Key</th>
                  <th>Value</th>
                  <th>Delete</th>
                </tr>
                <tr v-for="(head, index) in endpoint.headers">
                  <td>
                    <el-input v-model="head.key"></el-input>
                  </td>
                  <td>
                    <el-input v-model="head.value"></el-input>
                  </td>
                  <td>
                    <el-button style="margin-bottom: 20px" @click="endpoint.headers.splice(index, 1)">Clear</el-button>
                  </td>
                </tr>
              </table>
            </div>
            <el-button style="margin-top: 10px;" @click="endpoint.headers.push({ key: '', value: '' })">Add</el-button>
          </el-col>
          <el-col :lg="12" style="padding: 10px;">
            <h3>Arguments Mapping</h3>
            <div class="el-table">
              <table style="width: 100%; text-align: left">
                <tr>
                  <th>Key</th>
                  <th>Value</th>
                  <th>Delete</th>
                </tr>
                <tr v-for="(arg, index) in endpoint.args">
                  <td>
                    <el-input v-model="arg.key"></el-input>
                  </td>
                  <td>
                    <el-input v-model="arg.value"></el-input>
                  </td>
                  <td>
                    <el-button style="margin-bottom: 20px" @click="endpoint.args.splice(index, 1)">Clear</el-button>
                  </td>
                </tr>
              </table>
            </div>
            <el-button style="margin-top: 10px;" @click="endpoint.args.push({ key: '', value: '' })">Add</el-button>
            <h3>Batch Mapping</h3>
            <div class="el-table">
              <table style="width: 100%; text-align: left">
                <tr>
                  <th>Key</th>
                  <th>Value</th>
                  <th>Delete</th>
                </tr>
                <tr v-for="(map, index) in endpoint.batch">
                  <td>
                    <el-input v-model="map.key"></el-input>
                  </td>
                  <td>
                    <el-input v-model="map.value"></el-input>
                  </td>
                  <td>
                    <el-button style="margin-bottom: 20px" @click="endpoint.batch.splice(index, 1)">Clear</el-button>
                  </td>
                </tr>
              </table>
            </div>
            <el-button style="margin-top: 10px;" @click="endpoint.batch.push({ key: '', value: '' })">Add</el-button>
          </el-col>
        </el-tab-pane>

        <el-tab-pane name="data" label="Data">
          <el-col :lg="12" style="padding: 10px;">
            <h3>Data Type</h3>
            <el-select
                v-model="api.dataType"
                filterable
                allow-create
                placeholder="Choose Data Type">
              <el-option label="Not set" value=""></el-option>
              <el-option label="text/plain" value="text/plain"></el-option>
              <el-option label="application/json" value="application/json"></el-option>
            </el-select>
            <h3>
              File
            </h3>
            <el-upload
                style="width: 100%;"
                class="upload-demo"
                drag
                action="https://jsonplaceholder.typicode.com/posts/"
                multiple>
              <i class="el-icon-upload"></i>
              <div class="el-upload__text">Drop file here or <em>click to upload</em></div>
            </el-upload>
          </el-col>
          <el-col :lg="12" style="padding: 10px;">
            <h3>Charset</h3>
            <el-select
                v-model="api.charset"
                filterable
                allow-create
                placeholder="Choose Charset">
              <el-option label="Not set" value=""></el-option>
              <el-option label="utf-8" value="utf-8"></el-option>
              <el-option label="utf-16" value="utf-16"></el-option>
            </el-select>
            <h3>
              Data
            </h3>
            <el-input
                type="textarea"
                :rows="7"
                placeholder="Type here"
                v-model="api.data">
            </el-input>
          </el-col>
        </el-tab-pane>

        <el-tab-pane name="params" label="Query Params">
          <el-col :lg="12" style="padding: 10px;">
            <h3>
              Index Arrays
              <span style="font-size: .7em; font-weight: normal;">
                ( [0][2][1] instead of [][][] )
              </span>
            </h3>
            <el-switch
                v-model="api.config.indexArrays"
                on-color="#13ce66"
                off-color="#ff4949">
            </el-switch>
            <h3>Append JSON Data to Query Params</h3>
            <el-switch
                v-model="api.config.addDataToQuery"
                on-color="#13ce66"
                off-color="#ff4949">
            </el-switch>
            <h3>Keep empty params</h3>
            <el-switch
                v-model="api.config.emptyParams"
                on-color="#13ce66"
                off-color="#ff4949">
            </el-switch>
          </el-col>
          <el-col :lg="12" style="padding: 10px;">
            <h3>Custom Arguments</h3>
            <div class="el-table">
              <table style="width: 100%; text-align: left">
                <tr>
                  <th>Key</th>
                  <th>Value</th>
                  <th>Delete</th>
                </tr>
                <tr v-for="(arg, index) in args">
                  <td>
                    <el-input v-model="arg.key"></el-input>
                  </td>
                  <td>
                    <el-input v-model="arg.value"></el-input>
                  </td>
                  <td>
                    <el-button style="margin-bottom: 20px" @click="args.splice(index, 1)">Clear</el-button>
                  </td>
                </tr>
              </table>
            </div>
            <el-button style="margin-top: 10px;" @click="args.push({ key: '', value: '' })">Add</el-button>
          </el-col>
        </el-tab-pane>

        <el-tab-pane name="auth" label="Authentication">
          <el-col :lg="12" style="padding: 10px;">
            <h3>Authentication Method</h3>
            <el-select v-model="api.config.authentication" placeholder="Select">
              <el-option label="No Security" value=""></el-option>
              <el-option label="Basic Authentication" value="basic"></el-option>
              <el-option label="OAuth" value="oauth"></el-option>
            </el-select>
            <h3>Authentication Version</h3>
            <el-select v-model="api.config.version" placeholder="Select">
              <el-option label="Not specified" value=""></el-option>
              <el-option label="1.0a" value="1.0a"></el-option>
              <el-option label="2" value="2"></el-option>
            </el-select>
            <h3>Authentication Type</h3>
            <el-select v-model="api.config.type" placeholder="Select">
              <el-option label="Not specified" value=""></el-option>
              <el-option label="One legged" value="one_legged"></el-option>
              <el-option label="Two legged" value="two_legged"></el-option>
              <el-option label="Three legged" value="three_legged"></el-option>
              <el-option label="Request token" value="request_token"></el-option>
            </el-select>
            <h3>Encryption Algorithm</h3>
            <el-select v-model="api.config.algorithm" placeholder="Select">
              <el-option label="Not specified" value=""></el-option>
              <el-option label="HMAC-SHA1" value="HMAC-SHA1"></el-option>
              <el-option label="HMAC-SHA256" value="HMAC-SHA256"></el-option>
              <el-option label="MD5" value="MD5"></el-option>
            </el-select>
          </el-col>
          <el-col :lg="12" style="padding: 10px;">
            <h3>Client ID</h3>
            <el-input v-model="api.config.key"></el-input>
            <h3>Client Secret</h3>
            <el-input v-model="api.config.secret"></el-input>
            <h3>Token Key</h3>
            <el-input v-model="api.config.token.key"></el-input>
            <h3>Token Secret</h3>
            <el-input v-model="api.config.token.secret"></el-input>
          </el-col>
        </el-tab-pane>

        <el-tab-pane name="sign" label="Signature">
          <el-col :lg="12" style="padding: 10px;">
            <h3>Nonce</h3>
            <el-input placeholder="Auto generated if not set" v-model="api.config.nonce"></el-input>
            <h3>Nonce Length</h3>
            <el-input-number v-model="api.config.nonceLength"></el-input-number>
            <h3>Timestamp Length</h3>
            <el-input-number v-model="api.config.timestampLength"></el-input-number>
          </el-col>
          <el-col :lg="12" style="padding: 10px;">
            <h3>Base64 Encode Signature</h3>
            <el-switch
                v-model="api.config.base64"
                on-color="#13ce66"
                off-color="#ff4949">
            </el-switch>
            <h3>Ampersand (&) after Client Id if Empty Secret</h3>
            <el-switch
                v-model="api.config.ampersand"
                on-color="#13ce66"
                off-color="#ff4949">
            </el-switch>
            <h3>Sort Params</h3>
            <el-switch
                v-model="api.config.sort"
                on-color="#13ce66"
                off-color="#ff4949">
            </el-switch>
          </el-col>
        </el-tab-pane>

        <el-tab-pane name="cookies" label="Cookies">
          <el-col :lg="12" style="padding: 10px;">
            <h3>Cookie Nonce Generation by Localized variable</h3>
            <el-input v-model="api.config.taleNonce"></el-input>
          </el-col>
          <el-col :lg="12" style="padding: 10px;">
            <h3>Base64 Encode Signature</h3>
            <el-switch
                v-model="api.config.base64"
                on-color="#13ce66"
                off-color="#ff4949">
            </el-switch>
            <h3>Ampersand (&) after Client Id if Empty Secret</h3>
            <el-switch
                v-model="api.config.ampersand"
                on-color="#13ce66"
                off-color="#ff4949">
            </el-switch>
          </el-col>
        </el-tab-pane>

        <el-tab-pane name="headers" label="Headers">
          <h3>Add Authentication Params to Header</h3>
          <el-switch
              v-model="api.config.addAuthHeaders"
              on-color="#13ce66"
              off-color="#ff4949">
          </el-switch>
        </el-tab-pane>

        <el-tab-pane name="cors" label="Cross Origin">
          <h3>Use OPTIONS requests with _method to override</h3>
          <el-switch
              v-model="api.config.dualAuth"
              on-color="#13ce66"
              off-color="#ff4949">
          </el-switch>
          <h3>Use OPTIONS requests with _method to override for PUT only</h3>
          <el-switch
              v-model="api.config.put.dualAuth"
              on-color="#13ce66"
              off-color="#ff4949">
          </el-switch>
          <h3>Preflight Monitor</h3>
          <span>Should notify if anything could cause preflight</span>
        </el-tab-pane>
        <el-tab-pane name="view" label="Overview">
          <pre>{{config}}</pre>
        </el-tab-pane>
      </el-tabs>
      <el-row style="max-height: 44vh; overflow-y: scroll;">
        <el-col :sm="24" :lg="12">
          <el-card style="margin: 20px 10px 10px;" class="box-card">
            <div slot="header" class="clearfix">
              <span style="line-height: 36px;">Request</span>
              <el-button style="float: right" type="warning">Fire</el-button>
              <el-select
                v-model="method"
                style="float: right; width: 150px; margin-right: 10px;"
                placeholder="Method">
                <el-option
                  v-for="method in api.methods"
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
            </div>
            <pre>{{request}}</pre>
          </el-card>
        </el-col>
        <el-col :sm="24" :lg="12">
          <el-card style="margin: 20px 10px 0 10px;" class="box-card">
            <div slot="header" class="clearfix">
              <span style="line-height: 36px;">Response</span>
            </div>
            <h5>Preflight</h5>
            <h5>Status Code</h5>
            <h5>Headers</h5>
            <h5>Data</h5>
          </el-card>
        </el-col>
      </el-row>
      <el-col :lg="24">
        <el-steps align-center center style="margin: 20px;" :space="100" :active="step">
          <div
              @click="activeTab='api'"
              class="el-step is-horizontal"
              style="width: 100px; margin-right: -2.8px; cursor: pointer">
            <el-step icon="setting" title="API"></el-step>
          </div>
          <div
              @click="activeTab='endpoint'"
              class="el-step is-horizontal"
              style="width: 100px; margin-right: -2.8px; cursor: pointer">
            <el-step icon="share" title="Endpoint"></el-step>
          </div>
          <div
              @click="activeTab='mapping'"
              class="el-step is-horizontal"
              style="width: 100px; margin-right: -2.8px; cursor: pointer">
            <el-step icon="d-arrow-right" title="Mapping"></el-step>
          </div>
          <div
              @click="activeTab='data'"
              class="el-step is-horizontal"
              style="width: 100px; margin-right: -2.8px; cursor: pointer">
            <el-step icon="picture" title="Data"></el-step>
          </div>
          <div
              @click="activeTab='params'"
              class="el-step is-horizontal"
              style="width: 100px; margin-right: -2.8px; cursor: pointer">
            <el-step icon="search" title="Params"></el-step>
          </div>
          <div
              @click="activeTab='auth'"
              class="el-step is-horizontal"
              style="width: 100px; margin-right: -2.8px; cursor: pointer">
            <el-step icon="warning" title="Auth"></el-step>
          </div>
          <div
              @click="activeTab='sign'"
              class="el-step is-horizontal"
              style="width: 100px; margin-right: -2.8px; cursor: pointer">
            <el-step icon="edit" title="Signature"></el-step>
          </div>
          <div
              @click="activeTab='cookies'"
              class="el-step is-horizontal"
              style="width: 100px; margin-right: -2.8px; cursor: pointer">
            <el-step icon="menu" title="Cookies"></el-step>
          </div>
          <div
              @click="activeTab='headers'"
              class="el-step is-horizontal"
              style="width: 100px; margin-right: -2.8px; cursor: pointer">
            <el-step icon="message" title="Headers"></el-step>
          </div>
          <div
              @click="activeTab='cors'"
              class="el-step is-horizontal"
              style="width: 100px; margin-right: -2.8px; cursor: pointer">
            <el-step icon="close" title="Cors"></el-step>
          </div>
          <div
              @click="activeTab='view'"
              class="el-step is-horizontal"
              style="width: 100px; margin-right: -2.8px; cursor: pointer">
            <el-step icon="check" title="Overview"></el-step>
          </div>
        </el-steps>
      </el-col>
    </el-col>
    <el-input disabled v-model="url" class="addressbar" placeholder="Generated URL"></el-input>
  </el-row>
</template>

<script>
  export default {
    name: 'shell',
    data () {
      return {
        file: null,
        request: {},
        method: 'GET',
        ep: null,
        apis: [],
        activeTab: 'api',
        step: 1,
        endpoint: {
          // @note - args, batch, props, headers should be converted to object at export / fire
          endpoint: '',
          multiple: false,
          child: '',
          args: [],
          batch: [
            {key: 'save', value: 'update'},
            {key: 'create', value: 'create'},
            {key: 'delete', value: 'delete'}
          ],
          props: [],
          headers: [],
          identifier: '',
          creationIdentifier: ''
        },
        args: [],
        api: {
          base: 'http://localhost:9001/wp_json/wc/v2',
          methods: [
            'GET',
            'POST',
            'PUT',
            'PATCH',
            'DELETE',
            'OPTIONS',
            'HEAD',
            'TRACE',
            'CONNECT'
          ],
          slug: 'wc',
          default: true,
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
            dualAuth: false,
            indexArrays: true,
            addDataToQuery: true,
            addAuthHeaders: false,
            nonce: '',
            nonceLength: 6,
            timestampLength: 30,
            ampersand: true,
            taleNonce: '_wpnonce=wcApiSettings.nonce',
            put: {
              dualAuth: true
            },
            perform: false // Get axios config instead of making request
          },
          dataType: '',
          charset: '',
          data: '',
          file: null,
          // @note - endpoints should be converted to object at export / fire
          mappings: [
            {
              // @note - args, batch, props, headers should be converted to object at export / fire
              name: 'products',
              endpoint: '',
              multiple: false,
              child: '',
              args: [],
              batch: [
                {key: 'save', value: 'update'},
                {key: 'create', value: 'create'},
                {key: 'delete', value: 'delete'}
              ],
              props: [],
              headers: [],
              identifier: '',
              creationIdentifier: ''
            }
          ]
        }
      }
    },
    computed: {
      url () {
        if (this.ep !== null) {
          return this.ep.shared.resolveUrl()
        } else {
          return (this.api.base + this.endpoint.endpoint)
        }
      },
      config () {
        let clone = JSON.parse(JSON.stringify(this.api))
        clone.mappings = {}
        this.api.mappings.forEach(endpoint => {
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
        return clone
      }
    },
    created () {
      this.apis.push(this.api)
    },
    watch: {
      method (val) {
        let ep = this.genEndpoint(this.config)
        this.genRequest(val, ep)
      },
      config (val) {
        let ep = this.genEndpoint(val)
        this.genRequest(this.method, ep)
      },
      'api.config.authentication' (value) {
        this.api.requester = value
      },
      activeTab (val) {
        switch (val) {
          case 'api':
            this.step = 1
            break
          case 'endpoint':
            this.step = 2
            break
          case 'mapping':
            this.step = 3
            break
          case 'data':
            this.step = 4
            break
          case 'params':
            this.step = 5
            break
          case 'auth':
            this.step = 6
            break
          case 'sign':
            this.step = 7
            break
          case 'cookies':
            this.step = 8
            break
          case 'headers':
            this.step = 9
            break
          case 'cors':
            this.step = 10
            break
          case 'view':
            this.step = 11
            break
          default:
            this.step = 1
            break
        }
      }
    },
    methods: {
      genRequest (method, endpoint) {
        let apiSlug = null
        let args = null
        let replace = false
        let perform = false
        let create = true
        let save = true // Enables 'save' in batch
        let file = this.file
        let options = {} // Batch options to enable / disable save, create, delete
        let data = {}
        let upload = false
        let promise = new Promise(resolve => {
          resolve()
        })
        let conf = {}
        if (endpoint !== null) {
          switch (method) {
            case 'FETCH':
              endpoint.fetch(apiSlug, args, replace, perform).then(config => {
                this.request = config
              })
              break
            case 'SAVE':
              endpoint.save(apiSlug, args, replace, create, perform).then(config => {
                this.request = config
              })
              break
            case 'CREATE':
              endpoint.create(apiSlug, args, replace, create, save, perform).then(config => {
                this.request = config
              })
              break
            case 'REMOVE':
              endpoint.remove(apiSlug, args, replace, perform).then(config => {
                this.request = config
              })
              break
            case 'UPLOAD':
              endpoint.upload(file, apiSlug, args, replace, perform).then(config => {
                this.request = config
              })
              break
            case 'BATCH':
              endpoint.batch(options, apiSlug, args, replace, perform).then(config => {
                this.request = config
              })
              break
            default:
              endpoint[method.toLowerCase()](apiSlug, data, args, upload, promise, conf).then(config => {
                this.request = config
              })
              break
          }
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
        return (this.ep = new this.$al.Endpoint(this.endpoint.endpoint, controller))
      }
    }
  }
</script>

<style>
  input {
    margin-bottom: 20px;
  }
  .el-upload {
    width: 100%;
  }
  .el-upload-dragger {
    width: auto;
  }
  .addressbar input {
    margin: 0;
    border-radius: 0;
  }
</style>
