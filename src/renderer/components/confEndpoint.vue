<template>
  <div v-if="endpoint!==null">
    <h3>Name / Slug</h3>
    <el-input v-model="endpoint.name" placeholder="users"></el-input>
    <h3>Endpoint - Path</h3>
    <el-input v-model="endpoint.endpoint" placeholder="/users{/id}"></el-input>
    <h3>Identifier</h3>
    <el-input v-model="endpoint.identifier" placeholder="Usually the id property"></el-input>
    <h3>Creation Identifier</h3>
    <el-input v-model="endpoint.creationIdentifier" placeholder="Usually the meta property"></el-input>
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
    <h3>
      Note
    </h3>
    <el-input
        type="textarea"
        :rows="7"
        placeholder="Type here"
        v-model="endpoint.note">
    </el-input>
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
    <h3>
      Data (Per Endpoint)
    </h3>
    <el-input
        type="textarea"
        :rows="7"
        placeholder="Type here"
        v-model="endpoint.data">
    </el-input>
    <h3>Custom Arguments (Per Endpoint)</h3>
    <div class="el-table">
      <table style="width: 100%; text-align: left">
        <tr>
          <th>Key</th>
          <th>Value</th>
          <th>Delete</th>
        </tr>
        <tr v-for="(arg, index) in endpoint.params">
          <td>
            <el-input v-model="arg.key"></el-input>
          </td>
          <td>
            <el-input v-model="arg.value"></el-input>
          </td>
          <td>
            <el-button style="margin-bottom: 20px" @click="endpoint.params.splice(index, 1)">Clear</el-button>
          </td>
        </tr>
      </table>
    </div>
    <el-button
        style="margin-top: 10px;"
        @click="endpoint.params.push({ key: '', value: '' })">
      Add
    </el-button>
  </div>
</template>

<script>
  export default {
    name: 'confEndpoint',
    props: [
      'endpoint'
    ]
  }
</script>

<style>
</style>
