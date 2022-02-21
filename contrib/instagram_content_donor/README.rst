===================================================
 Instagram content donor userscript for RSS-Bridge
===================================================

Installation
------------

1. Install Mozilla Firefox

2. Install Greasemonkey addon https://addons.mozilla.org/ru/firefox/addon/greasemonkey/

3. Install userscript by opening `donor.user.js <donor.user.js>`__ in Firefox

Configuration
-------------

1. Configure your RSS-Bridge instance

   a. Add ``instagram_accounts.txt`` in RSS-Bridge root directory and define instagram accounts to be visited

   b. Add or edit ``config.ini.php`` by adding following lines. Feel free to set any string as access token:

.. code-block::

   ; <?php exit; ?> DO NOT REMOVE THIS LINE

   [cache]
   access_token = "YOUR_ACCESS_TOKEN_HERE"

2. Temporary disable "Instagram content donor for RSS-Bridge" userscript by clicking on Greasemonkey icon -> Instagram content donor for RSS-Bridge -> Untick "Enabled"

3. Login to your instagram account.
   Input verification code if required.

4. Edit userscript by clicking on Greasemonkey icon -> Instagram content donor for RSS-Bridge -> Edit

   a. Modify RSSBRIDGE_ROOT to your one. Must not end with slash

   b. Modify ACCESS_TOKEN to that one, that you set in step 1

If are using more than one account to retreive content, you need to follow steps above for every account and also update following variables in userscript:

- ``NODE_COUNT`` set to number of used accounts

- ``NODE_INDEX`` for first account must be 0, for second account must be 1, for third account must be 2 etc

5. Enable "Instagram content donor for RSS-Bridge" userscript

Usage
-----

After configurating RSS-Brige and userscript, visit any instagram profile and reload the page.
After approximately 10 seconds browser will be redirected to other instagram account.

Maintainance
------------

Open browser developer tools (F12), open "Console", make sure no signs with "DONOR ERROR" appear.
If it does - please report it.
