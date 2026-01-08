// WorkflowEngine.js - 工作流编排引擎

// 自动检测 API 地址：开发环境使用代理，生产环境使用相对路径
const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

// === 拓扑排序 - 返回分层结构 ===
export const getExecutionLayers = (nodes, edges) => {
  const adjacencyList = new Map();
  const inDegree = new Map();

  nodes.forEach(node => {
    adjacencyList.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  edges.forEach(edge => {
    if (adjacencyList.has(edge.source) && inDegree.has(edge.target)) {
      adjacencyList.get(edge.source).push(edge.target);
      inDegree.set(edge.target, inDegree.get(edge.target) + 1);
    }
  });

  const layers = [];
  let currentLayer = nodes.filter(node => inDegree.get(node.id) === 0).map(n => n.id);
  let processedCount = 0;

  while (currentLayer.length > 0) {
    layers.push([...currentLayer]);
    processedCount += currentLayer.length;

    const nextLayer = [];
    for (const nodeId of currentLayer) {
      (adjacencyList.get(nodeId) || []).forEach(neighbor => {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) nextLayer.push(neighbor);
      });
    }
    currentLayer = nextLayer;
  }

  if (processedCount !== nodes.length) throw new Error("工作流中存在循环依赖，无法执行！");
  return layers;
};

// === 获取上游节点ID ===
const getUpstreamNodeIds = (nodeId, edges) => edges.filter(e => e.target === nodeId).map(e => e.source);

// === 变量替换 ===
const replaceVariables = (text, context) => {
  if (!text) return "";
  return text.replace(/\{\{(.*?)\}\}/g, (match, nodeId) => {
    const val = context[nodeId.trim()];
    return val === undefined ? match : (typeof val === 'object' ? JSON.stringify(val) : val);
  });
};

// === API 调用统一处理 ===
const handleApiResponse = async (res) => {
  if (!res.ok) {
    let errorMsg = await res.text();
    try {
      const json = JSON.parse(errorMsg);
      errorMsg = json.detail || json.message || errorMsg;
    } catch {}
    throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
  }
  return (await res.json()).result;
};

const callApi = async (endpoint, payload) => {
  const res = await fetch(`${API_BASE}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleApiResponse(res);
};

// 视频任务轮询（每10秒查询一次）
const pollVideoTask = async (taskId, maxWaitTime = 600, pollInterval = 10) => {
  let elapsed = 0;
  
  while (elapsed < maxWaitTime) {
    const res = await fetch(`${API_BASE}/video/task/${taskId}`);
    if (!res.ok) throw new Error(`查询视频任务失败: ${res.statusText}`);
    
    const data = await res.json();
    console.log(`[Video Poll] Task ${taskId}: ${data.task_status}, elapsed: ${elapsed}s`);
    
    if (data.task_status === 'SUCCEEDED') {
      return data.video_url || data.result;
    } else if (data.task_status === 'FAILED') {
      throw new Error(data.error || '视频生成失败');
    } else if (data.task_status === 'CANCELED') {
      throw new Error('视频生成任务已取消');
    } else if (data.task_status === 'UNKNOWN') {
      throw new Error(data.error || '任务状态未知');
    }
    
    // PENDING 或 RUNNING，等待后继续
    await new Promise(resolve => setTimeout(resolve, pollInterval * 1000));
    elapsed += pollInterval;
  }
  
  throw new Error(`视频生成超时（${maxWaitTime}秒）`);
};

// === 节点执行 ===
export const executeNode = async (node, context, edges = []) => {
  const { type, data } = node;
  const systemPrompt = replaceVariables(data.system_prompt || "", context);
  const userPrompt = replaceVariables(data.prompt || "", context);

  console.log(`[Engine] Executing ${node.id} (${type})`);

  try {
    switch (type) {
      case 'prompt':
        return userPrompt;

      case 'chat':
        return await callApi('chat', {
          model: data.model || 'qwen-plus',
          system_prompt: systemPrompt,
          prompt: userPrompt,
          temperature: data.temperature || 0.7
        });

      case 'chatForImage':
        // 返回 JSON 格式的正负提示词
        return await callApi('chat_for_image', {
          model: data.model || 'qwen-plus',
          system_prompt: systemPrompt,
          prompt: userPrompt,
          temperature: data.temperature || 0.7
        });

      case 'image': {
        // 检查是否有上游的 chatForImage 节点
        const upstreamIds = getUpstreamNodeIds(node.id, edges);
        let prompt = userPrompt;
        let negativePrompt = replaceVariables(data.negative_prompt || "", context);
        
        // 如果上游节点返回的是 JSON 对象（来自 chatForImage）
        for (const upId of upstreamIds) {
          const upResult = context[upId];
          if (upResult && typeof upResult === 'object' && upResult.prompt) {
            // 使用上游的正负提示词
            if (!prompt.trim() || prompt === '{{' + upId + '}}') {
              prompt = upResult.prompt;
            }
            if (!negativePrompt.trim() && upResult.negative_prompt) {
              negativePrompt = upResult.negative_prompt;
            }
            console.log(`[Image] 使用 chatForImage 节点输出:`, { prompt, negativePrompt });
            break;
          }
        }
        
        return await callApi('image', { 
          prompt,
          model: data.model || 'qwen-image-max',
          size: data.size || '1104*1472',
          negative_prompt: negativePrompt
        });
      }

      case 'imageEdit': {
        const upstreamIds = getUpstreamNodeIds(node.id, edges);
        let images = [];

        // 从手动输入或上游获取图片
        if (data.images?.trim()) {
          images = data.images.split('\n').map(line => replaceVariables(line.trim(), context)).filter(url => url.startsWith('http'));
        } else if (upstreamIds.length > 0) {
          images = upstreamIds.map(id => context[id]).filter(url => url && typeof url === 'string' && url.startsWith('http'));
          console.log(`[ImageEdit] 自动获取上游图片:`, images);
        }

        if (images.length === 0) throw new Error("图像编辑节点需要至少一张图片URL（请连接图片生成节点或手动输入URL）");
        if (!userPrompt.trim()) throw new Error("图像编辑节点需要编辑指令");

        return await callApi('image-edit', { images, prompt: userPrompt, negative_prompt: data.negative_prompt || "" });
      }

      case 'vision': {
        // 解析 "url | prompt" 格式
        const parts = userPrompt.split("|");
        const imageUrl = parts[0]?.trim();
        const prompt = parts.slice(1).join("|").trim() || "Describe this image";
        if (!imageUrl || !imageUrl.startsWith("http")) throw new Error("Vision 节点输入格式错误，请使用: 图片URL | 问题");
        return await callApi('vision', { image_url: imageUrl, prompt });
      }

      case 'video': {
        // 获取图片 URL（从输入或上游节点）
        const upstreamIds = getUpstreamNodeIds(node.id, edges);
        let imageUrl = replaceVariables(data.image_url || "", context);
        
        // 如果没有手动输入，从上游获取
        if (!imageUrl.startsWith('http') && upstreamIds.length > 0) {
          for (const upId of upstreamIds) {
            const upResult = context[upId];
            if (upResult && typeof upResult === 'string' && upResult.startsWith('http')) {
              imageUrl = upResult;
              console.log(`[Video] 自动获取上游图片:`, imageUrl);
              break;
            }
          }
        }
        
        if (!imageUrl || !imageUrl.startsWith('http')) {
          throw new Error("视频节点需要图片URL（请连接图片生成节点或手动输入URL）");
        }
        
        // 提交视频生成任务
        const videoResult = await callApi('video', {
          prompt: userPrompt,
          image_url: imageUrl,
          audio_url: data.audio_url || null,
          resolution: data.resolution || '1080P',
          prompt_extend: data.prompt_extend ?? false,
          duration: data.duration || 5,
          shot_type: data.shot_type || 'single',
          wait_for_completion: false // 使用轮询方式
        });
        
        // 如果返回 task_id，开始轮询
        if (videoResult && typeof videoResult === 'object' && videoResult.task_id) {
          console.log(`[Video] 任务已提交，开始轮询:`, videoResult.task_id);
          return await pollVideoTask(videoResult.task_id);
        }
        
        // 直接返回结果（向后兼容）
        return videoResult;
      }

      case 'filter':
        return new Function('context', `${data.code}`)(context);

      case 'debug': {
        const upstreamIds = getUpstreamNodeIds(node.id, edges);
        return upstreamIds.length > 0 ? (context[upstreamIds[0]] ?? userPrompt) : userPrompt;
      }

      default:
        return userPrompt;
    }
  } catch (err) {
    console.error(`[Engine] Error in ${node.id}:`, err);
    throw new Error(err.message || "Unknown execution error");
  }
};
