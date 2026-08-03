// 云服务商域名匹配规则（优先级从高到低）
const PROVIDER_RULES: { pattern: RegExp; name: string; color: string }[] = [
  // 阿里云
  { pattern: /aliyun(cs|\.com)/i, name: '阿里云', color: '#FF6A00' },
  // 腾讯云
  { pattern: /(cloud\.tencent|tencentcloud|qcloud)\.com/i, name: '腾讯云', color: '#0052D9' },
  // 华为云
  { pattern: /huawei(cloud)?\.com/i, name: '华为云', color: '#CF0A2C' },
  // 百度智能云
  { pattern: /bce\.baidu\.com/i, name: '百度智能云', color: '#2468E5' },
  // 京东云
  { pattern: /jdcloud\.com/i, name: '京东云', color: '#E2231A' },
  // 火山引擎
  { pattern: /volc(engine|ces)\.com/i, name: '火山引擎', color: '#3370FF' },
  // UCloud
  { pattern: /ucloud\.(cn|com)/i, name: 'UCloud', color: '#0099FF' },
  // 七牛云
  { pattern: /qiniu\.com/i, name: '七牛云', color: '#00B96B' },
  // AWS
  { pattern: /(aws\.amazon|amazonaws)\.com/i, name: 'AWS', color: '#FF9900' },
  // Azure
  { pattern: /azure\.(microsoft|com)/i, name: 'Azure', color: '#0078D4' },
  // GCP
  { pattern: /(cloud\.google|gcp)\.com/i, name: 'Google Cloud', color: '#4285F4' },
  // DigitalOcean
  { pattern: /digitalocean\.com/i, name: 'DigitalOcean', color: '#0080FF' },
  // Vercel
  { pattern: /vercel\.com/i, name: 'Vercel', color: '#000000' },
  // Netlify
  { pattern: /netlify\.com/i, name: 'Netlify', color: '#00C7B7' },
  // Cloudflare
  { pattern: /cloudflare\.com/i, name: 'Cloudflare', color: '#F38020' },
  // Railway
  { pattern: /railway\.app/i, name: 'Railway', color: '#0B0D0E' },
  // 青云
  { pattern: /qingcloud\.com/i, name: '青云', color: '#00A971' },
]

export interface CloudProviderInfo {
  name: string
  color: string
}

export function getCloudProviderInfo(url: string): CloudProviderInfo | null {
  if (!url) return null
  try {
    const hostname = new URL(url).hostname
    for (const rule of PROVIDER_RULES) {
      if (rule.pattern.test(hostname)) {
        return { name: rule.name, color: rule.color }
      }
    }
    // 未匹配则用域名作为名称
    return { name: hostname, color: '#888' }
  } catch {
    return null
  }
}
