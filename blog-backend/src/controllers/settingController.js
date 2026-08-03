const settingService = require('../services/settingService');
const { success } = require('../utils/response');
const AppError = require('../utils/AppError');

// 允许写入的配置键白名单（防止任意键污染配置表）
const ALLOWED_KEYS = [
  'site_name', 'site_desc', 'nickname', 'avatar', 'github', 'email', 'icp',
  'ai_enabled', 'ai_api_base', 'ai_api_key', 'ai_model', 'ai_prompt',
  'hero_image', 'about_bio', 'about_site', 'cloud_provider'
];

// 敏感配置键（返回时脱敏）
const SENSITIVE_KEYS = ['ai_api_key'];

// 公开配置键：前台页面允许读取的配置（不含 AI 密钥等敏感项）
const PUBLIC_KEYS = ['site_name', 'site_desc', 'nickname', 'avatar', 'github', 'email', 'icp', 'hero_image', 'about_bio', 'about_site', 'cloud_provider'];

// GET /api/admin/settings 获取全部站点配置（需登录，敏感值脱敏）
exports.getAll = async (req, res) => {
  const settings = await settingService.getAll();
  // 对敏感值脱敏：仅显示前4位和后4位
  for (const key of SENSITIVE_KEYS) {
    if (settings[key] && settings[key].length > 8) {
      settings[key] = settings[key].slice(0, 4) + '****' + settings[key].slice(-4);
    }
  }
  success(res, settings);
};

// GET /api/settings 获取公开站点配置（无需登录，仅返回前台需要的字段）
exports.getPublic = async (req, res) => {
  const all = await settingService.getAll();
  const result = {};
  for (const key of PUBLIC_KEYS) {
    if (all[key]) result[key] = all[key];
  }
  success(res, result);
};

// PUT /api/admin/settings/:key 写入单个配置（需登录）
exports.upsert = async (req, res) => {
  const key = req.params.key;
  if (!ALLOWED_KEYS.includes(key)) throw new AppError(400, '不支持的配置项');
  let value = req.body?.value ?? '';
  // 如果传入的是脱敏值（含 **** 占位符），说明用户未修改敏感字段，静默跳过
  if (value.includes('****')) {
    return success(res, null, '已跳过（未修改）');
  }
  // 限制 value 长度，防止撑爆数据库
  if (value.length > 10000) throw new AppError(400, '配置值不能超过 10000 个字符');
  await settingService.upsert(key, value);
  success(res, null, '保存成功');
};

// GET /api/admin/settings/ai-secrets 返回未脱敏的 AI 配置（仅 AI 写作页面调用）
const AI_KEYS = ['ai_enabled', 'ai_api_base', 'ai_api_key', 'ai_model', 'ai_prompt'];
exports.getAiSecrets = async (req, res) => {
  const all = await settingService.getAll();
  const result = {};
  for (const key of AI_KEYS) {
    if (all[key]) result[key] = all[key];
  }
  success(res, result);
};
