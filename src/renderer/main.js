import Vue from 'vue'
import App from './App'
import router from './router'
import TreeView from 'vue-json-tree-view'

import Apilake from '../logic/apilake/apilake_vue'
import axios from 'axios'
import VueAxios from 'vue-axios'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-default/index.css'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))

Vue.config.productionTip = false
Vue.use(ElementUI)
Vue.use(Apilake)
Vue.use(VueAxios, axios)
Vue.use(TreeView)

/* eslint-disable no-new */
new Vue({
  components: {
    App
  },
  router,
  template: '<App/>'
}).$mount('#app')
