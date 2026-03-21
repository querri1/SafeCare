# SafeCare (安心宝) - 心理健康管理微信小程序

一个面向日常心理健康管理的微信小程序，围绕"治愈练习 + 情绪记录 + 数据追踪"提供轻量、连续的自我关怀体验。

## 项目亮点

- 治愈中心：整合八段锦、五音疗法、量表测评等入口
- 情绪管理：支持情绪选择、日记记录与日历回溯
- 数据中心：展示打卡统计、测试记录与阶段性成果
- 个人中心：包含提醒、隐私、帮助、成就等常用设置
- 原生小程序实现：基于微信小程序原生框架开发，便于二次扩展

## 功能模块

### 治愈中心

- 八段锦练习
- 五音疗法（宫、商、角、徵、羽）
- 心理健康自测（PHQ-9、GAD-7、SAS）

### 数据中心

- 连续打卡统计
- 周/月完成情况展示
- 测评记录查看

### 个人中心

- 我的数据
- 成就徽章
- 打卡日历
- 提醒设置
- 隐私设置
- 帮助与反馈

## 项目结构

```text
SafeCare/
|-- miniprogram/                # 小程序主目录
|   |-- app.js
|   |-- app.json
|   |-- app.wxss
|   |-- components/             # 自定义组件
|   |   `-- navigation-bar/
|   |-- pages/                  # 业务页面
|   |   |-- healing-center/
|   |   |-- data-center/
|   |   |-- profile/
|   |   |-- music-therapy/
|   |   |-- phq9/
|   |   |-- gad7/
|   |   `-- ...
|   |-- utils/                  # 工具函数
|   `-- images/                 # 静态资源
|-- cloudfunctions/             # 云函数
|   `-- login/
|-- package.json
`-- README.md
```

## 技术栈

- 微信小程序原生开发
- JavaScript
- WXSS
- 云开发（云函数）
- `tdesign-miniprogram`（UI 组件依赖）

## 快速开始

### 1) 环境准备

- 安装微信开发者工具
- 准备可用的小程序 AppID（无 AppID 可先使用测试号）
- Node.js 环境（用于依赖安装）

### 2) 安装依赖

在项目根目录执行：

```powershell
cd E:\SafeCare
npm install
```

如需使用云函数（如 `cloudfunctions/login`），请安装对应依赖：

```powershell
cd E:\SafeCare\cloudfunctions\login
npm install
```

### 3) 在微信开发者工具运行

1. 打开微信开发者工具，导入 `E:\SafeCare`
2. 在工具中完成小程序 AppID 配置
3. 若使用 npm 包，执行"工具 -> 构建 npm"
4. 编译并在模拟器/真机预览

## 页面说明

- `pages/healing-center`：治愈活动聚合入口与今日概览
- `pages/music-therapy`：五音疗法选择与说明
- `pages/data-center`：打卡与测评数据可视化
- `pages/profile`：个人资料、设置与辅助功能入口
- `pages/emotion-diary`：情绪日记记录
- `pages/checkin-calendar`：打卡日历回顾

## 设计风格

- 卡片式信息布局
- 柔和渐变与圆角设计
- 统一主色调（#6366F1）
- 适配小程序常见屏幕尺寸

## 当前状态

项目已完成基础页面与核心流程搭建，并完成以下整理工作：

- TypeScript -> JavaScript 迁移
- SCSS -> WXSS 迁移
- 页面文件扩展名规范化（`.js` / `.json` / `.wxml` / `.wxss`）
- 导航栏组件简化
- 五音疗法页面补充

## 注意事项

- 部分功能依赖后端接口或云开发能力
- 涉及用户数据的页面建议在真机进行联调测试
- 发布前请补充隐私合规说明与用户授权流程

## 贡献指南

欢迎通过 Issue 或 Pull Request 参与改进：

1. Fork 本仓库并创建特性分支
2. 提交改动并附上清晰说明
3. 发起 PR，描述变更点与测试结果

## License

ISC
