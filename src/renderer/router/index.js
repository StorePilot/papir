import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'explorer',
      component: require('@/components/Explorer')
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
