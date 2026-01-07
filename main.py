import os
import httpx
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

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

class PromptRequest(BaseModel):
    prompt: str

class VisionRequest(BaseModel):
    image_url: str
    prompt: str

class ImageEditRequest(BaseModel):
    images: list[str]
    prompt: str
    negative_prompt: Optional[str] = ""

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

@app.post("/api/image")
async def api_image(req: PromptRequest):
    """图像生成"""
    data = await handle_dashscope_request(
        "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
        {
            "model": "qwen-image-max",
            "input": {"messages": [{"role": "user", "content": [{"text": req.prompt}]}]},
            "parameters": {"size": "1104*1472"}
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
