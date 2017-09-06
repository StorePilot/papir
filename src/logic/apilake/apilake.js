import Form from './mod/form'
import Sign from './auth/sign'
import Oauth from './auth/oauth'

/**
 * Apilake
 */
const ApilakeVue = {

  install (Vue) {
    Vue.prototype.$al = {
      sign: new Sign(),
      Oauth: new Oauth(),
      Form: new Form()
    }
  }

}

export default Apilake
