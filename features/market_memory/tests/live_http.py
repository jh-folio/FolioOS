from __future__ import annotations

import json
import socket
import threading
import urllib.error
import urllib.parse
import urllib.request
from contextlib import AbstractContextManager
from dataclasses import dataclass
from types import TracebackType

import uvicorn
from fastapi import FastAPI
from features.common.jcs import JsonValue


@dataclass(frozen=True, slots=True)
class HttpResponse:
    status_code: int
    payload: dict[str, JsonValue]

    def json(self) -> dict[str, JsonValue]:
        return self.payload


class LiveHttpClient(AbstractContextManager["LiveHttpClient"]):  # noqa: MUTABLE_OK -- owns server lifecycle.
    def __init__(self, app: FastAPI) -> None:
        self._socket = socket.socket()
        self._socket.bind(("127.0.0.1", 0))
        self._socket.listen(128)
        self._port = int(self._socket.getsockname()[1])
        self._server = uvicorn.Server(uvicorn.Config(app, log_level="error", lifespan="off"))
        self._thread = threading.Thread(target=self._server.run, kwargs={"sockets": [self._socket]}, daemon=True)

    def __enter__(self) -> LiveHttpClient:
        self._thread.start()
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_value: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        self._server.should_exit = True
        self._thread.join(timeout=5)
        self._socket.close()

    def request(self, method: str, path: str, payload: dict | None = None, params: dict | None = None) -> HttpResponse:
        query = "?" + urllib.parse.urlencode(params) if params else ""
        data = json.dumps(payload).encode() if payload is not None else None
        request = urllib.request.Request(
            f"http://127.0.0.1:{self._port}{path}{query}",
            data=data,
            headers={"Content-Type": "application/json"},
            method=method,
        )
        try:
            with urllib.request.urlopen(request, timeout=5) as response:
                return HttpResponse(response.status, json.loads(response.read()))
        except urllib.error.HTTPError as error:
            raw = error.read()
            try:
                body = json.loads(raw)
            except json.JSONDecodeError:
                body = {"error": raw.decode("utf-8", errors="replace")}
            return HttpResponse(error.code, body)

    def post(self, path: str, *, json: dict) -> HttpResponse:
        return self.request("POST", path, json)

    def get(self, path: str, *, params: dict | None = None) -> HttpResponse:
        return self.request("GET", path, params=params)
