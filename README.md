# 🚀 QwenFlow

<div align="center">

![QwenFlow](https://img.shields.io/badge/QwenFlow-AI%20Workflow-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHJ4PSI0IiBmaWxsPSJ3aGl0ZSIvPjxwYXRoIGQ9Ik04IDEySDEyTTE2IDEyTTEyIDhWMTIiIHN0cm9rZT0iIzYzNjZmMSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=)

**基于通义千问的可视化 AI 工作流编排平台**


这是一个qwen模型体验，目前开放了图片生成，图片修改，图片生视频，大语言模型等，最大的优势是你仅需要注册qwen的api_key就可以直接使用，所以，为什么不试试呢？

[中文](#中文) | [English](#english)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/qwen_workflow_low_code?referralCode=qwen_workflow_low_code)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/d4c-val/qwen_workflow_low_code)

</div>

---

## 中文

### ✨ 功能特性

#### 核心能力
- 🎨 **可视化工作流编排** - 拖拽式节点操作，直观构建 AI 工作流
- 💬 **多模型对话** - 支持 Qwen Plus / Turbo / Max 等多种模型
- 🖼️ **AI 图像生成** - 基于 Qwen-Image-Max 的高质量图像生成
- 🖌️ **智能图像编辑** - 多图输入 + 自然语言指令编辑图片
- 👁️ **视觉理解分析** - 基于 Qwen-VL 的图像内容理解
- 🎬 **AI 视频生成** - 图生视频，支持异步生成和轮询查询
- ⚡ **脚本处理节点** - JavaScript 代码处理中间数据
- 🔗 **节点变量引用** - 使用 `{{node_id}}` 灵活引用上游输出

#### 调试功能 🐛
- 🔍 **调试模式** - 单步执行工作流，每执行一层节点后暂停
- 📊 **节点调试面板** - 双击节点查看输入、输出和配置详情
- 🔄 **单节点运行** - 可单独运行某个节点进行测试
- 📝 **历史记录** - 保存每次执行的所有节点输入输出
- 🔗 **参数传递可视化** - 清晰展示上游节点如何传递到下游参数

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

<details>
<summary>🇨🇳 国内用户：Docker 镜像加速配置</summary>

如果 `docker-compose up` 时下载镜像超时，需要配置镜像加速：

1. 打开 **Docker Desktop** → **Settings** → **Docker Engine**
2. 添加以下配置：

```json
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ]
}
```

3. 点击 **Apply & Restart**
4. 重新执行 `docker-compose up -d`

</details>

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
| `DASHSCOPE_API_KEY` | ✅ | 阿里云 DashScope API Key（[获取地址](https://dashscope.console.aliyun.com/apiKey)） |
| `PORT` | ❌ | 服务端口（默认 8000） |

**获取 API Key：**
1. 访问 [阿里云 DashScope 控制台](https://dashscope.console.aliyun.com/)
2. 注册/登录账号
3. 进入 [API-KEY 管理](https://dashscope.console.aliyun.com/apiKey)
4. 创建新的 API Key
5. 复制到 `.env` 文件中

### 📦 节点类型

#### 输入节点
| 节点 | 图标 | 功能 |
|------|------|------|
| Prompt | ✏️ | 文本输入节点 |

#### AI 文本
| 节点 | 图标 | 功能 |
|------|------|------|
| Chat | 💬 | AI 对话生成 |
| Prompt Gen | 🎯 | 图像提示词生成（生成正负提示词 JSON） |

#### AI 图像
| 节点 | 图标 | 功能 |
|------|------|------|
| Image | 🎨 | AI 图像生成 |
| Edit | 🖌️ | AI 图像编辑 |
| Vision | 👁️ | 视觉理解分析 |

#### AI 视频
| 节点 | 图标 | 功能 |
|------|------|------|
| Video | 🎬 | 图生视频（支持异步生成） |

#### 处理工具
| 节点 | 图标 | 功能 |
|------|------|------|
| Script | ⚡ | JavaScript 代码处理 |

#### 调试工具
| 节点 | 图标 | 功能 |
|------|------|------|
| Debug | 🐛 | 调试输出，显示上游节点结果 |

### 🔧 技术栈

- **前端**: React 19 + Vite 7 + ReactFlow (可视化节点编排)
- **后端**: FastAPI + Python 3.11 + Uvicorn
- **AI 服务**: 阿里云 DashScope (通义千问系列模型)
- **部署**: Docker + Docker Compose
- **样式**: CSS Variables (支持深色/浅色主题)

### 🎯 项目亮点

1. **零配置部署** - Docker 一键启动，无需复杂配置
2. **完整的调试系统** - 单步执行、节点详情、历史回放
3. **实时参数追踪** - 可视化展示数据如何在节点间传递
4. **多模态 AI 能力** - 文本、图像、视频一站式处理
5. **友好的用户体验** - ComfyUI 风格界面，直观易用

### 📝 使用示例

#### 1. 基础对话流程
```
[Prompt] → [Chat] → [Debug]
输入问题  → AI回答 → 查看结果
```

#### 2. 图像生成 + 编辑
```
[Prompt] → [Prompt Gen] → [Image] → [ImageEdit] → [Debug]
描述词   → 生成提示词   → 生成图  → AI编辑    → 预览
```

#### 3. 图像理解分析
```
[Image] → [Vision] → [Chat] → [Debug]
生成图 → 描述图片 → 扩展分析 → 输出
```

#### 4. 图生视频流程
```
[Prompt] → [Image] → [Video] → [Debug]
描述词   → 生成图  → 生成视频 → 预览
```

### 🐛 调试功能使用

#### 调试模式（单步执行）
1. 点击顶部工具栏的 **🐛 调试** 按钮开启调试模式
2. 点击 **▶ 运行** 开始执行工作流
3. 工作流会在每层节点执行后自动暂停
4. 查看当前执行的节点状态和结果
5. 点击 **⏭ 下一步** 继续执行下一层
6. 可随时点击 **■ 停止** 取消执行

**特点：**
- 显示当前执行层级（如 "层 1/3"）
- 显示待执行节点列表
- 适合调试复杂工作流

#### 查看节点详情
1. **双击任意节点** 打开调试面板
2. 切换三个选项卡查看详细信息：
   - **📥 输入** - 查看节点配置和上游传入的数据
   - **📤 输出** - 查看节点执行结果
   - **⚙️ 配置** - 查看完整的节点配置 JSON
3. 可在面板中点击 **▶ 运行此节点** 单独测试

**提示：** 鼠标悬停在节点上会显示 "双击调试" 提示

#### 参数传递查看
连接节点后，下游节点会自动显示 **🔗 参数传递** 面板，包含：
- **映射关系** - 显示 `[上游节点] → [目标参数]`
- **模板引用** - 显示你使用的 `{{node_id}}` 模板
- **替换结果** - 显示实际传递的值
- **状态指示** - ✓ 已传递 或 ⏳ 待执行

#### 历史记录查看
1. 点击右侧面板切换到 **历史记录** 标签
2. 每条记录显示执行状态、时间和耗时
3. 点击记录的 **🔍 查看详情** 按钮
4. 展开节点查看该次执行的输入输出详情
5. 点击 **🔄 重跑** 可以重新执行该工作流

**保存内容：**
- 每个节点的输入数据
- 每个节点的输出结果
- 执行状态和错误信息
- 最多保存 20 条历史记录

### 💡 使用技巧

#### 节点变量引用
在任何输入框中使用 `{{node_id}}` 引用上游节点的输出：

```javascript
// 在 Chat 节点中引用 Prompt 节点
输入: {{node_1736841234567}}

// 在 Image 节点中引用多个节点
正向提示词: {{node_123}} {{node_456}}
负向提示词: {{node_789}}
```

**查找节点 ID：**
- 双击节点打开调试面板
- 在 "⚙️ 配置" 选项卡中查看 "节点 ID"
- 或在参数传递面板中查看来源节点名称

#### Script 节点编程
使用 JavaScript 处理数据：

```javascript
// 访问上游节点结果
const text = context['node_1736841234567'];

// 处理数据
const result = text.toUpperCase();

// 返回结果（会传递给下游）
return result;
```

#### 图像编辑技巧
1. 可以输入多张图片 URL（每行一个）
2. 或者留空自动获取上游图片节点的输出
3. 使用自然语言描述编辑需求，如：
   - "把背景改成海滩"
   - "添加一只猫咪"
   - "改成油画风格"

#### 视频生成说明
- 视频生成为异步任务，会先返回任务 ID
- 系统会自动轮询查询生成进度
- 默认最多等待 10 分钟
- 支持 720P 和 1080P 分辨率
- 支持 5/10/15 秒时长

---

## English

### ✨ Features

#### Core Capabilities
- 🎨 **Visual Workflow Builder** - Drag-and-drop node-based workflow creation
- 💬 **Multi-Model Chat** - Support for Qwen Plus / Turbo / Max models
- 🖼️ **AI Image Generation** - High-quality image generation with Qwen-Image-Max
- 🖌️ **Smart Image Editing** - Multi-image input with natural language instructions
- 👁️ **Vision Analysis** - Image understanding powered by Qwen-VL
- 🎬 **AI Video Generation** - Image-to-video with async generation and polling
- ⚡ **Script Node** - JavaScript processing for intermediate data
- 🔗 **Variable References** - Use `{{node_id}}` to reference upstream outputs

#### Debug Features 🐛
- 🔍 **Debug Mode** - Step-by-step execution, pause after each layer
- 📊 **Node Debug Panel** - Double-click nodes to view inputs, outputs, and configs
- 🔄 **Single Node Execution** - Run individual nodes for testing
- 📝 **Execution History** - Save all node inputs/outputs for each run
- 🔗 **Parameter Mapping Visualization** - See how data flows between nodes

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

<details>
<summary>🇨🇳 China Users: Docker Mirror Configuration</summary>

If image download times out, configure Docker mirror:

1. Open **Docker Desktop** → **Settings** → **Docker Engine**
2. Add configuration:

```json
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ]
}
```

3. Click **Apply & Restart**
4. Run `docker-compose up -d` again

</details>

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
| `DASHSCOPE_API_KEY` | ✅ | Alibaba Cloud DashScope API Key ([Get Here](https://dashscope.console.aliyun.com/apiKey)) |
| `PORT` | ❌ | Service port (default: 8000) |

**Get API Key:**
1. Visit [Alibaba Cloud DashScope Console](https://dashscope.console.aliyun.com/)
2. Register/Login
3. Go to [API Key Management](https://dashscope.console.aliyun.com/apiKey)
4. Create a new API Key
5. Copy it to your `.env` file

### 🐛 Debug Features

#### Debug Mode (Step-by-Step)
1. Click **🐛 Debug** button to enable debug mode
2. Click **▶ Run** to start workflow
3. Workflow pauses after each layer execution
4. Review node status and results
5. Click **⏭ Next** to continue
6. Click **■ Stop** to cancel anytime

#### View Node Details
1. **Double-click any node** to open debug panel
2. Three tabs available:
   - **📥 Input** - View configs and upstream data
   - **📤 Output** - View execution results
   - **⚙️ Config** - View complete node JSON
3. Click **▶ Run This Node** to test individually

#### Parameter Mapping
Connected nodes show **🔗 Parameter Mapping** panel with:
- Mapping relationship: `[Upstream] → [Target Parameter]`
- Template reference: `{{node_id}}`
- Actual value passed
- Status: ✓ Passed or ⏳ Pending

#### Execution History
1. Click **History** tab in right panel
2. Each record shows status, time, and duration
3. Click **🔍 View Details** to see node I/O
4. Click **🔄 Rerun** to execute again
5. Keeps last 20 execution records

### 🔧 Tech Stack

- **Frontend**: React 19 + Vite 7 + ReactFlow (Visual node orchestration)
- **Backend**: FastAPI + Python 3.11 + Uvicorn
- **AI Service**: Alibaba Cloud DashScope (Qwen Series Models)
- **Deployment**: Docker + Docker Compose
- **Styling**: CSS Variables (Dark/Light theme support)

### 🎯 Highlights

1. **Zero-Config Deployment** - One-command Docker startup
2. **Complete Debug System** - Step execution, node details, history replay
3. **Real-time Parameter Tracking** - Visualize data flow between nodes
4. **Multi-modal AI** - Text, image, video processing in one platform
5. **User-Friendly** - ComfyUI-inspired interface, intuitive and easy to use

### 🚧 Roadmap

- [ ] More AI models support
- [ ] Workflow templates library
- [ ] Collaborative editing
- [ ] Cloud deployment integration
- [ ] Performance monitoring

### ❓ FAQ

**Q: 如何获取 DashScope API Key？**  
A: 访问 [阿里云 DashScope 控制台](https://dashscope.console.aliyun.com/apiKey) 注册并创建 API Key。

**Q: 支持哪些模型？**  
A: 支持通义千问系列所有模型，包括 Qwen Plus/Turbo/Max、Qwen-VL、Qwen-Image 系列等。

**Q: 视频生成需要多久？**  
A: 通常 5-15 秒的视频需要 2-5 分钟生成，系统会自动轮询查询进度。

**Q: 可以部署到云平台吗？**  
A: 可以，支持 Railway、Render 等平台一键部署，也可以部署到任何支持 Docker 的服务器。

**Q: 数据会被保存吗？**  
A: 历史记录仅保存在浏览器本地，不会上传到服务器。重启浏览器后会清空。

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📮 Contact

- **Issues**: 欢迎提交 [Issue](https://github.com/d4c-val/qwen_workflow_low_code/issues)
- **Discussions**: 加入 [Discussions](https://github.com/d4c-val/qwen_workflow_low_code/discussions) 讨论
- **Email**: 如有商务合作或私密问题，请通过 GitHub Profile 联系

### 🙏 致谢

感谢以下开源项目：
- [ReactFlow](https://reactflow.dev/) - 强大的可视化节点编排库
- [FastAPI](https://fastapi.tiangolo.com/) - 现代化的 Python Web 框架
- [Alibaba Cloud DashScope](https://dashscope.aliyun.com/) - 通义千问 AI 服务

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！**

Made with ❤️ using Qwen AI

</div>

