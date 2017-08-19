// "use strict";
const DEBUG = true;

var GOOGLE = {
  CLIENT_ID: "885265693601-q38bh4n7s7rdrv6lpn4qbb6sbt065pum.apps.googleusercontent.com",
  DISCOVERY_DOCS: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  SCOPES: "https://www.googleapis.com/auth/drive.file"
    + " https://www.googleapis.com/auth/drive.appfolder"
};

var defaultData = {
  lastEmailChecked: null,
  mine: {
    personId: null,
    name: null,
    email: null,
    personIdAtFriends: [],
    items: []
  },
  friends: [],
  friendRequests: []
};

var newMineItem = {
  itemId: null,
  item: null,
  desc: null,
  sharedWith: [],
  order: null,
  tags: [],
  archived: false
};

var newFriend = {
  friendId: null,
  name: null,
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

var savedData = defaultData;

// display if debug
function showDebug(debugString) {
  if (DEBUG) {
    try {
      console.log(...debugString);
    } catch (e) {
      console.log(debugString);
    }
  }
}

function copyObj(object) {
  return JSON.parse(JSON.stringify(object));
}

// id generator
function generateId(blacklistId) {
  var idChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var idLength = 10;
  do {
    var idResult = '';
    for (var i = idLength; i > 0; --i) idResult += idChars[Math.floor(Math.random() * idChars.length)];
  } while (blacklistId.includes(idResult))
  return idResult;
}

// add mine item 
function addMineItem() {

}

// archive item (mine only)
function archiveMineItem() {

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
  savedData = defaultData;
  // read from google account
  // save email and name to data
}

// load api
function loadApi() {
  showDebug(["loadApi"]);
  gapi.load("client", initApi);
}

function initApi() {
  showDebug(["initApi"]);
  gapi.client.init({
    discoveryDocs: GOOGLE.DISCOVERY_DOCS,
    clientId: GOOGLE.CLIENT_ID,
    scope: GOOGLE.SCOPES
  }).then(function () {
    gapi.auth2.getAuthInstance().isSignedIn.listen(signedIn);
    signedIn(gapi.auth2.getAuthInstance().isSignedIn.get());

    document.getElementById("signin-google").onclick = handleAuthClick;
    document.getElementById("signout-google").onclick = handleSignoutClick;
    document.getElementById("disconnect-google").onclick = handleDisconnectClick;
  }, console.log);
}

// check signed in status, show sign in screen or direct to the main screen
function signedIn(signinState) {
  showDebug(["signedIn"]);
  showDebug([signinState]);
  if (signinState) {
    document.getElementById("signin-overlay").classList.add("hide");
    initSystem();
  } else {
    document.getElementById("signin-overlay").classList.remove("hide");
  }
}

// click to authenticate
function handleAuthClick() {
  showDebug(["handleAuthClick"]);
  gapi.auth2.getAuthInstance().signIn();
}

// click to sign out
function handleSignoutClick() {
  showDebug(["handleSignoutClick"]);
  gapi.auth2.getAuthInstance().signOut();
}

// click to disconnect
function handleDisconnectClick() {
  showDebug(["handleDisconnectClick"]);
  gapi.auth2.getAuthInstance().disconnect();
}

// read from saved data
function getSavedFile() {
  showDebug(["getSavedFile"]);
  // read from saved data, if no saved data, load default
  return gapi.client.drive.files.list({
    q: 'name="data.json"',
    spaces: 'appDataFolder',
    fields: 'files(id,name)'
  });
}

function readOrCreateData(searchResult) {
  // load previous data if available, else load default
  var files = searchResult.result.files;
  showDebug(["readOrCreateData", files]);
  if (files.length > 0) {
    return readFileContent(files[0].id);
  } else {
    savedData = defaultData;
    var basicProfile = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
    savedData.mine.name = basicProfile.getName();
    savedData.mine.email = basicProfile.getEmail();
    savedData.mine.personId = generateId([]);
    return createDataFile()
      .then((res)=>{
        return {fileId: res.result.id, content: savedData};
      })
      .then(saveToFile)
      .then((res) => {
        return res.result.id;
      })
      .then(readFileContent);
  }
}

function createDataFile() {
  showDebug(["createDataFile"]);
  return gapi.client.drive.files.create({
    resource: {
      name: "data.json",
      parents: ["appDataFolder"]
    },
    fields: "id"
  });
}

function readFileContent(fileId) {
  showDebug(["readFileContent"]);
  return gapi.client.drive.files.get({
    fileId: fileId,
    alt: 'media'
  });
}

function saveToGlobal(readData) {
  showDebug(["saveToGlobal", copyObj(readData)]);
  savedData = readData.result;
} 

function saveToFile(newContent) {
  showDebug(["saveToFile"]);
  return gapi.client.request({
    path: '/upload/drive/v3/files/' + newContent.fileId,
    method: 'PATCH',
    params: {
      uploadType: 'media'
    },
    body: JSON.stringify(newContent.content)
  });
}

function updateToDatabase() {
  showDebug(["updateToDatabase"]);
  getSavedFile()
    .then((res) => {
      return {
        fileId: res.result.files[0].id,
        content: savedData
      } 
    })
    .then(saveToFile);
}

// init function
function initSystem() {
  // read from google account
  getSavedFile().then(readOrCreateData).then(saveToGlobal).then(initVueInst);
  // getSavedFile().then(console.log, console.log);
  if (savedData == null) {
    firstTimeLogIn();
  }
}