import asyncio
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
from openai import AsyncOpenAI

app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# 允许跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 开发阶段允许所有前端地址访问
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. 初始化 AI 客户端
# 注意：这里以 DeepSeek 为例，您可以无缝替换为智谱、百川或通义千问的 Base URL 和 API Key
client = AsyncOpenAI(
    api_key="sk-ws-H.ELYMRID.Urej.MEYCIQCqBHlx6P6aalArAYBVyf0UgHJFIM-zVNiJnCzxBQ9UmwIhAOqUhmYruxqELxs5u4cH4Z5EYQ5TzNjIEOA4ugo1OHgy",
    base_url="https://ws-6juch5algsm3eel1.cn-beijing.maas.aliyuncs.com/compatible-mode/v1" # 替换为您选择的服务商 URL
)

# 2. 定义请求体的数据校验模型
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    stream: bool = True

# 3. 设定“问培风”的系统预设 (System Prompt)
SYSTEM_PROMPT = {
    "role": "system",
    "content": (
        "你是 OPC 项目的专属智能助手，名字叫'培风'。"
        "你的语气要专业、友善。你的主要职责是帮助大学生用户拆解项目需求、"
        "生成开发计划，并解答与团队协作相关的问题。"
    )
}

# 4. 构建核心聊天接口
@app.post("/api/ai/chat")
async def ai_chat(request: ChatRequest):
    
    # 将系统提示词置于对话的最前端，加上前端传来的历史聊天记录
    full_messages = [SYSTEM_PROMPT] + [{"role": m.role, "content": m.content} for m in request.messages]

    # 定义一个异步生成器，用于逐字读取大模型的结果并推给前端
    async def stream_generator():
        try:
            response = await client.chat.completions.create(
                model="qwen-turbo", # 替换为您实际调用的模型名称
                messages=full_messages,
                stream=True,
            )
            
            async for chunk in response:
                # 提取每一个文字片段
                content = chunk.choices[0].delta.content
                if content:
                    # 严格遵循 SSE (Server-Sent Events) 的数据格式要求
                    yield f"data: {content}\n\n"
                    
            # 传输结束标志
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            yield f"data: 内部错误: {str(e)}\n\n"

    # 如果前端请求流式输出，则返回 StreamingResponse
    if request.stream:
        return StreamingResponse(stream_generator(), media_type="text/event-stream")
    else:
        return {"error": "当前接口仅支持流式(Stream)请求"}
# 启动命令: uvicorn main:app --reload
