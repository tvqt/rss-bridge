// ==UserScript==
// @name     Instagram content donor for RSS-Bridge
// @version  1
// @include  https://www.instagram.com/*
// @grant    GM.xmlHttpRequest
// ==/UserScript==

const ACCESS_TOKEN = 'test_token';
const NODE_INDEX = 0;
const NODE_COUNT = 1;
const RSSBRIDGE_ROOT='http://localhost:82';
const INSTAGRAM_ACCOUNTS_URL=RSSBRIDGE_ROOT + '/instagram_accounts.txt';

function sleep(s) {
  let ms = 1000*s;
  return new Promise(resolve => setTimeout(resolve, ms));
}

function nextNumber(currentNumber) {
  let i = NODE_INDEX;
  while(i <= currentNumber) {
    i += NODE_COUNT;
  }
  return i;
}


function get(url) {
  return new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      method: "GET",
      url,
      onload: function(response) {
        if (response.status != 200) {
          reject(response);
        } else {
          resolve(response);
        }
      },
      onerror: reject
    });
  });
}

function post(url, data) {
  return new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      method: "POST",
      url,
      headers: { "Content-type" : "application/x-www-form-urlencoded" },
      data: data,
      onload: function(response) {
        if (response.status != 200) {
          reject(response);
        } else {
          resolve(response);
        }
      },
      onerror: reject
    });
  });
}

(async () => {
  let re = /[^/]+/;
  let match = location.pathname.match(re);
  if (!match || match.length > 1) return;
  let username = match[0];

  try {
    let r = await post(
      RSSBRIDGE_ROOT + "/?action=cache&bridge=Instagram&as_json=1&key=instagram_user_" + username,
      "value=" + encodeURIComponent(JSON.stringify(unsafeWindow._sharedData)) + "&access_token=" + encodeURIComponent(ACCESS_TOKEN)
    );
  } catch(e) {
    console.error("DONOR ERROR: error while posting cache", e);
  }

  let nextUsername = username; // fallback if error happens

  try {
    let accounts = response.responseText.split("\n").filter(x => x);
    if (accounts.length == 0) {
      alert("No accounts given");
      return;
    } else if (accounts.length < NODE_INDEX + 1) {
      alert("Excessive node");
      return;
    }

    let currentIndex = accounts.indexOf(username);
    let nextIndex = nextNumber(currentIndex);
    if (nextIndex >= accounts.length) {
      nextIndex = NODE_INDEX;
    }

    nextUsername = accounts[nextIndex];
  } catch (e) {
    console.error("DONOR ERROR: error while getting next account to visit", e);
  }

  await sleep(10 + 5 * Math.random());

  location.pathname = "/" + nextUsername;
})();
