"""Event bus tối thiểu: các module/ChainSim publish sự kiện, WebSocket /ws đẩy lên UI.

Sự kiện: {type: "block"|"tx"|"log"|"module", source: "core"|"cd1"|..., data: {...}}.
publish() an toàn khi gọi từ thread (endpoint đồng bộ của FastAPI chạy trong threadpool).
"""
from __future__ import annotations

import asyncio
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect


class EventBus:
    def __init__(self) -> None:
        self._subscribers: dict[asyncio.Queue, asyncio.AbstractEventLoop] = {}

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=1000)
        self._subscribers[q] = asyncio.get_running_loop()
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        self._subscribers.pop(q, None)

    def publish(self, event_type: str, data: Any, *, source: str = "core") -> None:
        event = {"type": event_type, "source": source, "data": data}
        for q, loop in list(self._subscribers.items()):
            if q.full():
                continue
            try:
                loop.call_soon_threadsafe(q.put_nowait, event)
            except RuntimeError:  # loop đã đóng
                self.unsubscribe(q)

    def hook(self, source: str):
        """Callback cho ChainSim(on_event=bus.hook("cd1"))."""
        return lambda kind, data: self.publish(kind, data, source=source)


bus = EventBus()
router = APIRouter()


@router.websocket("/ws")
async def ws_events(ws: WebSocket) -> None:
    await ws.accept()
    q = bus.subscribe()
    try:
        await ws.send_json({"type": "hello", "source": "core", "data": "connected"})
        while True:
            await ws.send_json(await q.get())
    except WebSocketDisconnect:
        pass
    finally:
        bus.unsubscribe(q)
