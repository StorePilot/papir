<template>
  <div class="el-table" v-loading="shared.ep.loading">
    <div>
      <el-button style="display: inline-block; float: left" @click="fetch(shared.ep)">Fetch All</el-button>
      <el-button style="display: inline-block; float: left" @click="save(shared.ep)">Save All</el-button>
    </div>
    <table style="width: 100%; text-align: left">
      <tr>
        <th>Key</th>
        <th>Value</th>
        <th>Actions</th>
      </tr>
      <tr v-for="prop in props">
        <td style="font-size: .8em;">
          {{prop.key}}
        </td>
        <td style="font-size: .8em;" v-loading="prop.loading">
          <el-input v-if="typeof prop.value === 'string'" v-model="prop.value"></el-input>
          <textarea v-else v-model="prop.value"></textarea>
        </td>
        <td>
          <el-button
              size="mini"
              style="margin-bottom: 20px"
              @click="fetch(prop)">Fetch</el-button>
          <el-button
              size="mini"
              style="margin-bottom: 20px"
              @click="save(prop)">Save</el-button>
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
    ],
    data () {
      return {
        props: []
      }
    },
    watch: {
      'shared.ep.loading' (loading) {
        if (!loading) {
          this.props = this.propsArray()
        }
      }
    },
    methods: {
      propsArray () {
        let props = []
        let obj = this.shared.ep.props(true)
        Object.keys(obj).forEach(key => {
          props.push(obj[key])
        })
        return props
      },
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
