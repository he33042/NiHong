import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchPublicSettings } from '@/api'
import { HERO_IMG } from '@/lib/assets'

// 站点设置 store：一次加载，全局共享，所有组件统一从这读取
export const useSettingsStore = defineStore('settings', () => {
  const siteName = ref('霓虹日志')
  const siteDesc = ref('在星尘与流萤交错的空间里，记录代码、灵感与碎片信号。')
  const nickname = ref('霓虹博主')
  const avatar = ref('')
  const github = ref('')
  const email = ref('')
  const icp = ref('')
  const heroImage = ref(HERO_IMG)
  const aboutBio = ref('')
  const aboutSite = ref('')
  const cloudProvider = ref('')
  const loaded = ref(false)
  let _loading: Promise<void> | null = null

  async function load() {
    if (loaded.value) return
    if (_loading) return _loading
    _loading = (async () => {
      try {
        const s = await fetchPublicSettings()
        if (s.site_name) siteName.value = s.site_name
        if (s.site_desc) siteDesc.value = s.site_desc
        if (s.nickname) nickname.value = s.nickname
        if (s.avatar) avatar.value = s.avatar
        if (s.github) github.value = s.github
        if (s.email) email.value = s.email
        if (s.icp) icp.value = s.icp
        if (s.hero_image) heroImage.value = s.hero_image
        if (s.about_bio) aboutBio.value = s.about_bio
        if (s.about_site) aboutSite.value = s.about_site
        if (s.cloud_provider) cloudProvider.value = s.cloud_provider
      } catch {
        // 加载失败使用默认值，不影响页面展示
      }
      loaded.value = true
      _loading = null
    })()
    return _loading
  }

  // 后台保存后刷新（重置 loaded 标记，下次访问强制重新拉取）
  function refresh() {
    loaded.value = false
    _loading = null
    return load()
  }

  return { siteName, siteDesc, nickname, avatar, github, email, icp, heroImage, aboutBio, aboutSite, cloudProvider, loaded, load, refresh }
})
