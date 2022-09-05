from pathlib import Path
import queue
import subprocess
import logging
import threading
import os
from time import sleep, time
from werkzeug.exceptions import HTTPException
from werkzeug.routing import Map, Rule
from werkzeug.serving import run_simple
from werkzeug.wrappers import Response

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s.%(msecs)03d %(levelname)s %(module)s - %(funcName)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
)

_logger = logging.getLogger(__name__)

DOWNLOAD_VIDEOS_CMD = ['sudo', '-u', 'www-data', '/var/www/html/rss-bridge/contrib/InstagramBridge/download_videos.sh']
INSTAGRAM_USER_RESUME_PATH = str(Path.home().joinpath(".instagram_user_resume"))
START_CRAWLING = True
BROWSER_PONGED = False


def cmd(cmd):
    return subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


video_task_queue = queue.SimpleQueue()


class VideosDownloaderThread(threading.Thread):
    def run(self):
        while True:
            instagram_user = video_task_queue.get()
            _logger.info("Downloading videos for " + instagram_user)
            cmd(DOWNLOAD_VIDEOS_CMD + [instagram_user]).wait()
            _logger.info("Downloading videos for " + instagram_user + " has been finished")


class CrawlerThread(threading.Thread):
    def run(self):
        while True:
            self._run()

    def _run(self):
        global START_CRAWLING
        global BROWSER_PONGED
        filename = self._args[0]

        while START_CRAWLING is False:
            sleep(1)

        resume_from_user = None
        try:
            try:
                with open(INSTAGRAM_USER_RESUME_PATH, "r") as f:
                    resume_from_user = f.read().split("\n")[0]
                os.unlink(INSTAGRAM_USER_RESUME_PATH)
            except FileNotFoundError:
                pass

            cmd(['chromium', 'http://localhost:8028'])

            instagram_users = []

            with open(filename) as f:
                instagram_users = sorted(set(filter(
                    bool,
                    map(lambda x: x.strip().lower(), f.readlines())
                )))

            _logger.info("%s users in text file" % len(instagram_users))

            sleep(5)

            for i, instagram_user in enumerate(instagram_users):
                if resume_from_user is not None:
                    if resume_from_user == instagram_user:
                        resume_from_user = None
                    else:
                        continue
                _logger.info("Progress: {} of {}".format(i+1, len(instagram_users)))
                url = "https://www.instagram.com/" + instagram_user
                _logger.info("Opening {}".format(url))
                cmd(['chromium', url])

                start_time = time()
                while True:
                    if BROWSER_PONGED is True:
                        break

                    elif time() - start_time > 60*2:
                        _logger.warning("No answer from usersript. Closing tab")
                        cmd(['xdotool', 'search', '--class', 'chromium', 'key', '--window', '%@', 'Ctrl+w'])
                        sleep(5)
                        if os.system("pidof chromium > /dev/null") != 0:
                            cmd(['chromium', 'http://localhost:8028'])
                            sleep(5)
                        break

                    sleep(1)

                BROWSER_PONGED = False
                video_task_queue.put_nowait(instagram_user)

        except Exception:
            _logger.exception("Error in thread. Stopping crawling")
            sleep(5)
        finally:
            pass
            # cmd(["pkill", "-f", "chromium"])

        START_CRAWLING = False
        BROWSER_PONGED = False
        resume_from_user = None


url_map = Map([
    Rule("/crawling/start", endpoint="start"),
    Rule("/crawling/pong", endpoint="pong"),
])


def application(environ, start_response):
    global START_CRAWLING
    global BROWSER_PONGED

    try:
        urls = url_map.bind_to_environ(environ)
        endpoint, args = urls.match()

        if endpoint == "start":
            START_CRAWLING = True
        elif endpoint == "pong":
            BROWSER_PONGED = True

        response = Response("ok", mimetype="text/plain")
    except HTTPException as e:
        response = e.get_response(environ)

    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type")
    return response(environ, start_response)


if __name__ == "__main__":
    crawler_thread = CrawlerThread(args=["../../../instagram_accounts.txt"])
    crawler_thread.start()
    vd = VideosDownloaderThread()
    vd.start()
    run_simple("127.0.0.1", 8028, application, threaded=True)
