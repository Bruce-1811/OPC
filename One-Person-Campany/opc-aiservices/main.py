import os
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="OPC AI Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
BASE_URL = os.getenv(
    "OPENAI_BASE_URL",
    "https://ws-6juch5algsm3eel1.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
).strip()
MODEL_NAME = os.getenv("OPENAI_MODEL", "qwen-turbo").strip()

client = AsyncOpenAI(api_key=API_KEY or "missing-key", base_url=BASE_URL)


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    stream: bool = False


SYSTEM_PROMPT = {
    "role": "system",
    "content": (
        "你是 OPC 项目的专属智能助手，名字叫'培风'。"
        "你的语气要专业、友善。你的主要职责是帮助大学生用户拆解项目需求、"
        "生成开发计划，并解答与团队协作相关的问题。"
    ),
}


def build_messages(user_messages: List[Message]):
    return [SYSTEM_PROMPT] + [
        {"role": m.role, "content": m.content} for m in user_messages
    ]


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "hasApiKey": bool(API_KEY),
    }


@app.post("/api/ai/chat")
async def ai_chat(request: ChatRequest):
    if not API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY 未配置，请在 opc-aiservices/.env 中设置",
        )
    if not request.messages:
        raise HTTPException(status_code=400, detail="messages 不能为空")

    full_messages = build_messages(request.messages)

    # 非流式：给 Express 网关用，一次返回完整 reply
    if not request.stream:
        try:
            response = await client.chat.completions.create(
                model=MODEL_NAME,
                messages=full_messages,
                stream=False,
            )
            reply = (response.choices[0].message.content or "").strip()
            return {"reply": reply}
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"调用大模型失败: {e}") from e

    # 流式：保留给以后前端直连
    async def stream_generator():
        try:
            response = await client.chat.completions.create(
                model=MODEL_NAME,
                messages=full_messages,
                stream=True,
            )
            async for chunk in response:
                content = chunk.choices[0].delta.content
                if content:
                    yield f"data: {content}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: 内部错误: {str(e)}\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")


# 启动: uvicorn main:app --reload --host 127.0.0.1 --port 8000
