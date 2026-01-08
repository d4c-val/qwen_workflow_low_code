import os
import httpx
import asyncio
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import json
# === 初始化 ===
load_dotenv()
app = FastAPI(
    title="QwenFlow API",
    description="基于通义千问的可视化 AI 工作流编排平台",
    version="1.0.0"
)
api_key = os.getenv("DASHSCOPE_API_KEY")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"Validation Error for {request.url}: {exc.errors()}")
    return JSONResponse(status_code=422, content={"detail": exc.errors(), "body": exc.body})

# === 请求模型 ===
class ChatRequest(BaseModel):
    model: str = "qwen-plus"
    system_prompt: Optional[str] = ""
    prompt: str
    temperature: float = 0.7

class ChatForImageRequest(BaseModel):
    model: str = "qwen-plus"
    system_prompt: Optional[str] = ""
    prompt: str
    temperature: float = 0.7

class PromptRequest(BaseModel):
    prompt: str

class ImageRequest(BaseModel):
    prompt: str
    model: str = "qwen-image-max" # qwen-image-max, qwen-image-plus
    size: Optional[str] = "1104*1472" # 1664*928（默认值）：16:9。1472*1104：4:3 。1328*1328：1:1。1104*1472：3:4。928*1664：9:16
    negative_prompt: Optional[str] = ""

class VisionRequest(BaseModel):
    image_url: str
    prompt: str

class ImageEditRequest(BaseModel):
    images: list[str]
    prompt: str
    negative_prompt: Optional[str] = ""

class OneVideoRequest(BaseModel):
    prompt: str
    image_url: str
    audio_url: Optional[str] = None
    resolution: Optional[str] = "1080P"  #720P、1080P
    prompt_extend: Optional[bool] = False # True, False
    duration: Optional[int] = 5 # 5, 10, 15
    shot_type: Optional[str] = "single" # single, multi
    wait_for_completion: Optional[bool] = False  # 是否等待视频生成完成


# === 通用错误处理 ===
async def handle_dashscope_request(url: str, payload: dict, timeout: int = 60) -> dict:
    """统一处理 DashScope API 请求"""
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, headers=headers, json=payload, timeout=timeout)
            
            if resp.status_code != 200:
                try:
                    data = resp.json()
                    detail = data.get('message') or data.get('error', {}).get('message', str(data))
                    code = data.get('code', 'Error')
                    raise HTTPException(status_code=resp.status_code, detail=f"{code}: {detail}")
                except (ValueError, KeyError):
                    raise HTTPException(status_code=resp.status_code, detail=resp.text)
            
            return resp.json()
    except HTTPException:
        raise
    except Exception as e:
        print(f"API Error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# === API 端点 ===
@app.post("/api/prompt")
async def api_prompt(req: PromptRequest):
    """文本输入节点 - 直接返回"""
    return {"result": req.prompt}

@app.post("/api/chat")
async def api_chat(req: ChatRequest):
    """文本生成"""
    messages = []
    if req.system_prompt:
        messages.append({"role": "system", "content": req.system_prompt})
    messages.append({"role": "user", "content": req.prompt})

    data = await handle_dashscope_request(
        "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        {"model": req.model, "messages": messages, "temperature": req.temperature}
    )
    return {"result": data.get("choices", [{}])[0].get("message", {}).get("content", "文本生成失败")}

@app.post("/api/chat_for_image")
async def api_chat_for_image(req: ChatForImageRequest):
    """文本生成"""
    messages = []
    if req.system_prompt:
        messages.append({"role": "system", "content": f"你是一个图片生成助手，你会根据用户的输入输出正面提示词和负面提示词，以json格式返回{{'prompt': '正面提示词', 'negative_prompt': '负面提示词'}}，对你的要求如下：" + req.system_prompt})
    messages.append({"role": "user", "content": req.prompt})

    data = await handle_dashscope_request(
        "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        {"model": req.model, "messages": messages, "temperature": req.temperature,"response_format":{"type": "json_object"}}
    )
    return {"result": json.loads(data.get("choices", [{}])[0].get("message", {}).get("content", "{}"))}

@app.post("/api/image")
async def api_image(req: ImageRequest):
    """图像生成"""
    data = await handle_dashscope_request(
        "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
        {
            "model": req.model,
            "input": {"messages": [{"role": "user", "content": [{"text": req.prompt}]}]},
            "parameters": {"size": req.size, "negative_prompt": req.negative_prompt}
        },
        timeout=120
    )
    
    choices = data.get('output', {}).get('choices', [])
    if choices:
        content = choices[0].get('message', {}).get('content', [])
        for item in content:
            if 'image' in item:
                return {"result": item['image']}
    
    raise HTTPException(status_code=500, detail=f"未获取到图片URL，API响应: {str(data)}")

@app.post("/api/image-edit")
async def api_image_edit(req: ImageEditRequest):
    """图像编辑"""
    content = [{"image": img.strip()} for img in req.images if img.strip()]
    content.append({"text": req.prompt})

    data = await handle_dashscope_request(
        "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
        {
            "model": "qwen-image-edit-plus",
            "input": {"messages": [{"role": "user", "content": content}]},
            "parameters": {
                "n": 1,
                "negative_prompt": req.negative_prompt or "",
                "prompt_extend": True,
                "watermark": False
            }
        },
        timeout=120
    )
    
    choices = data.get('output', {}).get('choices', [])
    if choices:
        msg_content = choices[0].get('message', {}).get('content', [])
        for item in msg_content:
            if 'image' in item:
                return {"result": item['image']}
    
    raise HTTPException(status_code=500, detail=f"未获取到编辑后的图片，API响应: {str(data)}")

@app.post("/api/vision")
async def api_vision(req: VisionRequest):
    """视觉理解"""
    data = await handle_dashscope_request(
        "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        {
            "model": "qwen-vl-plus",
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": req.image_url}},
                    {"type": "text", "text": req.prompt}
                ]
            }]
        }
    )
    return {"result": data.get("choices", [{}])[0].get("message", {}).get("content", "未能识别图片")}

# === 视频生成相关函数 ===
async def get_video_task_status(task_id: str) -> dict:
    """查询视频生成任务状态"""
    headers = {"Authorization": f"Bearer {api_key}"}
    url = f"https://dashscope.aliyuncs.com/api/v1/tasks/{task_id}"
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers, timeout=30)
            
            if resp.status_code != 200:
                return {
                    "task_status": "UNKNOWN",
                    "error": f"HTTP {resp.status_code}: {resp.text}"
                }
            
            return resp.json()
    except Exception as e:
        return {
            "task_status": "UNKNOWN",
            "error": str(e)
        }

async def poll_video_task(task_id: str, max_wait_time: int = 600, poll_interval: int = 10) -> dict:
    """
    轮询视频生成任务直到完成
    
    Args:
        task_id: 任务ID
        max_wait_time: 最大等待时间（秒），默认600秒
        poll_interval: 轮询间隔（秒），默认10秒
    
    Returns:
        任务结果字典
    """
    elapsed_time = 0
    
    while elapsed_time < max_wait_time:
        # 查询任务状态
        result = await get_video_task_status(task_id)
        task_status = result.get("output", {}).get("task_status", "UNKNOWN")
        
        print(f"[Video Task {task_id}] Status: {task_status}, Elapsed: {elapsed_time}s")
        
        # 检查任务状态
        if task_status == "SUCCEEDED":
            # 成功，返回视频URL
            video_url = result.get("output", {}).get("video_url")
            if video_url:
                return {
                    "status": "success",
                    "video_url": video_url,
                    "task_id": task_id,
                    "elapsed_time": elapsed_time
                }
            else:
                return {
                    "status": "error",
                    "error": "任务成功但未获取到视频URL",
                    "task_id": task_id
                }
        
        elif task_status == "FAILED":
            return {
                "status": "error",
                "error": f"任务失败: {result.get('output', {}).get('message', '未知错误')}",
                "task_id": task_id
            }
        
        elif task_status == "CANCELED":
            return {
                "status": "error",
                "error": "任务已被取消",
                "task_id": task_id
            }
        
        elif task_status == "UNKNOWN":
            return {
                "status": "error",
                "error": result.get("error", "任务状态未知"),
                "task_id": task_id
            }
        
        # PENDING 或 RUNNING 状态，等待后继续轮询
        await asyncio.sleep(poll_interval)
        elapsed_time += poll_interval
    
    # 超时
    return {
        "status": "timeout",
        "error": f"任务超时（{max_wait_time}秒）",
        "task_id": task_id,
        "message": "任务仍在处理中，请使用 task_id 查询状态"
    }

@app.post("/api/video")
async def api_one_video(req: OneVideoRequest):
    """
    视频生成接口
    
    - wait_for_completion=False (默认): 立即返回 task_id，前端轮询查询状态
    - wait_for_completion=True: 等待视频生成完成后返回视频URL（最多等待10分钟）
    """
    # 提交视频生成任务
    data = await handle_dashscope_request(
        "https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis",
        {
            "model": "wan2.6-i2v",
            "input": {
                "prompt": req.prompt,
                "img_url": req.image_url,
                "audio_url": req.audio_url
            },
            "parameters": {
                "resolution": req.resolution,
                "prompt_extend": req.prompt_extend,
                "duration": req.duration,
                "shot_type": req.shot_type
            }
        },
        timeout=60
    )
    
    # 获取任务ID和状态
    output = data.get("output", {})
    task_id = output.get("task_id")
    task_status = output.get("task_status", "UNKNOWN")
    
    if not task_id:
        raise HTTPException(status_code=500, detail="未获取到任务ID，API响应: " + str(data))
    
    # 如果不等待完成，直接返回 task_id
    if not req.wait_for_completion:
        return {
            "result": {
                "task_id": task_id,
                "task_status": task_status,
                "message": "视频生成任务已提交，请使用 task_id 查询生成结果"
            }
        }
    
    # 等待视频生成完成
    print(f"[Video] Waiting for task {task_id} to complete...")
    poll_result = await poll_video_task(task_id, max_wait_time=600, poll_interval=10)
    
    if poll_result["status"] == "success":
        return {"result": poll_result["video_url"]}
    elif poll_result["status"] == "timeout":
        # 超时但任务可能还在进行
        return {
            "result": {
                "task_id": task_id,
                "task_status": "RUNNING",
                "message": poll_result["message"],
                "error": poll_result["error"]
            }
        }
    else:
        # 失败
        raise HTTPException(
            status_code=500,
            detail=f"视频生成失败: {poll_result.get('error', '未知错误')}"
        )

@app.get("/api/video/task/{task_id}")
async def api_video_task_status(task_id: str):
    """
    查询视频生成任务状态
    
    返回格式:
    - PENDING: 任务排队中
    - RUNNING: 任务处理中
    - SUCCEEDED: 任务成功（包含 video_url）
    - FAILED: 任务失败
    - CANCELED: 任务已取消
    - UNKNOWN: 任务不存在或状态未知
    """
    result = await get_video_task_status(task_id)
    
    output = result.get("output", {})
    task_status = output.get("task_status", "UNKNOWN")
    
    response = {
        "task_id": task_id,
        "task_status": task_status
    }
    
    # 如果成功，包含视频URL
    if task_status == "SUCCEEDED":
        video_url = output.get("video_url")
        if video_url:
            response["result"] = video_url
            response["video_url"] = video_url
        else:
            response["error"] = "任务成功但未获取到视频URL"
    
    # 如果失败，包含错误信息
    elif task_status == "FAILED":
        response["error"] = output.get("message", "任务失败")
    
    elif task_status == "CANCELED":
        response["error"] = "任务已被取消"
    
    elif task_status == "UNKNOWN":
        response["error"] = result.get("error", "任务不存在或状态未知")
    
    return response

# === 静态文件服务 ===
# 生产环境下服务前端静态文件
STATIC_DIR = Path(__file__).parent / "static"
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")
    
    @app.get("/")
    async def serve_index():
        return FileResponse(STATIC_DIR / "index.html")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # API 路由不处理
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not Found")
        
        # 尝试返回静态文件
        file_path = STATIC_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        
        # SPA 回退到 index.html
        return FileResponse(STATIC_DIR / "index.html")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
