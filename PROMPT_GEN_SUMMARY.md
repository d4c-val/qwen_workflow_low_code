# ✅ Prompt Gen → Image 参数传递问题已完全修复

## 🎯 问题总结

用户反馈：Prompt Gen 节点生成的 JSON 包含两个字段（`prompt` 和 `negative_prompt`），但传递给 Image 节点时，**两个参数混在一起**，无法正确分别传入 Image 节点的两个独立输入框。

## 🔍 根本原因

**变量替换时机错误：**

```javascript
// 问题代码（第 114 行）
const userPrompt = replaceVariables(data.prompt || "", context);

// 当 Image 节点的 prompt 字段为 "{{node_xxx}}" 时：
// context[node_xxx] = { prompt: "...", negative_prompt: "..." }  // JSON 对象
// replaceVariables 会把对象转成字符串: "[object Object]" ❌
```

**执行流程问题：**
```
Prompt Gen 输出 JSON → 存入 context → Image 节点引用 {{node_xxx}} 
→ replaceVariables 转换对象为字符串 → 两个字段都丢失 ❌
```

## ✅ 解决方案

### 核心策略：特殊处理 JSON 对象

**关键改进：**
1. **提前检测**：在变量替换之前，先检查上游是否有 chatForImage 返回的 JSON 对象
2. **直接提取**：不经过变量替换，直接从 context 中获取 JSON 对象
3. **分别处理**：手动提取 `prompt` 和 `negative_prompt` 两个字段
4. **手动输入优先**：用户填写的内容优先于上游值

### 修改文件 1：WorkflowEngine.js

**位置：** 第 140-192 行

**核心逻辑：**
```javascript
case 'image': {
  const upstreamIds = getUpstreamNodeIds(node.id, edges);
  let foundJsonUpstream = false;
  let prompt = "";
  let negativePrompt = "";
  
  // ✅ 第一步：检测上游是否有 JSON 对象
  for (const upId of upstreamIds) {
    const upResult = context[upId];
    
    if (upResult && typeof upResult === 'object' && upResult.prompt) {
      foundJsonUpstream = true;
      
      // ✅ 第二步：判断是否手动输入（在变量替换之前）
      const hasManualPrompt = 
        data.prompt && data.prompt.trim() && !data.prompt.includes('{{');
      const hasManualNegativePrompt = 
        data.negative_prompt && data.negative_prompt.trim() && !data.negative_prompt.includes('{{');
      
      // ✅ 第三步：直接提取字段，不做变量替换
      prompt = hasManualPrompt ? data.prompt : upResult.prompt;
      negativePrompt = hasManualNegativePrompt ? data.negative_prompt : (upResult.negative_prompt || "");
      
      break;
    }
  }
  
  // ✅ 第四步：如果没有 JSON 上游，使用常规逻辑（兼容其他场景）
  if (!foundJsonUpstream) {
    prompt = userPrompt;
    negativePrompt = replaceVariables(data.negative_prompt || "", context);
  }
  
  return await callApi('image', { prompt, negative_prompt: negativePrompt, ... });
}
```

### 修改文件 2：CustomNodes.jsx

**位置：** 第 522-598 行（参数映射）、第 742-791 行（显示逻辑）

**核心改进：**
1. **特殊识别**：检测 chatForImage → Image 的连接
2. **分别映射**：为 prompt 和 negative_prompt 分别创建映射
3. **状态标记**：区分自动提取和手动输入
4. **视觉反馈**：不同状态使用不同的图标和颜色

**参数映射逻辑：**
```javascript
// 特殊处理：chatForImage 节点传递 JSON 到 Image 节点
if (current.type === 'image' && 
    upstream.type === 'chatForImage' && 
    upstream.result && typeof upstream.result === 'object') {
  
  // ✨ 正向提示词映射
  parameterMappings.push({
    targetField: '✨ Prompt (正向提示词)',
    sourceResult: upstream.result.prompt,
    hasManualInput: hasManualPrompt,  // 🔑 关键标记
    isJsonField: true,
  });
  
  // 🚫 负向提示词映射
  parameterMappings.push({
    targetField: '🚫 Negative Prompt (负向提示词)',
    sourceResult: upstream.result.negative_prompt,
    hasManualInput: hasManualNegativePrompt,  // 🔑 关键标记
    isJsonField: true,
  });
}
```

**显示逻辑：**
```javascript
{mapping.isJsonField && (
  <div>
    {mapping.hasManualInput ? (
      <>
        <Badge>✍️ 手动输入优先，上游值被忽略</Badge>
        <div>手动输入的内容: {mapping.originalValue}</div>
      </>
    ) : (
      <Badge>📋 从 JSON 对象自动提取</Badge>
    )}
  </div>
)}
```

## 📊 修复效果对比

### 修复前 ❌

```
[Prompt Gen] → [Image]
  生成 JSON     使用 {{node_xxx}}
                ↓
                replaceVariables("[object Object]")
                ↓
                Prompt: "[object Object]" ❌
                Negative Prompt: "" ❌
```

**用户看到：**
- Prompt 字段显示 `[object Object]`
- Negative Prompt 字段为空
- 参数传递面板只显示 1 个映射或不显示

### 修复后 ✅

```
[Prompt Gen] → [Image]
  生成 JSON     直接从 context 提取 JSON
                ↓
                prompt = upResult.prompt
                negativePrompt = upResult.negative_prompt
                ↓
                Prompt: "一只可爱的猫..." ✅
                Negative Prompt: "模糊，低质量..." ✅
```

**用户看到：**
- 参数传递面板显示 `🔗 参数传递 (2)`
- 第一个映射：`[Prompt Gen] → [✨ Prompt (正向提示词)]`
  - `📋 从 JSON 对象自动提取`
  - 显示完整的正向提示词
- 第二个映射：`[Prompt Gen] → [🚫 Negative Prompt (负向提示词)]`
  - `📋 从 JSON 对象自动提取`
  - 显示完整的负向提示词

## 🎯 核心功能特性

### 1. 自动分离传递 ✨

```
Prompt Gen 输出: { prompt: "A", negative_prompt: "B" }
       ↓
Image 节点自动接收:
  - Prompt 字段 → "A"
  - Negative Prompt 字段 → "B"
```

### 2. 手动输入优先 ✍️

```
场景：Image 节点 Prompt 字段手动输入 "C"，Negative Prompt 留空
       ↓
最终使用:
  - Prompt → "C" (手动输入)
  - Negative Prompt → "B" (自动获取)
```

### 3. 实时可视化 🔍

- 参数传递面板实时显示数据流向
- 不同状态使用不同图标和颜色
- 手动输入时显示输入内容和上游被忽略的值

### 4. 调试支持 🐛

- 调试模式下单步查看每个节点的输入输出
- 控制台日志详细记录参数传递过程
- NodeDebugPanel 显示完整的参数信息

## 📋 测试验证

### 已完成测试

| 测试场景 | 状态 | 说明 |
|---------|------|------|
| 完全自动传递 | ✅ | 两个字段都从 JSON 自动提取 |
| 部分手动输入 | ✅ | Prompt 手动，Negative 自动 |
| 完全手动输入 | ✅ | 两个字段都手动输入 |
| 调试模式查看 | ✅ | 单步执行，查看详细信息 |
| 兼容性测试 | ✅ | 不影响其他节点的正常工作 |

### 测试方法

详细测试步骤和验收标准请参考：`PROMPT_GEN_TEST.md`

## 🚀 部署状态

- ✅ 代码修改完成
- ✅ Linter 检查通过
- ✅ Docker 镜像已重新构建
- ✅ 服务已启动（http://localhost:8000）
- ✅ 功能已生效并可用

## 📁 相关文件

### 核心代码
- `qwen-ui/src/WorkflowEngine.js` (第 140-192 行)
- `qwen-ui/src/components/CustomNodes.jsx` (第 522-598, 742-791 行)

### 文档
- `PROMPT_GEN_FIX.md` - 详细技术说明和实现方案
- `PROMPT_GEN_TEST.md` - 完整测试清单和排查指南
- `DEBUG_FEATURES.md` - 调试功能总览
- `README.md` - 项目主文档（已更新）

### 后端
- `main.py` (第 142-162 行) - Image API 实现（无需修改）

## 🎓 技术要点

### 1. 对象类型检测
```javascript
typeof upResult === 'object' && upResult.prompt
```

### 2. 手动输入判断
```javascript
const hasManual = data.field && data.field.trim() && !data.field.includes('{{');
```

### 3. 条件分支处理
```javascript
if (foundJsonUpstream) {
  // 特殊处理 JSON
} else {
  // 常规变量替换
}
```

### 4. 优先级控制
```javascript
value = hasManualInput ? manualValue : upstreamValue;
```

## 🔧 未来优化方向

- [ ] 支持模板引用 JSON 字段（如 `{{node_xxx.prompt}}`）
- [ ] 支持多个 Prompt Gen 的合并
- [ ] 添加提示词预览功能
- [ ] 支持提示词模板库
- [ ] 添加提示词质量评分

## 📞 问题反馈

如遇到问题，请检查：
1. Docker 镜像是否为最新版本
2. 浏览器是否已刷新缓存
3. 控制台是否有错误日志
4. 参考 `PROMPT_GEN_TEST.md` 进行排查

---

**修复日期：** 2026-01-09  
**问题状态：** ✅ 已完全修复  
**验证状态：** ✅ 已测试通过  
**部署状态：** ✅ 已上线运行

**修复人员：** AI Assistant  
**相关 Issue：** Prompt Gen → Image 参数传递问题  
**影响范围：** 仅影响 chatForImage → Image 的数据流向，不影响其他节点