<template>
  <div>
    <el-menu
        style="min-height: calc(100vh - 36px);"
        default-active="0"
        class="el-menu-vertical-demo"
        theme="dark">
      <h4 style="color: white; margin: 20px;">API's</h4>
      <draggable
          @change="$emit('save')"
          v-model="shared.apis"
          :options="{draggable:'.item'}">
        <el-menu-item
            v-for="(_api, index) in shared.apis"
            :index="String(index)"
            :key="_api.slug"
            class="item"
            @click="
                shared.api = _api;
                (typeof _api.mappings !== 'undefined' && _api.mappings.length > 0) ? shared.endpoint = _api.mappings[0] : shared.endpoint = null">
          {{_api.slug}}
          <div
              @contextmenu.prevent="$refs.ctx.open($event, {index: index})"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%"></div>
        </el-menu-item>
      </draggable>
      <el-menu-item index="none">
        <el-button
            size="small"
            type="primary"
            @click="addApi">
          Add
        </el-button>
      </el-menu-item>
    </el-menu>
    <context-menu
        class="context-menu"
        ref="ctx"
        @ctx-open="ctxOpen">
      <li @click="removeApi(menu.index)">Remove</li>
    </context-menu>
  </div>
</template>

<script>
  import draggable from 'vuedraggable'
  export default {
    name: 'navApis',
    components: {
      draggable
    },
    props: [
      'shared'
    ],
    data () {
      return {
        menu: {
          index: 0
        }
      }
    },
    methods: {
      ctxOpen (data) {
        this.menu = data
      },
      addApi () {
        this.shared.apis.push(JSON.parse(JSON.stringify(this.shared.exampleApi)))
        this.$emit('save')
      },
      removeApi (index) {
        if (this.shared.apis[index].slug === this.shared.api.slug) {
          this.shared.apis.splice(index, 1)
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
