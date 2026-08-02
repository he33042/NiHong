// 与后端约定一致的类型定义
export interface AdminInfo {
  id: number
  username: string
  nickname: string
}

export interface UserInfo {
  id: number
  email: string
  nickname: string
}

export interface Category {
  id: number
  name: string
}

export interface Tag {
  id: number
  name: string
}

export interface Article {
  id: number
  title: string
  cover: string
  summary: string
  content?: string
  video_url: string
  category_id: number | null
  category_name?: string | null
  status: 0 | 1 // 0=草稿 1=已发布
  created_at: string
  updated_at: string
  tags: Tag[]
}

// 文章新增/修改提交体
export interface ArticlePayload {
  title: string
  cover: string
  summary: string
  content: string
  categoryId: number | null
  status: number
  tagIds: number[]
  videoUrl: string
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  size: number
}

// 留言
export interface Message {
  id: number
  nickname: string
  content: string
  email: string
  website: string
  parent_id: number | null
  created_at: string
  replies?: Message[]
}

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
