<template>
  <div v-loading="shared.ep.loading">
    <div style="display: block; float: left;">
      <el-button style="display: inline-block; float: left" @click="fetch(shared.ep)">Fetch All</el-button>
      <el-button style="display: inline-block; float: left" @click="save(shared.ep)">Save All</el-button>
    </div>
    <div style="display: block; float: left; width: 100%; margin-top: 20px;">
      <el-collapse accordion>
        <el-collapse-item v-for="(child, index) in shared.ep.children" :key="String(index)" :title="String(index)">
          <table class="el-table">
            <tr style="width: 100%; display: inline-table">
              <th>Key</th>
              <th>Value</th>
            </tr>
            <div v-for="prop in propsArray(child.props(true))">
              <tr style="width: 100%; display: inline-table">
                <td style="font-size: .8em;">
                  {{prop.key}}
                </td>
                <td style="font-size: .8em;" v-loading="prop.loading">
                  <el-input
                      style="float: right;"
                      v-if="typeof prop.value === 'string'"
                      v-model="prop.value"></el-input>
                  <textarea
                      style="float: right;"
                      v-else v-model="prop.value"></textarea>
                </td>
              </tr>
              <tr>
                <td colspan="2">
                  <div>
                    <el-button
                        size="mini"
                        style="margin-bottom: 20px"
                        @click="fetch(prop)">Fetch</el-button>
                    <el-button
                        size="mini"
                        style="margin-bottom: 20px"
                        @click="save(prop)">Save</el-button>
                  </div>
                </td>
              </tr>
            </div>
          </table>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'confChildren',
    props: [
      'shared'
    ],
    data () {
      return {
        props: []
      }
    },
    methods: {
      fetch (obj) {
        obj.fetch().then(resp => {
          if (typeof resp.raw !== 'undefined') {
            this.shared.response = resp.raw
          } else {
            this.shared.response = resp.value
          }
        }).catch(e => {
          this.shared.response = e
        })
      },
      save (obj) {
        obj.save().then(resp => {
          if (typeof resp.raw !== 'undefined') {
            this.shared.response = resp.raw
          } else {
            this.shared.response = resp.value
          }
        }).catch(e => {
          this.shared.response = e
        })
      },
      propsArray (obj) {
        let props = []
        Object.keys(obj).forEach(key => {
          props.push(obj[key])
        })
        return props
      }
    }
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
