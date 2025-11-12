# MediaPipe Pose & Three.js VRM Demo

基于 React + Rspack 构建的 MediaPipe 姿态检测与 Three.js VRM 模型驱动演示项目。

## 📋 项目简介

本项目展示了如何使用 MediaPipe Pose 进行实时人体姿态检测，并将检测结果应用到 Three.js VRM 模型上，实现虚拟角色的实时动作驱动。

## ✨ 功能特性

- 🎯 基于 MediaPipe Pose 的实时姿态检测
- 🎭 Three.js VRM 模型加载与渲染
- 🔄 姿态数据到 VRM 模型的实时映射
- 📹 支持视频文件输入
- ⚡ 基于 Rspack 的快速构建与热更新

## 🛠️ 技术栈

- **框架**: React 18
- **构建工具**: Rspack
- **3D 渲染**: Three.js
- **姿态检测**: @mediapipe/pose
- **VRM 支持**: @pixiv/three-vrm
- **样式处理**: Sass/SCSS

## 📦 安装

```bash
# 安装依赖
npm install
```

## 🚀 使用

### 开发模式

```bash
npm run dev
```

开发服务器将在 `http://localhost:9000` 启动。

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `build` 目录。

## 📁 项目结构

```
media-pipe-vrm/
├── src/
│   ├── app.jsx          # 应用入口
│   ├── pageEntry.jsx    # 页面入口
│   ├── vrmRoot.jsx      # VRM 根组件
│   └── *.mp4            # 视频资源
├── public/              # 静态资源
├── build/               # 构建输出目录
├── index.html           # HTML 模板
├── rspack.config.js     # Rspack 配置
└── package.json         # 项目配置
```

## ⚙️ 配置说明

- **开发服务器端口**: 9000
- **支持的文件类型**: 图片、视频、VRM 相关格式（.vpd, .vmd）
- **跨域配置**: 已配置 CORS 相关头部，支持跨域访问
