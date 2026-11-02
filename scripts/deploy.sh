#!/usr/bin/env bash
set -euo pipefail

# 把本地打好的 standalone 产物发布到远端主机。
#
# 目标机只解包、切换 current 软链并重启 systemd；不跑 npm、不跑构建。
# 发布失败时保留 current 指向旧版本，并把旧服务重新拉起来。

APP_DIR=${APP_DIR:-/home/sumwai/docs-site}
SERVICE=${SERVICE:-docs-site}
HEALTH_URL=${HEALTH_URL:-http://127.0.0.1:3100/docs}
HEALTH_PREFIX=${HEALTH_PREFIX:-}
SSH_HOST=${SSH_HOST:?SSH_HOST 必填，例如 aliyun-hongkong}
ARTIFACT=${1:?用法：scripts/deploy.sh <产物 tar.gz>}
RELEASE_ID=${RELEASE_ID:-$(date +%Y%m%d%H%M%S)}
if [[ -z ${HEALTH_PORT:-} ]]; then
  health_authority=${HEALTH_URL#*://}
  health_authority=${health_authority%%/*}
  if [[ $health_authority == *:* ]]; then
    HEALTH_PORT=${health_authority##*:}
  elif [[ $HEALTH_URL == https://* ]]; then
    HEALTH_PORT=443
  else
    HEALTH_PORT=80
  fi
fi

if [[ ! -f "$ARTIFACT" ]]; then
  echo "找不到产物：$ARTIFACT" >&2
  exit 1
fi

REMOTE_TMP="/tmp/docs-site-$RELEASE_ID.tar.gz"
REMOTE_RELEASE="$APP_DIR/releases/$RELEASE_ID"

cleanup() {
  ssh "$SSH_HOST" "rm -f '$REMOTE_TMP'" >/dev/null 2>&1 || true
}
trap cleanup EXIT

scp "$ARTIFACT" "$SSH_HOST:$REMOTE_TMP"

ssh "$SSH_HOST" bash -s -- "$REMOTE_TMP" "$REMOTE_RELEASE" "$APP_DIR" "$SERVICE" "$HEALTH_URL" "$HEALTH_PREFIX" "$HEALTH_PORT" <<'REMOTE'
set -euo pipefail
artifact=$1
release=$2
app_dir=$3
service=$4
health_url=$5
health_prefix=$6
health_port=$7

if [[ -e "$release" ]]; then
  echo "发布目录已存在，拒绝复用：$release" >&2
  exit 1
fi
mkdir -p "$app_dir/releases" "$release"
tar -xzf "$artifact" -C "$release"
chmod +x "$release/server.js"

previous=$(readlink -f "$app_dir/current" 2>/dev/null || true)

restore() {
  if [[ -n "$previous" && -d "$previous" ]]; then
    ln -sfn "$previous" "$app_dir/current"
  fi
  sudo -n systemctl restart "$service" || true
}
trap 'restore' ERR

ln -sfn "$release" "$app_dir/current"
sudo -n systemctl restart "$service"

ok=false
for _ in $(seq 1 30); do
  # systemctl restart 返回时进程与监听端口可能还没就绪；每次循环都重新取 PID。
  main_pid=$(sudo -n systemctl show -p MainPID --value "$service")
  if [[ -z "$main_pid" || "$main_pid" == 0 ]]; then
    sleep 1
    continue
  fi
  # 端口被别的进程占着时 curl 也会 200：先确认监听者确实是这个 unit 的进程。
  if ! sudo -n ss -ltnp | awk -v pid="$main_pid" -v port="$health_port" '
    index($0, ":" port " ") && index($0, "pid=" pid ",") { found = 1 }
    END { exit !found }
  '; then
    sleep 1
    continue
  fi
  body=$(curl -fsS "$health_url" 2>/dev/null || true)
  if [[ -n "$body" && ( -z "$health_prefix" || "$body" == *"$health_prefix"* ) ]]; then
    ok=true
    break
  fi
  sleep 1
done
if [[ "$ok" != true ]]; then
  echo "健康检查失败：$health_url（MainPID=${main_pid:-未启动}）" >&2
  exit 1
fi
echo "已发布 $release"
REMOTE
