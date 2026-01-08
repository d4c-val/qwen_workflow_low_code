# 视频生成 API 使用说明

## 📹 视频生成接口优化

已完成对视频生成接口的全面优化，支持异步任务轮询和状态查询。

## 🎯 核心功能

### 1. 视频生成接口

**POST** `/api/video`

#### 请求参数

```json
{
  "prompt": "视频描述文本",
  "image_url": "起始图片URL",
  "audio_url": "音频URL（可选）",
  "resolution": "1280*720",  // 可选：分辨率
  "prompt_extend": true,      // 可选：是否扩展提示词
  "duration": 5,              // 可选：时长（秒）
  "shot_type": "default",     // 可选：镜头类型
  "wait_for_completion": false // 可选：是否等待完成
}
```

#### 响应格式

**模式 A: 立即返回（wait_for_completion=false，默认）**

```json
{
  "result": {
    "task_id": "0385dc79-5ff8-4d82-bcb6-xxxxxx",
    "task_status": "PENDING",
    "message": "视频生成任务已提交，请使用 task_id 查询生成结果"
  }
}
```

**模式 B: 等待完成（wait_for_completion=true）**

成功时：
```json
{
  "result": "https://dashscope.oss-cn-beijing.aliyuncs.com/xxx.mp4"
}
```

超时时：
```json
{
  "result": {
    "task_id": "0385dc79-5ff8-4d82-bcb6-xxxxxx",
    "task_status": "RUNNING",
    "message": "任务仍在处理中，请使用 task_id 查询状态",
    "error": "任务超时（600秒）"
  }
}
```

### 2. 任务状态查询接口

**GET** `/api/video/task/{task_id}`

#### 响应格式

**排队中/处理中：**
```json
{
  "task_id": "0385dc79-5ff8-4d82-bcb6-xxxxxx",
  "task_status": "PENDING"  // 或 "RUNNING"
}
```

**成功：**
```json
{
  "task_id": "0385dc79-5ff8-4d82-bcb6-xxxxxx",
  "task_status": "SUCCEEDED",
  "result": "https://dashscope.oss-cn-beijing.aliyuncs.com/xxx.mp4",
  "video_url": "https://dashscope.oss-cn-beijing.aliyuncs.com/xxx.mp4"
}
```

**失败：**
```json
{
  "task_id": "0385dc79-5ff8-4d82-bcb6-xxxxxx",
  "task_status": "FAILED",
  "error": "任务失败原因"
}
```

## 📋 任务状态说明

| 状态 | 说明 |
|------|------|
| `PENDING` | 任务排队中 |
| `RUNNING` | 任务处理中 |
| `SUCCEEDED` | 任务执行成功 |
| `FAILED` | 任务执行失败 |
| `CANCELED` | 任务已取消 |
| `UNKNOWN` | 任务不存在或状态未知 |

## 💡 使用示例

### 方式一：立即返回 + 前端轮询（推荐）

**1. 提交视频生成任务**

```bash
curl -X POST http://localhost:8000/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只猫在草地上奔跑",
    "image_url": "https://example.com/cat.jpg",
    "wait_for_completion": false
  }'
```

响应：
```json
{
  "result": {
    "task_id": "abc123",
    "task_status": "PENDING",
    "message": "视频生成任务已提交"
  }
}
```

**2. 前端轮询查询状态（每10秒查询一次）**

```javascript
async function pollVideoTask(taskId) {
  const maxAttempts = 60; // 最多查询10分钟
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const response = await fetch(`/api/video/task/${taskId}`);
    const data = await response.json();
    
    console.log(`状态: ${data.task_status}`);
    
    if (data.task_status === 'SUCCEEDED') {
      console.log('视频生成成功:', data.video_url);
      return data.video_url;
    } else if (data.task_status === 'FAILED') {
      throw new Error('视频生成失败: ' + data.error);
    } else if (data.task_status === 'CANCELED') {
      throw new Error('任务已取消');
    }
    
    // PENDING 或 RUNNING，等待10秒后继续
    await new Promise(resolve => setTimeout(resolve, 10000));
    attempts++;
  }
  
  throw new Error('查询超时');
}

// 使用
const taskId = 'abc123';
pollVideoTask(taskId).then(url => {
  console.log('视频URL:', url);
}).catch(error => {
  console.error('错误:', error);
});
```

### 方式二：后端等待完成（适合小视频）

```bash
curl -X POST http://localhost:8000/api/video \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只猫在草地上奔跑",
    "image_url": "https://example.com/cat.jpg",
    "wait_for_completion": true
  }'
```

响应（等待最多10分钟）：
```json
{
  "result": "https://dashscope.oss-cn-beijing.aliyuncs.com/xxx.mp4"
}
```

### 方式三：直接查询任务状态

```bash
curl -X GET http://localhost:8000/api/video/task/abc123
```

## 🔄 轮询机制

### 后端轮询（wait_for_completion=true）
- 每 **10 秒**查询一次状态
- 最多等待 **600 秒**（10分钟）
- 超时后返回 task_id，前端可继续查询

### 前端轮询（推荐）
- 前端控制轮询间隔和超时时间
- 更灵活，不占用后端连接
- 可以显示实时进度

## 🎨 前端集成建议

### React 示例

```jsx
import { useState } from 'react';

function VideoGenerator() {
  const [status, setStatus] = useState('idle');
  const [videoUrl, setVideoUrl] = useState('');
  const [progress, setProgress] = useState('');

  const generateVideo = async () => {
    setStatus('submitting');
    
    // 1. 提交任务
    const response = await fetch('/api/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: '一只猫在草地上奔跑',
        image_url: 'https://example.com/cat.jpg',
        wait_for_completion: false
      })
    });
    
    const data = await response.json();
    const taskId = data.result.task_id;
    
    setStatus('processing');
    setProgress('任务已提交，开始生成...');
    
    // 2. 轮询查询状态
    const pollInterval = setInterval(async () => {
      const statusResponse = await fetch(`/api/video/task/${taskId}`);
      const statusData = await statusResponse.json();
      
      if (statusData.task_status === 'SUCCEEDED') {
        clearInterval(pollInterval);
        setStatus('completed');
        setVideoUrl(statusData.video_url);
        setProgress('视频生成成功！');
      } else if (statusData.task_status === 'FAILED') {
        clearInterval(pollInterval);
        setStatus('error');
        setProgress('生成失败: ' + statusData.error);
      } else {
        setProgress(`正在生成中... (${statusData.task_status})`);
      }
    }, 10000); // 每10秒查询一次
  };

  return (
    <div>
      <button onClick={generateVideo} disabled={status === 'processing'}>
        生成视频
      </button>
      <p>{progress}</p>
      {videoUrl && <video src={videoUrl} controls />}
    </div>
  );
}
```

## ⚙️ 参数说明

### resolution（分辨率）
- `"1280*720"` (默认)
- `"960*544"`
- 其他支持的分辨率

### shot_type（镜头类型）
- `"default"` (默认)
- 其他支持的镜头类型

### duration（时长）
- 默认：5 秒
- 范围：根据模型支持

## 🔧 配置建议

- **短视频（<30秒）**: `wait_for_completion=true`
- **长视频**: `wait_for_completion=false` + 前端轮询
- **批量生成**: 使用立即返回模式，并发提交任务

## 📊 性能优化

1. **前端轮询**: 不占用后端长连接
2. **合理间隔**: 10秒查询一次，避免过度请求
3. **超时处理**: 设置合理的最大等待时间
4. **错误重试**: 网络失败时可重试查询

## 🎯 总结

- ✅ 支持两种模式：立即返回 / 等待完成
- ✅ 自动轮询任务状态（每10秒）
- ✅ 完整的状态反馈（PENDING/RUNNING/SUCCEEDED/FAILED）
- ✅ 独立的任务查询接口
- ✅ 超时保护（最多等待10分钟）
- ✅ 向后兼容原有接口
