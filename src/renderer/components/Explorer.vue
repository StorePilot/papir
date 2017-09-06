<template>
  <el-row :gutter="20">
    <el-col>
      <h3>API Path</h3>
      <el-input v-model="storage.root" placeholder="http://mysite.io/api/v1"></el-input>
      <el-button @click="explore">Explore</el-button>
    </el-col>
  </el-row>
</template>

<script>
  import $ from 'expose-loader?jquery'
  export default {
    name: 'explorer',
    data () {
      return {
        storage: {
          root: ''
        }
      }
    },
    methods: {
      explore () {
        $.ajax()
      }
    }
  }
</script>

<style>
  input {
    margin-bottom: 20px;
  }
</style>
