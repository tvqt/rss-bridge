===========================
 Videos in InstagramBridge
===========================

It is possible to fetch videos from Instagram feeds and temporary store them to filesystem for later usage.
As result videos in feeds will have direct video links.

Configuring
-----------

Before we start, lets assume, that:

- rss-bridge root directory is ``/var/www/html/rss-bridge``

- VPS has domain media.myhost.com


1. Install `yt-dlp`:

.. code-block:: sh

   # make sure are logged in as root first

   wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/youtube-dl
   chmod +x /usr/local/bin/youtube-dl

2. Schedule tasks for downloading videos and cleaning up old videos

.. code-block:: sh

   # login as www-data user
   sudo -u www-data bash

   # open schedule editor
   crontab -e

- add following lines to the end and save (if using nano, ctrl+O, Enter, ctrl+x):

.. code-block::

   0 23 * * * /var/www/html/rss-bridge/contrib/InstagramBridge/download_videos.sh
   0 11 * * * /var/www/html/rss-bridge/contrib/InstagramBridge/remove_old_videos.sh

3. Configure InstagramBridge to use prefixes for video urls.

.. code-block:: sh

   nano /var/www/html/rss-bridge/config.ini.php


In InstagramBridge section you need to add ``video_url_prix`` key with value.
For example:

.. code-block::

   ; <?php exit; ?> DO NOT REMOVE THIS LINE

   [InstagramBridge]
   video_url_prefix = "https://media.myhost.com/"

4. Prepare nginx configuration

.. code-block:: sh

   # run as root

   cp /var/www/html/rss-bridge/contrib/InstagramBridge/media_nginx.conf /etc/nginx/sites-available/media
   ln -s /etc/nginx/sites-available/media /etc/nginx/sites-enabled/media
   nano /etc/nginx/sites-available/media

   # in editor you need to edit
   # 1. ``root`` value. Change it according, where your rss-bridge directory is located
   # 2. ``server_name`` value. In example it is ``media.myhost.com``, defacto it differs

   # and save

5. Install certbot + nginx plugin and get certficiate for serving https connections

.. code-block:: sh

   apt-get install certbot python3-certbot-nginx
   certbot
