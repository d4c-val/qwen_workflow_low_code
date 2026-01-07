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

      case 'image':
        return await callApi('image', { prompt: userPrompt });

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
