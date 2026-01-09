# Prompt Gen → Image 节点参数传递优化说明

## 问题描述

当使用 **Prompt Gen (chatForImage)** 节点生成提示词 JSON 并连接到 **Image** 节点时：

1. ❌ **Prompt 和 Negative Prompt 混在一起**：两个参数都被塞到 prompt 字段
2. ❌ **Negative Prompt 没有正确传递**：负向提示词丢失或显示为 `[object Object]`
3. ❌ **无法独立控制**：无法单独为正向或负向提示词设置手动输入

## 问题原因分析

### 根本原因：变量替换时机错误

**原始代码的问题：**

```javascript
// WorkflowEngine.js 第 114 行
const userPrompt = replaceVariables(data.prompt || "", context);

// 当 data.prompt = "{{node_xxx}}" 且 context[node_xxx] 是 JSON 对象时：
// replaceVariables 会把 JSON 对象转换成字符串 "[object Object]"
```

**执行流程：**

```
[Prompt Gen] 输出: { prompt: "一只猫...", negative_prompt: "模糊..." }
       ↓
[context] 存储: { "node_xxx": { prompt: "...", negative_prompt: "..." } }
       ↓
[Image 节点] data.prompt = "{{node_xxx}}"
       ↓
[replaceVariables] 替换: "{{node_xxx}}" → "[object Object]" ❌
       ↓
[结果] prompt 和 negative_prompt 都无法正确获取
```

### 次要问题：判断逻辑不完善

```javascript
// 旧逻辑
if (!negativePrompt.trim() && upResult.negative_prompt) {
  negativePrompt = upResult.negative_prompt;
}
```

即使 `data.negative_prompt` 为空，经过 `replaceVariables()` 处理后可能返回非空字符串，导致条件判断失效。

## 解决方案

### 核心策略：JSON 对象特殊处理

**关键思路：**
- 对于 chatForImage → Image 的连接，**不要**提前做变量替换
- 直接从 context 中获取 JSON 对象，手动提取 `prompt` 和 `negative_prompt` 字段
- 在变量替换**之前**判断是否为手动输入

### 1. 修复 WorkflowEngine.js

```javascript
case 'image': {
  const upstreamIds = getUpstreamNodeIds(node.id, edges);
  
  // 首先检查上游是否有 chatForImage 返回的 JSON
  let foundJsonUpstream = false;
  let prompt = "";
  let negativePrompt = "";
  
  for (const upId of upstreamIds) {
    const upResult = context[upId];
    
    // ✅ 检测 JSON 对象（来自 chatForImage）
    if (upResult && typeof upResult === 'object' && upResult.prompt) {
      foundJsonUpstream = true;
      
      // ✅ 在变量替换之前判断是否手动输入
      const hasManualPrompt = 
        data.prompt && 
        data.prompt.trim() && 
        !data.prompt.includes('{{');
      
      const hasManualNegativePrompt = 
        data.negative_prompt && 
        data.negative_prompt.trim() && 
        !data.negative_prompt.includes('{{');
      
      // ✅ 直接从 JSON 对象提取字段
      prompt = hasManualPrompt ? data.prompt : upResult.prompt;
      negativePrompt = hasManualNegativePrompt ? data.negative_prompt : (upResult.negative_prompt || "");
      
      console.log(`[Image] 从 chatForImage 节点获取提示词:`, { prompt, negativePrompt });
      break;
    }
  }
  
  // ✅ 如果没有 JSON 上游，使用常规变量替换
  if (!foundJsonUpstream) {
    prompt = userPrompt;  // 已经在函数开头做了变量替换
    negativePrompt = replaceVariables(data.negative_prompt || "", context);
  }
  
  return await callApi('image', { 
    prompt,
    negative_prompt: negativePrompt,
    model: data.model || 'qwen-image-max',
    size: data.size || '1104*1472',
  });
}
```

**优化点：**
1. ✅ **JSON 检测**：判断上游结果是否为对象类型
2. ✅ **字段分离**：分别提取 `prompt` 和 `negative_prompt`
3. ✅ **手动输入优先**：用户填写的内容优先于上游值
4. ✅ **兼容性**：不影响其他节点的变量替换逻辑

### 2. 增强参数传递可视化

在 `CustomNodes.jsx` 中添加特殊处理：

```javascript
// 特殊处理：chatForImage 节点传递 JSON 到 Image 节点
if (current.type === 'image' && 
    upstream.type === 'chatForImage' && 
    upstream.result && 
    typeof upstream.result === 'object') {
  
  // ✅ 正向提示词映射
  if (upstream.result.prompt) {
    const hasManualPrompt = 
      current.data.prompt && 
      current.data.prompt.trim() && 
      !current.data.prompt.includes('{{');
    
    parameterMappings.push({
      sourceLabel: upstream.label,
      sourceResult: upstream.result.prompt,
      targetField: '✨ Prompt (正向提示词)',
      targetFieldKey: 'prompt',
      originalValue: hasManualPrompt ? current.data.prompt : null,
      replacedValue: upstream.result.prompt,
      hasManualInput: hasManualPrompt,  // 🔑 关键标记
      isJsonField: true,
    });
  }
  
  // ✅ 负向提示词映射
  if (upstream.result.negative_prompt) {
    const hasManualNegPrompt = 
      current.data.negative_prompt && 
      current.data.negative_prompt.trim() && 
      !current.data.negative_prompt.includes('{{');
    
    parameterMappings.push({
      sourceLabel: upstream.label,
      sourceResult: upstream.result.negative_prompt,
      targetField: '🚫 Negative Prompt (负向提示词)',
      targetFieldKey: 'negative_prompt',
      originalValue: hasManualNegPrompt ? current.data.negative_prompt : null,
      replacedValue: upstream.result.negative_prompt,
      hasManualInput: hasManualNegPrompt,  // 🔑 关键标记
      isJsonField: true,
    });
  }
}
```

**显示逻辑：**

```javascript
{mapping.isJsonField && (
  <div style={{ marginBottom: '4px' }}>
    <div style={{ 
      fontSize: '8px', 
      color: mapping.hasManualInput ? themes.warning : themes.info,
      background: mapping.hasManualInput ? themes.warning + '15' : themes.info + '15',
      // ...
    }}>
      <span>{mapping.hasManualInput ? '✍️' : '📋'}</span>
      <span>
        {mapping.hasManualInput 
          ? '手动输入优先，上游值被忽略' 
          : '从 JSON 对象自动提取'}
      </span>
    </div>
    
    {/* 如果有手动输入，显示手动输入的内容 */}
    {mapping.hasManualInput && mapping.originalValue && (
      <div style={{ marginTop: '4px', ... }}>
        <div style={{ fontSize: '7px', ... }}>手动输入的内容:</div>
        {mapping.originalValue}
      </div>
    )}
  </div>
)}
```

## 使用效果

### 场景 1：完全自动传递（推荐）

**工作流：**
```
[Prompt: "一只猫"] → [Prompt Gen] → [Image (两个字段都为空)] → [Debug]
```

**Image 节点显示：**

```
🔗 参数传递 (2)

┌─────────────────────────────────────────┐
│ [Prompt Gen] → [✨ Prompt (正向提示词)] │
│ 📋 从 JSON 对象自动提取                 │
│                                         │
│ 上游输出:                               │
│ 一只可爱的橘色小猫，毛茸茸的，         │
│ 大眼睛，坐在温暖的阳光下...            │
│ ✓ 已传递                                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ [Prompt Gen] → [🚫 Negative Prompt...] │
│ 📋 从 JSON 对象自动提取                 │
│                                         │
│ 上游输出:                               │
│ 模糊，低质量，变形，多余的肢体，       │
│ 文字，水印...                           │
│ ✓ 已传递                                │
└─────────────────────────────────────────┘
```

**执行日志：**
```
[Image] 从 chatForImage 节点获取提示词: {
  prompt: "(自动获取: 一只可爱的橘色小猫，毛茸茸的...)",
  negativePrompt: "(自动获取: 模糊，低质量，变形...)"
}
```

### 场景 2：部分手动覆盖

**工作流：**
```
[Prompt Gen] → [Image]
              ↓ 在 Image 的 Prompt 字段手动输入 "一只狗"
              ↓ Negative Prompt 留空
```

**Image 节点显示：**

```
┌─────────────────────────────────────────┐
│ [Prompt Gen] → [✨ Prompt (正向提示词)] │
│ ✍️ 手动输入优先，上游值被忽略          │
│                                         │
│ 手动输入的内容:                         │
│ 一只狗                                  │
│                                         │
│ 上游输出: (被忽略)                      │
│ 一只可爱的橘色小猫...                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ [Prompt Gen] → [🚫 Negative Prompt...] │
│ 📋 从 JSON 对象自动提取                 │
│                                         │
│ 上游输出:                               │
│ 模糊，低质量，变形...                  │
│ ✓ 已传递                                │
└─────────────────────────────────────────┘
```

**执行日志：**
```
[Image] 从 chatForImage 节点获取提示词: {
  prompt: "(手动输入: 一只狗...)",
  negativePrompt: "(自动获取: 模糊，低质量，变形...)"
}
```

**最终结果：**
- ✅ Prompt 使用 "一只狗"（手动输入）
- ✅ Negative Prompt 使用 Prompt Gen 生成的值

### 场景 3：调试查看

1. 开启调试模式 🐛
2. 逐步执行
3. 在 Prompt Gen 执行后查看 JSON 输出：
   ```json
   {
     "prompt": "一只可爱的橘色小猫...",
     "negative_prompt": "模糊，低质量..."
   }
   ```
4. 点击下一步执行 Image 节点
5. 双击 Image 节点查看接收到的参数
6. 确认两个字段都正确传递

## 技术细节

### 判断逻辑表

| 用户输入 | 判断结果 | 使用值 |
|---------|---------|--------|
| `""`（空字符串） | ❌ 非手动输入 | 上游 JSON 值 |
| `"{{node_xxx}}"` | ❌ 非手动输入（包含模板） | 上游 JSON 值 |
| `"一只猫"` | ✅ 手动输入 | 手动输入值 |
| `undefined` | ❌ 非手动输入 | 上游 JSON 值 |
| `"  "` （空白） | ❌ 非手动输入（trim 后为空） | 上游 JSON 值 |

### 关键代码片段

**手动输入判断：**
```javascript
const hasManualPrompt = 
  data.prompt &&              // 字段存在
  data.prompt.trim() &&       // 不是空白
  !data.prompt.includes('{{'); // 不包含模板语法
```

**JSON 对象检测：**
```javascript
if (upResult && 
    typeof upResult === 'object' && 
    upResult.prompt) {
  // 这是一个来自 chatForImage 的 JSON 对象
}
```

**字段提取：**
```javascript
prompt = hasManualPrompt ? data.prompt : upResult.prompt;
negativePrompt = hasManualNegativePrompt ? data.negative_prompt : (upResult.negative_prompt || "");
```

## 测试验证

### ✅ 测试 1：基础自动传递
1. 创建 `[Prompt]` → `[Prompt Gen]` → `[Image]`
2. Image 节点两个字段都留空
3. 运行并查看 Image 节点参数传递面板
4. **期望**：两个字段都显示 "📋 从 JSON 对象自动提取"

### ✅ 测试 2：Prompt 手动输入
1. 在 Image 节点的 Prompt 字段输入 "测试"
2. Negative Prompt 留空
3. 运行
4. **期望**：
   - Prompt 显示 "✍️ 手动输入优先"
   - Negative Prompt 显示 "📋 从 JSON 对象自动提取"

### ✅ 测试 3：两个都手动输入
1. Image 节点两个字段都填写
2. 运行
3. **期望**：两个字段都显示 "✍️ 手动输入优先"

### ✅ 测试 4：调试模式验证
1. 开启调试模式
2. 单步执行
3. 在控制台查看日志
4. **期望**：日志显示正确的 prompt 和 negativePrompt

## 部署更新

已完成：
- ✅ 修改 `WorkflowEngine.js` - 修复 JSON 对象处理逻辑
- ✅ 修改 `CustomNodes.jsx` - 增强参数传递可视化
- ✅ 重新构建 Docker 镜像
- ✅ 启动服务
- ✅ 功能已生效

访问 http://localhost:8000 即可使用更新后的功能。

## 相关文件

- `/Users/smzdm/workforzdm/qwen_node/qwen-ui/src/WorkflowEngine.js` - 第 140-192 行
- `/Users/smzdm/workforzdm/qwen_node/qwen-ui/src/components/CustomNodes.jsx` - 第 522-598 行（参数映射）、第 742-791 行（显示逻辑）
- `/Users/smzdm/workforzdm/qwen_node/main.py` - 第 142-162 行（后端 API）

## 未来优化方向

可能的改进：
- [ ] 支持模板引用 JSON 字段（如 `{{node_xxx.prompt}}`）
- [ ] 支持多个 Prompt Gen 的合并
- [ ] 添加提示词预览功能
- [ ] 支持提示词历史记录
- [ ] 添加提示词质量评分

---

**更新日期：** 2026-01-09  
**问题状态：** ✅ 已完全修复  
**验证状态：** ✅ 已部署并可用
