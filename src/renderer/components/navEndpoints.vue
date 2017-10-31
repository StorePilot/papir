<template>
  <el-menu
      default-active="0"
      class="el-menu-vertical-demo"
      style="min-height: calc(100vh - 36px);">
    <h3 style="margin: 20px;">Endpoints</h3>
    <el-menu-item
        v-for="(_endpoint, index) in shared.api.mappings"
        :index="String(index)"
        :key="_endpoint.name"
        @click="shared.endpoint = _endpoint">
      {{_endpoint.name}}
      <el-button
          style="float: right; margin-top: 16px;"
          size="mini"
          type="danger"
          @click="removeEndpoint(index)">
        Delete
      </el-button>
    </el-menu-item>
    <el-menu-item index="none">
      <el-button
          size="small"
          type="primary"
          @click="addEndpoint">
        Add Endpoint
      </el-button>
    </el-menu-item>
  </el-menu>
</template>

<script>
  export default {
    name: 'navEndpoints',
    props: [
      'shared'
    ],
    methods: {
      removeEndpoint (index) {
        if (this.shared.endpoint !== null && this.shared.endpoint.name === this.shared.api.mappings[index].name) {
          this.shared.api.mappings.splice(index, 1)
          if (this.shared.api.mappings.length > 0) {
            this.shared.endpoint = this.shared.api.mappings[0]
          } else {
            this.shared.endpoint = null
          }
        } else {
          this.shared.api.mappings.splice(index, 1)
          if (this.shared.api.mappings.length === 0) {
            this.shared.endpoint = null
          }
        }
        this.$emit('save')
      },
      addEndpoint () {
        this.shared.api.mappings.push(JSON.parse(JSON.stringify(this.shared.exampleEndpoint)))
        this.$emit('save')
      }
    }
  }
</script>

<style>
</style>
