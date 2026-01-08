# 🚀 QwenFlow

<div align="center">

![QwenFlow](https://img.shields.io/badge/QwenFlow-AI%20Workflow-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHJ4PSI0IiBmaWxsPSJ3aGl0ZSIvPjxwYXRoIGQ9Ik04IDEySDEyTTE2IDEyTTEyIDhWMTIiIHN0cm9rZT0iIzYzNjZmMSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=)

**基于通义千问的可视化 AI 工作流编排平台**

[English](#english) | [中文](#中文)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/qwen_workflow_low_code?referralCode=qwen_workflow_low_code)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/d4c-val/qwen_workflow_low_code)

</div>

---

## 中文

### ✨ 功能特性

- 🎨 **可视化工作流编排** - 拖拽式节点操作，直观构建 AI 工作流
- 💬 **多模型对话** - 支持 Qwen Plus / Turbo / Max 等多种模型
- 🖼️ **AI 图像生成** - 基于 Qwen-Image-Max 的高质量图像生成
- 🖌️ **智能图像编辑** - 多图输入 + 自然语言指令编辑图片
- 👁️ **视觉理解分析** - 基于 Qwen-VL 的图像内容理解
- ⚡ **脚本处理节点** - JavaScript 代码处理中间数据
- 🐛 **调试节点** - 实时查看工作流执行结果
- 🔗 **节点变量引用** - 使用 `{{node_id}}` 灵活引用上游输出

### 📸 预览

![QwenFlow Preview](https://via.placeholder.com/800x450/f8fafc/6366f1?text=QwenFlow+Preview)

### 🚀 快速开始

#### 方式一：Docker 一键部署（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/d4c-val/qwen_workflow_low_code.git
cd qwen_workflow_low_code

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的 API Key

# 3. 启动服务
docker-compose up -d

# 访问 http://localhost:8000
```

#### 方式二：本地开发

```bash
# 后端
pip install -r requirements.txt
cp .env.example .env  # 编辑 .env 填入 API Key
uvicorn main:app --reload --port 8000

# 前端（新终端）
cd qwen-ui
npm install
npm run dev

# 访问 http://localhost:5173
```

### ⚙️ 环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `DASHSCOPE_API_KEY` | ✅ | 阿里云 DashScope API Key |
| `PORT` | ❌ | 服务端口（默认 8000） |

### 📦 节点类型

| 节点 | 图标 | 功能 |
|------|------|------|
| Prompt | ✏️ | 文本输入节点 |
| Chat | 💬 | AI 对话生成 |
| Image | 🎨 | AI 图像生成 |
| Edit | 🖌️ | AI 图像编辑 |
| Vision | 👁️ | 视觉理解分析 |
| Script | ⚡ | JavaScript 处理 |
| Debug | 🐛 | 调试输出 |

### 🔧 技术栈

- **前端**: React 19 + Vite + ReactFlow
- **后端**: FastAPI + Python 3.11
- **AI**: 阿里云 DashScope (通义千问系列)
- **部署**: Docker + Docker Compose

### 📝 使用示例

**1. 基础对话流程**
```
[Prompt] → [Chat] → [Debug]
输入问题  → AI回答 → 查看结果
```

**2. 图像生成 + 编辑**
```
[Prompt] → [Image] → [ImageEdit] → [Debug]
描述词   → 生成图 → AI编辑    → 预览
```

**3. 图像理解分析**
```
[Image] → [Vision] → [Chat] → [Debug]
生成图 → 描述图片 → 扩展分析 → 输出
```

---

## English

### ✨ Features

- 🎨 **Visual Workflow Builder** - Drag-and-drop node-based workflow creation
- 💬 **Multi-Model Chat** - Support for Qwen Plus / Turbo / Max models
- 🖼️ **AI Image Generation** - High-quality image generation with Qwen-Image-Max
- 🖌️ **Smart Image Editing** - Multi-image input with natural language instructions
- 👁️ **Vision Analysis** - Image understanding powered by Qwen-VL
- ⚡ **Script Node** - JavaScript processing for intermediate data
- 🐛 **Debug Node** - Real-time workflow execution results
- 🔗 **Variable References** - Use `{{node_id}}` to reference upstream outputs

### 🚀 Quick Start

#### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/d4c-val/qwen_workflow_low_code.git
cd qwen_workflow_low_code

# Configure environment
cp .env.example .env
# Edit .env and add your API Key

# Start the service
docker-compose up -d

# Visit http://localhost:8000
```

#### Option 2: Local Development

```bash
# Backend
pip install -r requirements.txt
cp .env.example .env  # Add your API Key
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd qwen-ui
npm install
npm run dev

# Visit http://localhost:5173
```

### ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DASHSCOPE_API_KEY` | ✅ | Alibaba Cloud DashScope API Key |
| `PORT` | ❌ | Service port (default: 8000) |

### 🔧 Tech Stack

- **Frontend**: React 19 + Vite + ReactFlow
- **Backend**: FastAPI + Python 3.11
- **AI**: Alibaba Cloud DashScope (Qwen Series)
- **Deployment**: Docker + Docker Compose

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📮 Contact

如有问题或建议，欢迎提交 Issue。

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！**

Made with ❤️ using Qwen AI

</div>

