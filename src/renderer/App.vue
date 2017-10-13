<template>
  <div id="app" style="height: 100%;">
    <router-view></router-view>
  </div>
</template>

<script>
  export default {
    name: 'papir'
  }
</script>

<style>
  /* CSS */
  html {
    font-family: 'Open Sans', sans-serif;
  }
  body {
    position: absolute;
    margin: 0;
    height: 100%;
    width: 100%;
  }
</style>
