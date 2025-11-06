# AI 旅行规划师 (AI Travel Planner)

一个基于 AI 的智能旅行规划 Web 应用，支持语音输入、智能行程生成、费用管理和地图导航。

## ✨ 主要功能

### 🎯 智能行程规划
- **语音输入**: 支持语音描述旅行需求，AI 自动解析
- **智能生成**: 基于目的地、预算、偏好等信息生成个性化行程
- **详细规划**: 包含交通、住宿、景点、餐厅等完整信息
- **多方案对比**: 提供经济版、标准版、豪华版等多种方案

### 💰 费用预算与管理
- **预算分析**: AI 智能预算分配和费用估算
- **语音记账**: 支持语音输入费用记录
- **分类统计**: 按住宿、交通、餐饮等类别统计支出
- **图表分析**: 饼图、柱状图等可视化费用分析

### 👤 用户管理与数据存储
- **注册登录**: 完整的用户认证系统
- **个人资料**: 用户信息和旅行偏好管理
- **云端同步**: 旅行计划、偏好设置、费用记录云端同步
- **多设备访问**: 支持多设备查看和修改数据

### 🗺️ 地图导航
- **地图集成**: 基于高德地图的地理位置服务
- **路线规划**: 景点位置标记和路线导航
- **实时定位**: 当前位置和目的地导航

## 🛠️ 技术栈

### 前端框架
- **React 18** - 现代化前端框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 快速的构建工具

### UI 组件库
- **Ant Design** - 企业级 UI 设计语言
- **Styled Components** - CSS-in-JS 样式解决方案
- **Framer Motion** - 流畅的动画效果
- **Lucide React** - 现代化图标库

### 状态管理
- **Zustand** - 轻量级状态管理
- **React Query** - 服务端状态管理

### 语音功能
- **React Speech Kit** - 语音识别和语音合成

### 地图服务
- **高德地图 API** - 地理位置服务和导航

### 数据可视化
- **Recharts** - React 图表库

## 🚀 快速开始

### 环境要求
- Node.js 16+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 配置环境变量
1. 复制 `.env.example` 到 `.env`
2. 配置必要的 API 密钥：
```env
# DeepSeek API 配置（用于 AI 功能）
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here

# 可选配置
VITE_AMAP_API_KEY=your_amap_api_key_here  # 高德地图
VITE_BAIDU_API_KEY=your_baidu_api_key_here  # 百度语音
```

详细配置说明请参考 [API_SETUP.md](./API_SETUP.md)

### 启动开发服务器
```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动

### 构建生产版本
```bash
npm run build
```

## 📱 功能演示

### 1. 智能行程规划
- 点击"创建新行程"
- 使用语音输入："我想去日本，5天，预算1万元，喜欢美食和动漫，带孩子"
- AI 自动解析并生成详细行程

### 2. 费用管理
- 进入"费用管理"页面
- 使用语音记录："打车50元"
- 查看费用统计图表

### 3. 地图导航
- 在行程详情中查看地图
- 点击景点标记查看详细信息
- 获取导航路线

## 🎨 界面设计

### 设计理念
- **现代化**: 采用渐变背景和毛玻璃效果
- **响应式**: 适配桌面端和移动端
- **直观性**: 清晰的信息层级和操作流程
- **美观性**: 精美的图标和动画效果

### 主要页面
- **首页**: 功能概览和快速操作
- **行程规划**: 创建和管理旅行计划
- **费用管理**: 记录和分析旅行开销
- **个人资料**: 用户信息和偏好设置

## 🔧 开发说明

### 项目结构
```
src/
├── components/          # 可复用组件
│   ├── Header.tsx      # 顶部导航
│   ├── VoicePlanningForm.tsx  # 语音规划表单
│   ├── ItineraryDisplay.tsx   # 行程展示
│   └── MapDisplay.tsx  # 地图组件
├── pages/              # 页面组件
│   ├── Home.tsx        # 首页
│   ├── Planning.tsx    # 行程规划
│   ├── Budget.tsx      # 费用管理
│   ├── Profile.tsx     # 个人资料
│   └── Login.tsx       # 登录注册
├── store/              # 状态管理
│   ├── authStore.ts    # 用户认证
│   └── planningStore.ts # 行程规划
├── services/           # API 服务
│   └── aiPlanningService.ts # AI 规划服务
├── types/              # TypeScript 类型定义
└── utils/              # 工具函数
```

### 核心组件说明

#### VoicePlanningForm
- 语音识别和表单输入
- 智能解析用户需求
- 生成规划请求

#### ItineraryDisplay
- 行程详细展示
- 时间线布局
- 费用统计

#### MapDisplay
- 高德地图集成
- 景点标记
- 路线规划

## 🌟 特色功能

### 语音识别
- 支持中文语音识别
- 智能解析旅行需求
- 自动填充表单字段

### AI 规划
- 基于用户偏好生成行程
- 智能预算分配
- 多方案对比

### 数据可视化
- 费用分类饼图
- 每日支出趋势
- 预算使用情况

## 📄 许可证

MIT License

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

如有问题或建议，请联系：wulingling@example.com