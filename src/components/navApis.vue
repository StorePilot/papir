<template>
  <div>
    <el-menu
        style="min-height: calc(100vh - 36px);"
        default-active="0"
        class="el-menu-vertical-demo"
        theme="dark">
      <h5 style="color: white; margin: 20px;">API's</h5>
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
      <div style="position: absolute; width: 100%; bottom: 0">
        <el-menu-item index="none">
          <el-upload
              :on-change="loadFile"
              action="#">
            <el-button style="float: left" type="info">Load</el-button>
          </el-upload>
        </el-menu-item>
        <el-menu-item index="none">
          <el-button
              type="info"
              @click="exportFile">
            Export
          </el-button>
        </el-menu-item>
        <el-menu-item index="none">
          <el-button
              type="info"
              @click="copyJSON">
            To Clipboard
          </el-button>
        </el-menu-item>
      </div>
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
      'shared',
      'conf'
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
      },
      loadFile (file) {
        let scope = this
        let reader = new FileReader()
        reader.onload = (e) => {
          let data = JSON.parse(e.target.result)
          scope.$emit('loadApis', data)
        }
        reader.readAsText(file.raw)
      },
      exportFile () {
        let data = JSON.stringify(this.conf)
        let file = new Blob([data], {type: 'application/json'})
        let a = document.createElement('a')
        let url = URL.createObjectURL(file)
        a.href = url
        a.download = 'apis.json'
        document.body.appendChild(a)
        a.click()
        setTimeout(() => {
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)
        }, 0)
      },
      copyJSON () {
        let scope = this
        let data = JSON.stringify(this.conf)
        if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
          let textarea = document.createElement('textarea')
          textarea.textContent = data
          textarea.style.position = 'fixed' // Prevent scrolling to bottom of page in MS Edge.
          document.body.appendChild(textarea)
          textarea.select()
          try {
            document.execCommand('copy') // Security exception may be thrown by some browsers.
            scope.$message({
              type: 'info',
              message: 'Copied to clipboard'
            })
          } catch (ex) {
            scope.$message({
              type: 'error',
              message: 'Your ui doesnt support copy to clipboard'
            })
          } finally {
            document.body.removeChild(textarea)
          }
        }
      }
    }
  }
</script>

<style>
</style>
