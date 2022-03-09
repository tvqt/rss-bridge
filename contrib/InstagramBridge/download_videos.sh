#!/usr/bin/env bash
cd "$(dirname "$0")"
cd ../..
set -xe
for txt in `find ./cache/InstagramBridge -name "*.txt"`
do
	mp4="${txt/.txt/.mp4}"
	youtube-dl `cat $txt` -o $mp4 || true
	if [ -f "$mp4" ]; then
		rm -f "$txt"
	fi
	touch "$mp4"
done
