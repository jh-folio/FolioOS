#!/bin/bash
cd "$(dirname "$0")"

# app.py와 같은 기본값. 여기서만 8787을 박아두면 PORT를 바꿨을 때 안내가 어긋난다.
PORT="${PORT:-8787}"
# localhost가 아니라 127.0.0.1이다. 서버는 IPv4만 열고, 일부 환경에서 localhost는
# IPv6를 먼저 시도해 요청마다 기다린다.
URL="http://127.0.0.1:${PORT}"

echo ""
echo "Folio OS starting..."
echo "Address: ${URL}"
echo "Closing this window stops Folio OS."
echo ""

if [ -f ".venv/bin/python3" ]; then
    PYTHON=".venv/bin/python3"
elif command -v python3 &>/dev/null; then
    PYTHON="python3"
else
    echo "Error: python3 not found. Please install Python 3 first."
    echo "  macOS: brew install python"
    exit 1
fi

open_browser() {
  if command -v open &>/dev/null; then open "$1"
  elif command -v xdg-open &>/dev/null; then xdg-open "$1" >/dev/null 2>&1
  fi
}

# 서버가 실제로 응답하기 시작하면 브라우저를 연다. 바로 열면 연결 거부 화면이 먼저 뜬다.
# 백그라운드라 아래 서버 실행을 막지 않는다. 앱 안의 `서버 재시작`(종료 코드 3)으로
# 다시 돌 때는 열지 않는다 — 이미 열려 있는 탭 옆에 새 탭이 계속 쌓인다.
(
  for _ in $(seq 1 120); do
    if (exec 3<>"/dev/tcp/127.0.0.1/${PORT}") 2>/dev/null; then
      exec 3<&- 2>/dev/null
      exec 3>&- 2>/dev/null
      open_browser "$URL"
      exit 0
    fi
    sleep 0.5
  done
) &
OPENER_PID=$!

# Exit code 3 = restart signal from the in-app restart button.
while true; do
  "$PYTHON" app.py
  [ $? -eq 3 ] || break
  echo ""
  echo "Restarting..."
  echo ""
done

kill "$OPENER_PID" 2>/dev/null
