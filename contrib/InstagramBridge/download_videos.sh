#!/usr/bin/env bash
log () {
	echo -e "$(date)\n$1" > ./cache/InstagramBridge/status.txt
}

cd "$(dirname "$0")"
cd ../..
log "searching for tasks for downloading"
if [ -z "$1" ]; then
    TXT_LIST=`find ./cache/InstagramBridge -mindepth 2 -name "*.txt"`
else
    TXT_LIST=`find ./cache/InstagramBridge/$1 -name "*txt"`
fi
TXT_COUNT="$(echo "$TXT_LIST" | wc -l)"
COUNTER=0
set -xe
for txt in $TXT_LIST
do
	let COUNTER=COUNTER+1
	mp4="${txt/.txt/.mp4}"
	log "($COUNTER/$TXT_COUNT) downloading file $mp4"
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
log "finished"
