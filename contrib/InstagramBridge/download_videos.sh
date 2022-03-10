#!/usr/bin/env bash
cd "$(dirname "$0")"
cd ../..
set -xe
for txt in `find ./cache/InstagramBridge -name "*.txt"`
do
	mp4="${txt/.txt/.mp4}"
	if [ ! -f "$mp4" ]; then
		youtube-dl `cat $txt` -o $mp4 || true
	fi
	if [ -f "$mp4" ]; then
		size=`stat --printf="%s" $mp4`
		if [ "$size" != "0" ]; then
			rm -f "$txt"
			touch "$mp4"
		else
			rm -f "$mp4"
		fi
	fi
done
