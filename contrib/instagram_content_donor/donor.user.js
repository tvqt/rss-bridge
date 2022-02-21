// ==UserScript==
// @name     Instagram content donor for RSS-Bridge
// @version  1
// @include  https://www.instagram.com/*
// @grant    GM.xmlHttpRequest
// @grant    GM.getValue
// @grant    GM.setValue
// ==/UserScript==

const ACCESS_TOKEN = 'test_token';
const NODE_INDEX = 0;
const NODE_COUNT = 1;
const RSSBRIDGE_ROOT='http://localhost:82';
const INSTAGRAM_ACCOUNTS_URL=RSSBRIDGE_ROOT + '/instagram_accounts.txt';
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

function setState(state) {
  localStorage.setItem("donor_state", state);
}

function getState() {
  return localStorage.getItem("donor_state") || "waiting_for_start";
}

function showProgress() {
  let p = localStorage.getItem("donor_progress");
  if (!p) return;
  let d = document.createElement("div");
  d.style.bottom = 0;
  d.style.right = 0;
  d.style.position = "fixed";
  d.style.backgroundColor = "red";
  d.innerHTML = p;
  document.body.appendChild(d);
}

function setProgress(p) {
  if (p) {
    localStorage.setItem("donor_progress", p);
  } else {
    localStorage.removeItem("donor_progress");
  }
}

async function fetchInstagramAccounts() {
  try {
    let accounts = (await get(INSTAGRAM_ACCOUNTS_URL)).responseText.split("\n").filter(x => x);
    if (accounts.length == 0) {
      alert("No accounts given");
      return null;
    } else if (accounts.length < NODE_INDEX + 1) {
      alert("Excessive node");
      return null;
    }

    // remove duplicates
    accounts = [...new Set(accounts)];
    // TODO: sort

    return accounts;
  } catch (e) {
    console.error("DONOR ERROR: error while fetching instagram accounts", e);
    await sleep(10);
    location.reload();
    await sleep(10);
	return null;
  }
}

function setStatus(status) {
}

async function popNextInstagramAccountToCrawl(current) {
  let accounts = await fetchInstagramAccounts();

  let currentIndex = accounts.indexOf(current);
  let nextIndex = nextNumber(currentIndex);

  if (!current) {
    return accounts[NODE_INDEX];
  }

  // setting progress
  setProgress("Progress: " + (nextIndex + 1).toString() + " of " + accounts.length.toString());

  if (nextIndex < accounts.length) {
    return accounts[nextIndex];
  } else {
    return null;
  }
}

async function logout() {
  var s = document.createElement("script");
  s.src = "https://www.instagram.com/accounts/logout";
  document.head.appendChild(s);
}

function is429Error() {
  return !unsafeWindow._sharedData;
}

(async () => {
  let currentFetchingInstagramAccount = null;
  let state = getState();
  console.log("current state", state);
  showProgress();
  switch(state) {
    case "waiting_for_start":
      await logout();
      while (true) {
        await sleep(2);
        let now = new Date();
        if (now.getHours() >= 9) {
          let responseText = random_choise(LOGINS_PASSWORDS);
          GM.setValue("lw", responseText.split(" "));
          setState("login");
          location.pathname = "/";
          return;
        }
        await sleep(8);
      }
    break;

    case "login":
      const [username_to_login, password] = await GM.getValue("lw");
      if (!username_to_login || !password) {
        alert("No login given");
        return;
      }
      await sleep(3);
      document.querySelector("input[name='username']").focus();
      document.execCommand("selectAll");
      document.execCommand("insertText", false, username_to_login);
      document.querySelector("input[name='password']").focus();
      document.execCommand("selectAll");
      document.execCommand("insertText", false, password);
      document.querySelector("button[type='submit']").click();
      setState("get_next_instagram_account");

      // givin time to login, it will redirect automatically
      await sleep(10);

      // it could not login
      setState("login");
      console.log("DONOR ERROR: Could not login");
      await sleep(5)
      location.reload();
    break;

    case "fetch_instagram_account":
      if (is429Error()) {
        setState("waiting_for_start");
        location.pathname = "/";
        return;
      }

      let re = /[^/]+/;
      let match = location.pathname.match(re);
      if (!match || match.length > 1) {
        setState("get_next_instagram_account");
        location.pathname = "/";
        return;
      }
      let username = match[0];
      currentFetchingInstagramAccount = username;

      try {
        let r = await post(
          RSSBRIDGE_ROOT + "/?action=cache&bridge=Instagram&as_json=1&key=instagram_user_" + username,
          "value=" + encodeURIComponent(JSON.stringify(unsafeWindow._sharedData)) + "&access_token=" + encodeURIComponent(ACCESS_TOKEN)
        );
      } catch(e) {
        console.error("DONOR ERROR: error while posting cache", e);
        await sleep(10);
        location.reload();
        return;
      }

      await sleep(10 + 5 * Math.random());
      window.scrollTo({"top": 500, "left": 0, "behavior": "smooth"})
      await sleep(1 + 3 * Math.random());
      document.elementFromPoint(400, 100).click()
      await sleep(3 + 3 * Math.random());
    // break;

    case "get_next_instagram_account":
      let nextInstagramAccount = await popNextInstagramAccountToCrawl(currentFetchingInstagramAccount);
      if (!nextInstagramAccount) {
        setProgress(false);
        console.log("all finished");
        setState("waiting_for_start");
        while(true) {
          let now = new Date();
          if (now.getHours() < 9) {
            location.pathname = "/";
          }
          await sleep(10);
        }
      }
      setState("fetch_instagram_account");
      location.pathname = "/" + nextInstagramAccount;
    break;

    default:
      alert("Unknown state: " + state);
    break;
  };
})();
