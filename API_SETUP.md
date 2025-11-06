# API 密钥配置指南

## 🔑 如何设置 API 密钥

### 1. 创建环境变量文件

在项目根目录创建 `.env` 文件：

```bash
cp .env.example .env
```

### 2. 配置 DeepSeek API 密钥

编辑 `.env` 文件，添加您的 DeepSeek API 密钥：

```env
VITE_DEEPSEEK_API_KEY=sk-your-actual-deepseek-api-key-here
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
```

#### 获取 DeepSeek API 密钥：
1. 访问 [DeepSeek Platform](https://platform.deepseek.com/)
2. 注册/登录账户
3. 进入 API Keys 页面
4. 点击 "Create new secret key"
5. 复制生成的密钥到 `.env` 文件

### 3. 可选的第三方 API 配置

#### 百度语音 API（用于语音识别和合成）
```env
VITE_BAIDU_APP_ID=your_baidu_app_id
VITE_BAIDU_API_KEY=your_baidu_api_key
VITE_BAIDU_SECRET_KEY=your_baidu_secret_key
```

获取方式：
1. 访问 [百度AI开放平台](https://ai.baidu.com/)
2. 创建语音技术应用
3. 获取 App ID、API Key、Secret Key

#### 高德地图 API（用于地图显示）
```env
VITE_AMAP_API_KEY=your_amap_api_key
```

获取方式：
1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册开发者账号
3. 创建 Web 端应用
4. 获取 API Key

### 4. 重启应用

配置完成后重启开发服务器：

```bash
npm run dev
```

## 🔒 安全注意事项

1. **不要提交 `.env` 文件到 Git**
   - `.env` 文件已在 `.gitignore` 中
   - 只提交 `.env.example` 作为模板

2. **保护您的 API 密钥**
   - 不要在代码中硬编码 API 密钥
   - 不要在公共场所分享密钥
   - 定期轮换密钥

3. **使用环境变量**
   - 所有敏感信息都通过环境变量配置
   - 生产环境使用不同的密钥

## 🚀 当前功能状态

- ✅ **基础功能**：无需 API 密钥即可使用（使用模拟数据）
- 🔑 **AI 功能**：需要 DeepSeek API 密钥
- 🎤 **语音功能**：可选百度语音 API
- 🗺️ **地图功能**：可选高德地图 API

即使没有配置 API 密钥，您仍然可以体验应用的核心功能！