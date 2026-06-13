import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const HomePage = () => import('@/views/public/HomePage.vue')
const LoginPage = () => import('@/views/peserta/LoginPage.vue')
const RegisterPage = () => import('@/views/peserta/RegisterPage.vue')
const DashboardPage = () => import('@/views/peserta/DashboardPage.vue')
const JoinPage = () => import('@/views/peserta/JoinPage.vue')
const WaitingPage = () => import('@/views/peserta/WaitingPage.vue')
const QuizPage = () => import('@/views/peserta/QuizPage.vue')
const ResultPage = () => import('@/views/peserta/ResultPage.vue')
const ProfilePage = () => import('@/views/peserta/ProfilePage.vue')
const LeaderboardPage = () => import('@/views/public/LeaderboardPage.vue')
const VerifyPage = () => import('@/views/public/VerifyPage.vue')
const AdminLogin = () => import('@/views/admin/AdminLogin.vue')
const AdminRegister = () => import('@/views/admin/AdminRegister.vue')
const AdminDashboard = () => import('@/views/admin/AdminDashboard.vue')
const AdminEvents = () => import('@/views/admin/AdminEvents.vue')
const AdminEventNew = () => import('@/views/admin/AdminEventNew.vue')
const AdminEventDetail = () => import('@/views/admin/AdminEventDetail.vue')
const AdminRoomNew = () => import('@/views/admin/AdminRoomNew.vue')
const AdminRoomHost = () => import('@/views/admin/AdminRoomHost.vue')
const AdminRoomResults = () => import('@/views/admin/AdminRoomResults.vue')
const AdminQuestions = () => import('@/views/admin/AdminQuestions.vue')
const AdminUsers = () => import('@/views/admin/AdminUsers.vue')
const AdminSettings = () => import('@/views/admin/AdminSettings.vue')

const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/verify/:hash', name: 'verify', component: VerifyPage },
  { path: '/leaderboard/:roomId', name: 'leaderboard', component: LeaderboardPage },
  { path: '/login', name: 'login', component: LoginPage, meta: { guestOnly: true } },
  { path: '/register', name: 'register', component: RegisterPage, meta: { guestOnly: true } },
  { path: '/dashboard', name: 'dashboard', component: DashboardPage, meta: { requiresAuth: true } },
  { path: '/join/:code?', name: 'join', component: JoinPage, meta: { requiresAuth: true } },
  { path: '/waiting/:roomId', name: 'waiting', component: WaitingPage, meta: { requiresAuth: true } },
  { path: '/quiz/:roomId', name: 'quiz', component: QuizPage, meta: { requiresAuth: true } },
  { path: '/result/:roomId', name: 'result', component: ResultPage, meta: { requiresAuth: true } },
  { path: '/profile', name: 'profile', component: ProfilePage, meta: { requiresAuth: true } },

  // Admin auth — register pakai token invite (public)
  { path: '/admin/login', name: 'admin-login', component: AdminLogin },
  { path: '/admin/register', name: 'admin-register', component: AdminRegister },

  // Admin panel
  { path: '/admin', redirect: '/admin/dashboard' },
  { path: '/admin/dashboard', name: 'admin-dashboard', component: AdminDashboard, meta: { requiresAdmin: true } },
  { path: '/admin/events', name: 'admin-events', component: AdminEvents, meta: { requiresAdmin: true } },
  { path: '/admin/events/new', name: 'admin-event-new', component: AdminEventNew, meta: { requiresAdmin: true } },
  { path: '/admin/events/:id', name: 'admin-event-detail', component: AdminEventDetail, meta: { requiresAdmin: true } },
  { path: '/admin/events/:id/rooms/new', name: 'admin-room-new', component: AdminRoomNew, meta: { requiresAdmin: true } },
  { path: '/admin/rooms/:roomId/host', name: 'admin-room-host', component: AdminRoomHost, meta: { requiresAdmin: true } },
  { path: '/admin/rooms/:roomId/results', name: 'admin-room-results', component: AdminRoomResults, meta: { requiresAdmin: true } },
  { path: '/admin/questions', name: 'admin-questions', component: AdminQuestions, meta: { requiresAdmin: true } },
  { path: '/admin/users', name: 'admin-users', component: AdminUsers, meta: { requiresAdmin: true, superadminOnly: true } },
  { path: '/admin/settings', name: 'admin-settings', component: AdminSettings, meta: { requiresAdmin: true, superadminOnly: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0, behavior: 'smooth' }
  }
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  await authStore.waitForInit()
  const isLoggedIn = !!authStore.user
  const isAdmin = authStore.isAdmin
  const isSuperAdmin = authStore.isSuperAdmin

  if (to.meta.requiresAuth && !isLoggedIn) return next({ name: 'login', query: { redirect: to.fullPath } })
  if (to.meta.requiresAdmin && !isAdmin) return next({ name: 'admin-login' })
  if (to.meta.superadminOnly && !isSuperAdmin) return next({ name: 'admin-dashboard' })
  if (to.meta.guestOnly && isLoggedIn) return next({ name: 'dashboard' })
  next()
})

export default router
