<template>
  <el-menu
      style="min-height: calc(100vh - 36px);"
      default-active="0"
      class="el-menu-vertical-demo"
      theme="dark">
    <h3 style="color: white; margin: 20px;">API's</h3>
    <el-menu-item
        v-for="(_api, index) in shared.apis" :index="String(index)" :key="_api.slug"
        @click="
            shared.api = _api;
            (typeof _api.mappings !== 'undefined' && _api.mappings.length > 0) ? shared.endpoint = _api.mappings[0] : shared.endpoint = null">
      {{_api.slug}}
      <el-button
          v-if="shared.apis.length > 1"
          style="float: right; margin-top: 16px;"
          size="mini"
          type="danger"
          @click="removeApi(index)">
        Delete
      </el-button>
    </el-menu-item>
    <el-menu-item index="none">
      <el-button
          size="small"
          type="primary"
          @click="addApi">
        Add API
      </el-button>
    </el-menu-item>
  </el-menu>
</template>

<script>
  export default {
    name: 'navApis',
    props: [
      'shared'
    ],
    methods: {
      addApi () {
        this.shared.apis.push(JSON.parse(JSON.stringify(this.shared.exampleApi)))
        this.$emit('save')
      },
      removeApi (index) {
        if (this.shared.apis[index].slug === this.shared.api.slug) {
          this.apis.splice(index, 1)
          this.shared.api = this.shared.apis[0]
          if (typeof this.shared.api.mappings !== 'undefined' && this.shared.api.mappings.length > 0) {
            this.shared.endpoint = this.shared.api.mappings[0]
          } else {
            this.shared.endpoint = null
          }
        } else {
          this.shared.apis.splice(index, 1)
        }
        this.$emit('save')
      }
    }
  }
</script>

<style>
</style>
