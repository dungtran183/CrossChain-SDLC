"""Event bus tối thiểu: các module publish sự kiện, WebSocket /ws đẩy lên UI.

Phase P1 sẽ nối ChainSim (block/tx/log) vào bus.
"""
from __future__ import annotations

import asyncio
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect


class EventBus:
    def __init__(self) -> None:
        self._subscribers: set[asyncio.Queue] = set()

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=1000)
        self._subscribers.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        self._subscribers.discard(q)

    def publish(self, event_type: str, data: Any, *, source: str = "core") -> None:
        event = {"type": event_type, "source": source, "data": data}
        for q in list(self._subscribers):
            if not q.full():
                q.put_nowait(event)


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
