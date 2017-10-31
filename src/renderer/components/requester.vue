<template>
  <div>
    <span style="line-height: 36px;">Request</span>
    <el-button
        style="margin-left: 10px;"
        @click="open()"
        size="mini"
        type="info">
      Go to URL
    </el-button>
    <el-button
        @click="fire()"
        style="float: right"
        type="warning">
      Fire
    </el-button>
    <el-select
        v-model="shared.method"
        style="float: right; width: 150px; margin-right: 10px;"
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
    <tree-view
        :data="shared.request"
        :options="{rootObjectKey: 'request', maxDepth: 500}">
    </tree-view>
  </div>
</template>

<script>
  export default {
    name: 'requester',
    props: [
      'shared'
    ],
    methods: {
      save () {
        localStorage.setItem('papir.apis', JSON.stringify(this.shared.apis))
      },
      open () {
        window.open(this.shared.request.url)
      }
    }
  }
</script>

<style>
</style>
