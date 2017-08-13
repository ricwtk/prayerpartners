// "use strict";
const DEBUG = true;

const GOOGLE = {
  // CLIENT_ID: "885265693601-e44cq3b3nu153cc8ib9c4jcq6kahvte9.apps.googleusercontent.com",
  CLIENT_ID: "885265693601",
  DISCOVERY_DOCS: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  SCOPES: "https://www.googleapis.com/auth/drive.file"
};

const OWNER = {
  SELF: 'self',
  FRIEND: 'friend'
};

var defaultData = {
  lastEmailChecked: null,
  self: {
    personId: null,
    name: null,
    email: null,
    personIdAtFriends: [],
    items: []
  },
  friends: [],
  friendRequests: []
};

var newSelfItem = {
  itemId: null,
  item: null,
  desc: null,
  sharedWith: [],
  order: null,
  archived: false
};

var newFriend = {
  friendId: null,
  email: null,
  items: []
};

var newFriendItem = {
  itemId: null,
  item: null,
  desc: null,
  owner: null,
  order: null
};

var data = null;

// display if debug
function showDebug(debugString) {
  if (DEBUG) {
    console.log(debugString);
  }
}

// add self item 
function addSelfItem() {

}

// archive item (self only)
function archiveSelfItem() {

}

// move up or down
function moveItemOrder(upOrDown) {

}

// add friend (unconnected)
function createFriend() {

}

// connect to friend
function connectToFriend() {

}

// respond to friend request
function respondToFriendRequest() {

}

// add new item to friend's list 
function addFriendItem() {

}

// upon exit edit mode, update or cancel
function exitEdit() {

}

// read from gmail
function readFromGmail() {

}

// first time log in
function firstTimeLogIn() {
  data = defaultData;
  // read from google account
  // save email and name to data
}

// load api
function loadApi() {
  showDebug("loadApi");
  gapi.load("client", initApi);
}

function initApi() {
  showDebug("initApi");
  gapi.client.init({
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
    clientId: "885265693601-q38bh4n7s7rdrv6lpn4qbb6sbt065pum.apps.googleusercontent.com",
    scope: "https://www.googleapis.com/auth/drive.file"
  }).then(function () {
    gapi.auth2.getAuthInstance().isSignedIn.listen(signedIn);
    signedIn(gapi.auth2.getAuthInstance().isSignedIn.get());

    document.getElementById("signin-google").onclick = handleAuthClick;
    document.getElementById("signout-google").onclick = handleSignoutClick;
  });
}

// check signed in status, show sign in screen or direct to the main screen
function signedIn(signinState) {
  showDebug("signedIn");
  showDebug(signinState);
  if (signinState) {
    document.getElementById("signin-overlay").classList.add("hide");
    initSystem();
  } else {
    document.getElementById("signin-overlay").classList.remove("hide");
  }
}

// click to authenticate
function handleAuthClick() {
  showDebug("handleAuthClick");
  gapi.auth2.getAuthInstance().signIn();
}

// click to sign out
function handleSignoutClick() {
  showDebug("handleSignoutClick");
  gapi.auth2.getAuthInstance().signOut();
}

// read from saved data
function readSaved() {
  // read from saved data, if no saved data, load default
  return gapi.client.drive.files.list({
    q: 'name="data.json"',
    spaces: 'appDataFolder',
    fields: 'files(id,name)'
  });
}

// init function
function initSystem() {
  // read from google account

  if (data == null) {
    firstTimeLogIn();
  }
}