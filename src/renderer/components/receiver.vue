<template>
  <div style="height: calc(50vh - 18px); position: relative;">
    <div slot="header" class="clearfix">
      <span style="line-height: 36px; padding: 8px; display: block;">Response</span>
    </div>
    <tree-view
        style="color: #fff; background: #777; padding: 10px; position: absolute; top: 50px; bottom: 0; left: 0; right: 0;"
        :data="shared.response"
        :options="{rootObjectKey: 'response', maxDepth: 500}">
    </tree-view>
  </div>
</template>

<script>
  export default {
    name: 'requester',
    props: [
      'shared'
    ]
  }
</script>

<style>
</style>
