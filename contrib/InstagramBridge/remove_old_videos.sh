#!/usr/bin/env bash
cd "$(dirname "$0")"
cd ../..
set -xe
find ./cache/InstagramBridge -mtime +7 -name "*.mp4" -delete
