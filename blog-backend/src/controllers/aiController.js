const settingService = require('../services/settingService');
const { success } = require('../utils/response');
const AppError = require('../utils/AppError');

// POST /api/admin/ai/chat AI 对话代理（避免浏览器 CORS 问题，保护 API Key 不泄露到前端）
exports.chat = async (req, res) => {
  const { messages, temperature = 0.7, max_tokens = 4096 } = req.body || {};
  if (!messages || !Array.isArray(messages) || !messages.length) {
    throw new AppError(400, '请提供 messages 参数');
  }

  // 从数据库读取 AI 配置
  const all = await settingService.getAll();
  const apiBase = (all.ai_api_base || '').replace(/\/+$/, '');
  const apiKey = all.ai_api_key || '';
  const model = all.ai_model || '';
  const enabled = all.ai_enabled === '1';

  if (!enabled) throw new AppError(400, 'AI 功能未启用');
  if (!apiBase || !apiKey || !model) throw new AppError(400, 'AI 配置不完整，请先配置 API 地址、Key 和模型');

  // 转发到 AI 服务商
  const resp = await fetch(`${apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens })
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new AppError(502, err.error?.message || `AI 服务返回 ${resp.status}`);
  }

  const data = await resp.json();
  success(res, data);
};
