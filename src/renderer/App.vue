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
  .context-menu .ctx-menu {
    min-width: 200px;
    padding: 0;
    border-radius: 0;
    border: none;
  }

  .context-menu li {
    padding: 10px;
  }

  .context-menu li:hover {
    background: #20a0ff;
    cursor: pointer;
    color: #fff;
  }
</style>
