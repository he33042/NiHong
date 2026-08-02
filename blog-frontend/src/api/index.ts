import http from './http'
import type { AdminInfo, Article, ArticlePayload, Category, Message, PageResult, Tag, UserInfo } from '@/types'

// ==================== 鉴权 ====================
export const loginApi = (data: { username: string; password: string }) =>
  http.post('/admin/login', data) as Promise<{ token: string; admin: AdminInfo }>

// ==================== 用户系统 ====================
export const userRegister = (data: { email: string; password: string; nickname: string }) =>
  http.post('/user/register', data) as Promise<{ id: number }>
export const userLogin = (data: { email: string; password: string }) =>
  http.post('/user/login', data) as Promise<{ token: string; user: UserInfo }>
export const userProfile = () =>
  http.get('/user/profile') as Promise<UserInfo>

// ==================== 前台公开接口 ====================
export interface ArticleQuery {
  page?: number
  size?: number
  categoryId?: number | null
  tagId?: number | null
  keyword?: string
}

// 分页文章列表（支持分类/标签筛选，仅已发布）
export const fetchArticles = (params: ArticleQuery) =>
  http.get('/articles', { params }) as Promise<PageResult<Article>>
// 文章详情
export const fetchArticle = (id: number) => http.get(`/articles/${id}`) as Promise<Article>
// 分类 / 标签列表
export const fetchCategories = () => http.get('/categories') as Promise<Category[]>
export const fetchTags = () => http.get('/tags') as Promise<Tag[]>

// 留言板（公开）：列表 + 提交
export const fetchMessages = (params: { page?: number; size?: number }) =>
  http.get('/messages', { params }) as Promise<PageResult<Message>>
export const createMessage = (data: { content: string; email?: string; website?: string }) =>
  http.post('/messages', data) as Promise<{ id: number }>

// ==================== 后台管理接口 ====================
// 仪表盘统计
export interface Stats {
  article: { total: number; published: number; draft: number }
  categories: number
  tags: number
  messages: number
}
export const fetchStats = () => http.get('/admin/stats') as Promise<Stats>
// 留言管理：删除
export const deleteMessage = (id: number) => http.delete(`/admin/messages/${id}`)
// 后台回复留言
export const replyMessage = (id: number, data: { nickname: string; content: string }) =>
  http.post(`/admin/messages/${id}/reply`, data) as Promise<{ id: number }>

// 附件管理
export interface Attachment {
  id: number
  filename: string
  original_name: string
  url: string
  size: number
  mime: string
  created_at: string
}
export const fetchAttachments = (params: { page?: number; size?: number }) =>
  http.get('/admin/attachments', { params }) as Promise<PageResult<Attachment>>
// 上传附件（multipart，axios 自动处理 FormData 边界）
export const uploadAttachment = (file: File) => {
  const fd = new FormData()
  fd.append('file', file)
  return http.post('/admin/attachments', fd) as Promise<{ id: number; url: string }>
}
export const deleteAttachment = (id: number) => http.delete(`/admin/attachments/${id}`)

// 评论
export interface ArticleComment {
  id: number
  article_id?: number
  nickname: string
  content: string
  parent_id?: number | null
  reply_nickname?: string
  created_at: string
  article_title?: string
  replies?: ArticleComment[]
}
// 前台：文章评论列表 + 提交
export const fetchComments = (articleId: number) =>
  http.get(`/articles/${articleId}/comments`) as Promise<ArticleComment[]>
export const createComment = (articleId: number, data: { content: string }) =>
  http.post(`/articles/${articleId}/comments`, data) as Promise<{ id: number }>
// 后台：评论管理
export const adminFetchComments = (params: { page?: number; size?: number }) =>
  http.get('/admin/comments', { params }) as Promise<PageResult<ArticleComment>>
export const deleteComment = (id: number) => http.delete(`/admin/comments/${id}`)
// 后台回复评论
export const replyComment = (id: number, data: { nickname: string; content: string }) =>
  http.post(`/admin/comments/${id}/reply`, data) as Promise<{ id: number }>

// 站点设置 / AI 配置（键值对）
// 公开：前台页面无需登录即可读取站点名称、描述等非敏感配置
export const fetchPublicSettings = () => http.get('/settings') as Promise<Record<string, string>>
// 后台：需管理员登录，可读取所有配置（含 AI key 脱敏）
export const fetchSettings = () => http.get('/admin/settings') as Promise<Record<string, string>>
// AI 密钥：返回未脱敏的 AI 配置（仅供 AI 写作页面使用，需管理员登录）
export const fetchAiSecrets = () => http.get('/admin/settings/ai-secrets') as Promise<Record<string, string>>
// AI 对话代理：后端转发，避免 CORS + 保护 API Key
export const aiChat = (data: { messages: { role: string; content: string }[]; temperature?: number; max_tokens?: number }) =>
  http.post('/admin/ai/chat', data) as Promise<any>
export const saveSetting = (key: string, value: string) => http.put(`/admin/settings/${key}`, { value })
// 后台文章列表（含草稿，可按状态筛选）
export const adminFetchArticles = (params: ArticleQuery & { status?: number | null }) =>
  http.get('/admin/articles', { params }) as Promise<PageResult<Article>>
// 后台文章详情（编辑回显）
export const adminFetchArticle = (id: number) => http.get(`/admin/articles/${id}`) as Promise<Article>

// 文章增改删
export const createArticle = (data: ArticlePayload) => http.post('/admin/articles', data) as Promise<{ id: number }>
export const updateArticle = (id: number, data: ArticlePayload) => http.put(`/admin/articles/${id}`, data)
export const deleteArticle = (id: number) => http.delete(`/admin/articles/${id}`)
// 快捷切换发布状态
export const updateArticleStatus = (id: number, status: number) =>
  http.patch(`/admin/articles/${id}/status`, { status })

// 分类增改删
export const createCategory = (name: string) => http.post('/admin/categories', { name }) as Promise<{ id: number }>
export const updateCategory = (id: number, name: string) => http.put(`/admin/categories/${id}`, { name })
export const deleteCategory = (id: number) => http.delete(`/admin/categories/${id}`)

// 标签增改删
export const createTag = (name: string) => http.post('/admin/tags', { name }) as Promise<{ id: number }>
export const updateTag = (id: number, name: string) => http.put(`/admin/tags/${id}`, { name })
export const deleteTag = (id: number) => http.delete(`/admin/tags/${id}`)
