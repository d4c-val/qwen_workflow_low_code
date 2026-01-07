# 贡献指南 | Contributing Guide

感谢你对 QwenFlow 的关注！我们欢迎各种形式的贡献。

## 🐛 报告 Bug

如果你发现了 Bug，请创建一个 Issue 并包含：
- 问题的详细描述
- 复现步骤
- 预期行为 vs 实际行为
- 截图（如适用）
- 环境信息（浏览器、操作系统等）

## 💡 功能建议

有新功能想法？请创建一个 Issue 并标记为 `enhancement`，包含：
- 功能描述
- 使用场景
- 可能的实现方式

## 🔧 提交代码

### 开发环境设置

```bash
# 1. Fork 并克隆仓库
git clone https://github.com/YOUR_USERNAME/qwenflow.git
cd qwenflow

# 2. 安装依赖
make install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 填入 API Key

# 4. 启动开发服务
# 终端1: 后端
uvicorn main:app --reload --port 8000
# 终端2: 前端
cd qwen-ui && npm run dev
```

### 提交规范

请使用以下格式的 commit message：

```
<type>(<scope>): <description>

[可选的详细描述]
```

类型（type）：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具链

示例：
```
feat(nodes): add new Image Upscale node
fix(engine): handle circular dependency error
docs(readme): update deployment instructions
```

### Pull Request 流程

1. 从 `main` 分支创建你的功能分支
2. 完成开发并测试
3. 确保代码通过 lint 检查
4. 提交 PR 并描述你的更改
5. 等待 review 和合并

## 📁 项目结构

```
qwenflow/
├── main.py              # FastAPI 后端入口
├── requirements.txt     # Python 依赖
├── Dockerfile          # Docker 构建文件
├── docker-compose.yml  # Docker Compose 配置
├── qwen-ui/            # React 前端
│   ├── src/
│   │   ├── App.jsx           # 主应用组件
│   │   ├── WorkflowEngine.js # 工作流引擎
│   │   └── components/       # UI 组件
│   └── ...
└── ...
```

## 📄 代码规范

### Python
- 使用 Python 3.9+
- 遵循 PEP 8 规范
- 使用 type hints

### JavaScript/React
- 使用 ES6+ 语法
- 函数组件 + Hooks
- 使用 memo 优化性能

## 🙏 感谢

感谢所有贡献者的付出！

