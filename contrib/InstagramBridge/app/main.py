# in order to work firefox correctly, set this in about config:
# browser.sessionstore.resume_from_crash -> false
from pathlib import Path
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

RSSBRIDGE_ROOT='/var/www/html/rss-bridge'
INSTAGRAM_USER_RESUME_PATH = str(Path.home().joinpath(".instagram_user_resume"))
START_CRAWLING = True
FIREFOX_PONGED = False


def cmd(cmd):
    return subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


class CrawlerThread(threading.Thread):
    def run(self):
        while True:
            self._run()

    def _run(self):
        global START_CRAWLING
        global FIREFOX_PONGED
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

            cmd(['firefox', 'http://localhost:8028'])

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
                cmd(['firefox', url])

                start_time = time()
                while True:
                    if FIREFOX_PONGED is True:
                        break

                    elif time() - start_time > 60*2:
                        _logger.warning("Killing firefox process")
                        cmd(["pkill", "-f", "firefox"])
                        sleep(5)
                        _logger.info("starting new firefox")
                        cmd(['firefox', 'http://localhost:8028/'])
                        break

                    sleep(1)

                FIREFOX_PONGED = False

                _logger.info("Downloading videos if any")
                cmd([RSSBRIDGE_ROOT + "/contrib/InstagramBridge/download_videos.sh", instagram_user]).wait()

        except Exception:
            _logger.exception("Error in thread. Stopping crawling")
            sleep(5)
        finally:
            cmd(["pkill", "-f", "firefox"])

        START_CRAWLING = False
        FIREFOX_PONGED = False
        resume_from_user = None


url_map = Map([
    Rule("/crawling/start", endpoint="start"),
    Rule("/crawling/pong", endpoint="pong"),
])


def application(environ, start_response):
    global START_CRAWLING
    global FIREFOX_PONGED

    try:
        urls = url_map.bind_to_environ(environ)
        endpoint, args = urls.match()

        if endpoint == "start":
            START_CRAWLING = True
        elif endpoint == "pong":
            FIREFOX_PONGED = True

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
    run_simple("127.0.0.1", 8028, application, threaded=True)
