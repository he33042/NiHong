import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ===== 前台公开页面 =====
    {
      path: '/',
      component: () => import('@/layouts/FrontLayout.vue'),
      children: [
        { path: '', name: 'home', component: () => import('@/views/HomeView.vue') },
        { path: 'article/:id(\\d+)', name: 'article-detail', component: () => import('@/views/ArticleDetailView.vue') },
        { path: 'categories', name: 'categories', component: () => import('@/views/CategoriesView.vue') },
        { path: 'tags', name: 'tags', component: () => import('@/views/TagsView.vue') },
        { path: 'about', name: 'about', component: () => import('@/views/AboutView.vue') },
        { path: 'search', name: 'search', component: () => import('@/views/SearchView.vue') },
        { path: 'guestbook', name: 'guestbook', component: () => import('@/views/GuestbookView.vue') }
      ]
    },
    // ===== 登录页 =====
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
    // ===== 用户登录 / 注册页 =====
    { path: '/user/login', name: 'user-login', component: () => import('@/views/UserLoginView.vue') },
    // ===== 后台管理（需登录） =====
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/admin/dashboard' },
        { path: 'dashboard', name: 'admin-dashboard', component: () => import('@/views/admin/DashboardView.vue') },
        { path: 'articles', name: 'admin-articles', component: () => import('@/views/admin/ArticlesView.vue') },
        { path: 'articles/new', name: 'admin-article-new', component: () => import('@/views/admin/ArticleEditView.vue') },
        { path: 'articles/:id(\\d+)/edit', name: 'admin-article-edit', component: () => import('@/views/admin/ArticleEditView.vue') },
        { path: 'attachments', name: 'admin-attachments', component: () => import('@/views/admin/AttachmentsView.vue') },
        { path: 'categories', name: 'admin-categories', component: () => import('@/views/admin/CategoriesView.vue') },
        { path: 'tags', name: 'admin-tags', component: () => import('@/views/admin/TagsView.vue') },
        { path: 'comments', name: 'admin-comments', component: () => import('@/views/admin/CommentsView.vue') },
        { path: 'messages', name: 'admin-messages', component: () => import('@/views/admin/MessagesView.vue') },
        { path: 'ai', name: 'admin-ai', component: () => import('@/views/admin/AiConfigView.vue') },
        { path: 'ai-writer', name: 'admin-ai-writer', component: () => import('@/views/admin/AiWriterView.vue') },
        { path: 'settings', name: 'admin-settings', component: () => import('@/views/admin/SiteSettingsView.vue') }
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  scrollBehavior: () => ({ top: 0 })
})

// 路由守卫：从 CDN 域名访问管理页时，自动跳转到 HTTP 直连域名（绕过 CDN 静态加速，支持 PUT/POST）
router.beforeEach((to) => {
  const host = window.location.hostname
  // 仅在 CDN 域名下且访问管理相关路由时跳转
  if (host === 'hknihong.xyz' && (to.path.startsWith('/admin') || to.path === '/login')) {
    const url = `http://api.hknihong.xyz${to.fullPath}`
    window.location.href = url
    return false
  }
  // 同时检查 token 和 admin 信息，防止普通用户 token 冒充管理员
  const isAdmin = !!(localStorage.getItem('blog_token') && localStorage.getItem('blog_admin'))
  if (to.meta.requiresAuth && !isAdmin) {
    // 清除残留的普通用户 token，确保重定向到管理员登录页
    localStorage.removeItem('blog_user_token')
    localStorage.removeItem('blog_user_info')
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.path === '/login' && isAdmin) {
    return { path: '/admin' }
  }
})

export default router
