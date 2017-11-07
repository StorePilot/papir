import Vue from 'vue'
import App from './App'
import router from './router'
import TreeView from 'vue-json-tree-view'

import Papir from '../logic/papir'
import axios from 'axios'
import VueAxios from 'vue-axios'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-default/index.css'
import contextMenu from 'vue-context-menu'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))

Vue.config.productionTip = false
Vue.use(ElementUI)
Vue.use(Papir)
Vue.use(VueAxios, axios)
Vue.use(TreeView)
Vue.use(contextMenu)

/* eslint-disable no-new */
new Vue({
  components: {
    App
  },
  router,
  template: '<App/>'
}).$mount('#app')
