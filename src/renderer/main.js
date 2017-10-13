import Vue from 'vue'
import App from './App'
import router from './router'

import Apilake from '../logic/apilake/apilake_vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-default/index.css'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))

Vue.config.productionTip = false
Vue.use(ElementUI)
Vue.use(Apilake)

/* eslint-disable no-new */
new Vue({
  components: {
    App
  },
  router,
  template: '<App/>'
}).$mount('#app')
