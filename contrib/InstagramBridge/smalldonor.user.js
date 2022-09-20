// ==UserScript==
// @name     small Instagram content donor for RSS-Bridge
// @version  1
// @include  https://www.instagram.com/*
// @grant    GM.xmlHttpRequest
// @grant    window.close
// ==/UserScript==

const ACCESS_TOKEN = 'test_token';
const RSSBRIDGE_ROOT='http://localhost:82';
const INSTAGRAM_ACCOUNTS_URL=RSSBRIDGE_ROOT + '/instagram_accounts.txt';
const APP_ROOT='http://localhost:8028';

/*
Example:
const LOGINS_PASSWORDS = [
  "username1 password1",
  "username2 password2",
  "username3 password3",
];
*/
const LOGINS_PASSWORDS = [
];

function random_choise(choices) {
  var index = Math.floor(Math.random() * choices.length);
  return choices[index];
}

function sleep(s) {
  let ms = 1000*s;
  return new Promise(resolve => setTimeout(resolve, ms));
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

function setState(state) {
  localStorage.setItem("donor_state", state);
}

function getState() {
  return localStorage.getItem("donor_state") || "fetch_instagram_account";
}

var webProfileInfo;
var webProfileInfoStatus;
var _isLoggedIn;

if (!unsafeWindow.XMLHttpRequest.prototype.getResponseText) {
  unsafeWindow.XMLHttpRequest.prototype.getResponseText = Object.getOwnPropertyDescriptor(unsafeWindow.XMLHttpRequest.prototype, 'responseText').get;
}
Object.defineProperty(unsafeWindow.XMLHttpRequest.prototype, 'responseText', {
  get: exportFunction(function() {
    var responseText = unsafeWindow.XMLHttpRequest.prototype.getResponseText.call(this);
    if (this.responseURL.startsWith("https://i.instagram.com/api/v1/users/web_profile_info/?username=")) {
      webProfileInfo = responseText;
      webProfileInfoStatus = this.status;
    } else if (this.responseURL.startsWith("https://i.instagram.com/api/v1/web/accounts/get_encrypted_credentials/")) {
      _isLoggedIn = true;
    }
    return responseText;
  }, unsafeWindow),
  enumerable: true,
  configurable: true
});

async function logout() {
  let ili = await isLoggedIn();
  if (!ili) return;
  var s = document.createElement("script");
  s.src = "https://www.instagram.com/accounts/logout";
  document.head.appendChild(s);
  await sleep(3);
}

async function isLoggedIn_internal() {
  for (var i=0; i<20; i++) {
    if (location.pathname.startsWith("/accounts/")) return false;
    if (location.pathname.startsWith("/challenge/")) return true;
    if (_isLoggedIn) {
      return true;
    }
    await sleep(1);
  }
  if (location.pathname == "/") {
    return !!document.querySelector('input[placeholder="Search"]');
  } else {
    return true;
  }
  return false;
}

async function isLoggedIn() {
  console.log("checking if logged in");
  const r = await isLoggedIn_internal();
  if (r) {
    console.log("user is logged in");
  } else {
    console.log("user is NOT logged in");
  }
  return r;
}


function is429Error() {
  if (location.pathname.startsWith("/challenge/")) return true;
  if (webProfileInfoStatus == 429) {
    localStorage.removeItem("too_many_requests");
    return true;
  }
  if (document.title.indexOf("Page not found") > -1) {
    var counter = parseInt(localStorage.getItem("too_many_requests")) || 0;
    if (counter > 2) {
      localStorage.removeItem("too_many_requests");
      return true;
    } else {
      localStorage.setItem("too_many_requests", counter + 1)
      return false;
    }
  }
  return false;
}

async function main() {
  while(!document || !document.querySelector) {
    await sleep(1);
  }

  const state = getState();
  console.log("current state", state);
  if (location.pathname.startsWith("/challenge")) {
    await logout();
    setState("login");
    location.pathname = "/accounts/login";
    return;
  }

  switch(state) {
  case "login":
    await sleep(10);
    if (await isLoggedIn()) {
      setState("fetch_instagram_account");
      break;
    }
    let loginBtns = Array.from(document.querySelectorAll("button[type='button']")).filter( x => x.innerText == "Log In" );
    if (loginBtns.length) {
      random_choise(loginBtns).click();
    } else {
      const [username_to_login, password] = random_choise(LOGINS_PASSWORDS).split(" ");
      if (!username_to_login || !password) {
        alert("No login given");
        return;
      }
      await sleep(3);
      var el = null;
      el = document.querySelector("input[name='username']");
      if (!el) {
        console.log("could not find username textbox. Redirecting");
        await sleep(3);
        location.pathname = "/accounts/login";
        return;
      }
      document.querySelector("input[name='username']").focus();
      document.execCommand("selectAll");
      document.execCommand("insertText", false, username_to_login);
      document.querySelector("input[name='password']").focus();
      document.execCommand("selectAll");
      document.execCommand("insertText", false, password);
      document.querySelector("button[type='submit']").click();
      setState("fetch_instagram_account");
    }

    // givin time to login, it will redirect automatically
    await sleep(10);

    // it could not login
    setState("login");
    alert("DONOR ERROR: Could not login");
    await sleep(5);
    location.reload();
    return;

  case "fetch_instagram_account":
    if (!(await isLoggedIn())) {
      setState("login");
      location.pathname = "/accounts/login";
      return;
    }
    let re = /[^/]+/;
    let match = location.pathname.match(re);
    if (!match || match.length > 1) {
      console.error("Not on user's page");
      return;
    }
    let username = match[0];

    //await sleep(10 + 5 * Math.random()); // give time to fetch webProfileInfo
    for(let i=0; i<30; i++) {
      if (webProfileInfoStatus > 0) break;
      await sleep(1);
    }

    if (is429Error()) {
      await logout();
      setState("login"); // TODO: should not wait for time
      location.pathname = "/accounts/login";
      return;
    }

    try {
      const sharedData = unsafeWindow._sharedData;
      if (sharedData && sharedData.entry_data && Object.keys(sharedData.entry_data).length > 0) {
        let r = await post(
          RSSBRIDGE_ROOT + "/?action=cache&bridge=Instagram&as_json=1&key=instagram_user_" + username,
          "value=" + encodeURIComponent(JSON.stringify(sharedData)) + "&access_token=" + encodeURIComponent(ACCESS_TOKEN)
        );
      } else if (webProfileInfo) {
        let r = await post(
          RSSBRIDGE_ROOT + "/?action=cache&bridge=Instagram&as_json=1&key=instagram_user_" + username,
          "value=" + encodeURIComponent(webProfileInfo) + "&access_token=" + encodeURIComponent(ACCESS_TOKEN)
        );
      }
    } catch(e) {
      console.error("DONOR ERROR: error while posting cache", e);
      await sleep(10);
      location.reload();
      return;
    }

    window.scrollTo({"top": 500, "left": 0, "behavior": "smooth"});
    await sleep(1 + 3 * Math.random());
    document.elementFromPoint(400, 100).click();
    await sleep(3 + 3 * Math.random());
    break;

  default:
    alert("Unknown state: " + state);
    break;
  };

  await post(APP_ROOT + "/crawling/pong");
  window.close();
};

main();

