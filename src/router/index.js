import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../pages/LoginPage.vue'
import HomePage from '../pages/HomePage.vue'
import ConversationPage from '../pages/ConversationPage.vue'
import ReportPage from '../pages/ReportPage.vue'

const routes = [
  { path: '/login', name: 'login', component: LoginPage },
  { path: '/', name: 'home', component: HomePage, meta: { requiresAuth: true } },
  { path: '/conversation/:id', name: 'conversation', component: ConversationPage, meta: { requiresAuth: true } },
  { path: '/report/:id', name: 'report', component: ReportPage, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const token = localStorage.getItem('kaiwa_token')
  if (to.meta.requiresAuth && !token) {
    return { name: 'login' }
  }
  if (to.name === 'login' && token) {
    return { name: 'home' }
  }
})

export default router
