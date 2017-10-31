<template>
  <div>
    <h3>Primary</h3>
    <el-switch
        v-model="api.default"
        on-color="#13ce66"
        off-color="#ff4949">
    </el-switch>
    <h3>Base</h3>
    <el-input
        v-model="api.base"
        placeholder="http://myapi.com/v2">
    </el-input>
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
    <h3>Slug</h3>
    <el-input
        v-model="api.slug"
        placeholder="Used by APILake for API lookup">
    </el-input>
    <h3>
      Note
    </h3>
    <el-input
        type="textarea"
        :rows="7"
        placeholder="Type here"
        v-model="api.note">
    </el-input>
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
    <h3>Client ID</h3>
    <el-input v-model="api.config.key"></el-input>
    <h3>Client Secret</h3>
    <el-input v-model="api.config.secret"></el-input>
    <h3>Token Key</h3>
    <el-input v-model="api.config.token.key"></el-input>
    <h3>Token Secret</h3>
    <el-input v-model="api.config.token.secret"></el-input>
    <h3>Nonce</h3>
    <el-input
        placeholder="Auto generated if not set"
        v-model="api.config.nonce">
    </el-input>
    <h3>Nonce Length</h3>
    <el-input-number
        v-model="api.config.nonceLength">
    </el-input-number>
    <h3>Timestamp Length</h3>
    <el-input-number
        v-model="api.config.timestampLength">
    </el-input-number>
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
    <h3>Add Authentication Params to Header</h3>
    <el-switch
        v-model="api.config.addAuthHeaders"
        on-color="#13ce66"
        off-color="#ff4949">
    </el-switch>
    <h3>Custom Headers</h3>
    <div class="el-table">
      <table style="width: 100%; text-align: left">
        <tr>
          <th>Key</th>
          <th>Value</th>
          <th>Delete</th>
        </tr>
        <tr v-for="(arg, index) in api.config.headers">
          <td>
            <el-input v-model="arg.key"></el-input>
          </td>
          <td>
            <el-input v-model="arg.value"></el-input>
          </td>
          <td>
            <el-button style="margin-bottom: 20px" @click="api.config.headers.splice(index, 1)">Clear</el-button>
          </td>
        </tr>
      </table>
    </div>
    <el-button
        style="margin-top: 10px;"
        @click="api.config.headers.push({ key: '', value: '' })">
      Add
    </el-button>
    <h3>Cookie Nonce Generation by Localized variable</h3>
    <el-input
        v-model="api.config.taleNonce">
    </el-input>
    <h3>Authorize by querystring</h3>
    <el-switch
        v-model="api.config.authQuery"
        on-color="#13ce66"
        off-color="#ff4949">
    </el-switch>
    <h3>Authorize by header</h3>
    <el-switch
        v-model="api.config.authHeader"
        on-color="#13ce66"
        off-color="#ff4949">
    </el-switch>
    <h3>Authorize by querystring (PUT only)</h3>
    <el-switch
        v-model="api.config.put.authQuery"
        on-color="#13ce66"
        off-color="#ff4949">
    </el-switch>
    <h3>Authorize by header (PUT only)</h3>
    <el-switch
        v-model="api.config.put.authHeader"
        on-color="#13ce66"
        off-color="#ff4949">
    </el-switch>
    <h3>Preflight Monitor</h3>
    <span>Should notify if anything could cause preflight</span>
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
  </div>
</template>

<script>
  export default {
    name: 'confApi',
    props: [
      'api'
    ]
  }
</script>

<style>
</style>
