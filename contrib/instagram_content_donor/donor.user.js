// ==UserScript==
// @name     Instagram content donor for RSS-Bridge
// @version  1
// @include  https://www.instagram.com/*
// @grant    GM.xmlHttpRequest
// ==/UserScript==

const INSTAGRAM_ACCOUTNS_URL='http://localhost:82/instagram_accounts.txt';
const RSSBRIDGE_ROOT='http://localhost:82';

function sleep(s) {
  let ms = 1000*s;
  return new Promise(resolve => setTimeout(resolve, ms));
}

function get(url) {
  return new Promise(resolve => {
    GM.xmlHttpRequest({
      method: "GET",
      url,
      onload: resolve
    });
  });
}

function post(url, data) {
  return new Promise(resolve => {
    GM.xmlHttpRequest({
      method: "POST",
      url,
      headers: { "Content-type" : "application/x-www-form-urlencoded" },
      onload: resolve,
      data: data
    });
  });
}

(async () => {
  let re = /[^/]+/;
  let match = location.pathname.match(re);
  if (!match || match.length > 1) return;
  let username = match[0];

  let r = await post(RSSBRIDGE_ROOT + "/?action=cache&bridge=Instagram&key=instagram_user_" + username, "value=" + encodeURIComponent(JSON.stringify(unsafeWindow._sharedData)));

  let response = await get(INSTAGRAM_ACCOUTNS_URL);
  let accounts = response.responseText.split("\n").filter(x => x);
  if (accounts.length == 0) {
    alert("No accounts given");
    return;
  }

  let currentIndex = accounts.indexOf(username);
  let nextIndex = currentIndex + 1;
  if (nextIndex >= accounts.length) {
    nextIndex = 0;
  }

  await sleep(10 + 5 * Math.random());

  location.pathname = "/" + accounts[nextIndex];
})();
