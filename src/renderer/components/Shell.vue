<template>
  <el-row style="height: 100%;">
    <el-col :sm="5" :lg="3" style="min-height: calc(100% - 36px);">
      <el-menu style="min-height: calc(100vh - 36px);" default-active="1" class="el-menu-vertical-demo" theme="dark">
        <h3 style="color: white; margin: 20px;">API's</h3>
        <el-menu-item index="1">
          My First Api
        </el-menu-item>
      </el-menu>
    </el-col>
    <el-col :sm="5" :lg="3">
      <el-menu style="min-height: calc(100vh - 36px);" default-active="1" class="el-menu-vertical-demo">
        <h3 style="margin: 20px;">Endpoints</h3>
        <el-menu-item index="1">
          My First Endpoint
        </el-menu-item>
      </el-menu>
    </el-col>
    <el-col :sm="14" :lg="18">
      <el-tabs type="border-card" style="max-height: 44vh; overflow-y: scroll;">

        <el-tab-pane label="API">
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

        <el-tab-pane label="Data">
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

        <el-tab-pane label="Query Params">
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

        <el-tab-pane label="Authentication">
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

        <el-tab-pane label="Signature">
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

        <el-tab-pane label="Cookies">
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

        <el-tab-pane label="Headers">
          <h3>Add Authentication Params to Header</h3>
          <el-switch
              v-model="api.config.addAuthHeaders"
              on-color="#13ce66"
              off-color="#ff4949">
          </el-switch>
        </el-tab-pane>

        <el-tab-pane label="Cross Origin">
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
          <h5>Preflight Monitor</h5>
        </el-tab-pane>
        <el-tab-pane label="Configuration Overview">
          <pre>{{api}}</pre>
        </el-tab-pane>
      </el-tabs>
      <el-row style="max-height: 44vh; overflow-y: scroll;">
        <el-col :sm="24" :lg="12">
          <el-card style="margin: 20px 10px 10px;" class="box-card">
            <div slot="header" class="clearfix">
              <span style="line-height: 36px;">Request</span>
              <el-button style="float: right">Fire</el-button>
            </div>
            <h5>Url</h5>
            <h5>Method</h5>
            <h5>Headers</h5>
            <h5>Query String Params</h5>
            <h5>Data</h5>
          </el-card>
        </el-col>
        <el-col :sm="24" :lg="12">
          <el-card style="margin: 20px 10px 0 10px;" class="box-card">
            <div slot="header" class="clearfix">
              <span style="line-height: 36px;">Response</span>
            </div>
            <h5>Status Code</h5>
            <h5>Headers</h5>
            <h5>Data</h5>
          </el-card>
        </el-col>
      </el-row>
      <el-col :lg="24">
        <el-steps center style="margin: 20px;" :space="100" :active="1">
          <el-step icon="edit"></el-step>
          <el-step icon="upload"></el-step>
          <el-step icon="picture"></el-step>
        </el-steps>
      </el-col>
    </el-col>
    <el-input v-model="url" class="addressbar" placeholder="Generated URL"></el-input>
  </el-row>
</template>

<script>
  export default {
    name: 'shell',
    data () {
      return {
        url: '',
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
            }
          },
          dataType: '',
          charset: '',
          data: '',
          file: null
        }
      }
    },
    watch: {
      'api.config.authentication' (value) {
        this.api.requester = value
      }
    },
    methods: {
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
