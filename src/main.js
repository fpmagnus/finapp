import firebase from 'firebase'
import moment from 'moment'
import Vue from 'vue'
import VueFire from 'vuefire'
import VueRouter from 'vue-router'
import VueScrollTo from 'vue-scrollto'
import VueShortkey from 'vue-shortkey'
import { app } from './store/firebase'
import store from './store/store'
import routes from './routes'
import formatDate from './filters/date'
import App from './components/App.vue'

Vue.config.productionTip = false
moment.locale('en')

// Filters
Vue.filter('date', formatDate)

// Plugins
Vue.use(VueFire)
Vue.use(VueScrollTo, {
  container: '.main',
  offset: 60
})
Vue.use(VueRouter)
Vue.use(VueShortkey)

// Router for navigation
const router = new VueRouter({
  routes,
  mode: 'history',
  saveScrollPosition: true,
  linkActiveClass: 'active',
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { x: 0, y: 0 }
    }
  }
})

// Init application
new Vue({
  async created() {
    try {
      await app.auth().onAuthStateChanged((user) => {
        if (user) {
          this.$store.commit('signIn', user)

          const userRef = `users/${user.uid}`

          const formatDataAndDispatchActions = async (snapshot) => {
            const data = snapshot.val()

            await this.$store.dispatch('setRates')
            await this.$store.dispatch('setCategories', data)
            await this.$store.dispatch('setAccounts', data)
            await this.$store.dispatch('setTrns', data)
            this.$store.commit('pageLoaded')
            this.$store.commit('closeLoader')
          }

          const db = firebase.database()
          db.ref(userRef).once('value')
            .then(async (snapshot) => {
              await formatDataAndDispatchActions(snapshot)
            })

          db.ref(userRef).on('value', async (snapshot) => {
            await formatDataAndDispatchActions(snapshot)
          })
        } else {
          this.$store.commit('closeLoader')
          this.$store.commit('pageLoaded')
          this.$router.push('/')
        }
      })
    } catch (error) {
      console.error('main / created', error.message)
    }
  },
  el: '.app',
  store,
  router,
  render: h => h(App)
})
