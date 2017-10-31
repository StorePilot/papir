<template>
  <div>
    <el-menu
        default-active="0"
        class="el-menu-vertical-demo"
        style="min-height: calc(100vh - 36px);">
      <h3 style="margin: 20px;">Endpoints</h3>
      <draggable
          @change="$emit('save')"
          v-model="shared.api.mappings"
          :options="{draggable:'.item'}">
        <el-menu-item
            v-for="(_endpoint, index) in shared.api.mappings"
            :index="String(index)"
            :key="_endpoint.name"
            class="item"
            @click="shared.endpoint = _endpoint">
          {{_endpoint.name}}
          <div
              @contextmenu.prevent="$refs.ctx.open($event, {index: index})"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%"></div>
        </el-menu-item>
      </draggable>
      <el-menu-item index="none">
        <el-button
            size="small"
            type="primary"
            @click="addEndpoint">
          Add
        </el-button>
      </el-menu-item>
    </el-menu>
    <context-menu
        class="context-menu"
        ref="ctx"
        @ctx-open="ctxOpen">
      <li @click="removeEndpoint(menu.index)">Remove</li>
    </context-menu>
  </div>
</template>

<script>
  import draggable from 'vuedraggable'
  export default {
    name: 'navEndpoints',
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
