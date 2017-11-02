<template>
  <div class="el-table">
    <table style="width: 100%; text-align: left">
      <el-button @click="shared.ep.fetch()">Fetch All</el-button>
      <tr>
        <th>Key</th>
        <th>Value</th>
        <th>Actions</th>
      </tr>
      <tr
          v-if="typeof shared.ep !== 'undefined' && shared.ep !== null && shared.ep.constructor === Object"
          v-for="(prop, index) in shared.ep.props(true)"
          v-loading="prop.loading">
        <td>
          {{prop.key}}
        </td>
        <td>
          <el-input v-model="prop.value"></el-input>
        </td>
        <td>
          <el-button style="margin-bottom: 20px" @click="prop.fetch()">Fetch</el-button>
          <el-button style="margin-bottom: 20px" @click="prop.save()">Save</el-button>
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
  export default {
    name: 'confProps',
    props: [
      'shared'
    ]
  }
</script>

<style>
  input, .el-select, .el-input-number {
    width: 100%;
  }
  table button {
    margin-bottom: 0!important;
  }
</style>
