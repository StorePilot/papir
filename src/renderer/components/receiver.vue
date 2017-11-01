<template>
  <div style="height: calc(50vh - 18px); position: relative;">
    <div slot="header" class="clearfix">
      <span style="line-height: 36px; padding: 8px; display: block;">Response</span>
    </div>
    <div style="overflow-y: scroll; color: #fff; background: #777; padding: 10px; position: absolute; top: 50px; bottom: 0; left: 0; right: 0;">
      <tree-view
          :data="shared.response"
          :options="{rootObjectKey: 'response', maxDepth: 500}">
      </tree-view>
      <tree-view
          :data="shared.responseConfig"
          :options="{rootObjectKey: 'config', maxDepth: 500}">
      </tree-view>
    </div>
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
