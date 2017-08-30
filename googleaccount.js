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

    // document.getElementById("signin-google").onclick = handleAuthClick;
    // document.getElementById("signout-google").onclick = handleSignoutClick;
    // document.getElementById("disconnect-google").onclick = handleDisconnectClick;
  }, console.log);
}

// check signed in status, show sign in screen or direct to the main screen
function signedIn(signinState) {
  showDebug(["signedIn", signinState]);
  if (signinState) {
    // document.getElementById("signin-overlay").classList.add("hide");
    globalStore.showSignIn = false;
    globalStore.showMenu = false;
    initSystem();
  } else {
    // document.getElementById("signin-overlay").classList.remove("hide");
    globalStore.showSignIn = true;
    globalStore.showMenu = true;
  }
  // showDebug([document.getElementById("signin-overlay")]);
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
    globalStore.savedData = defaultData;
    var basicProfile = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
    globalStore.savedData.mine.name = basicProfile.getName();
    globalStore.savedData.mine.email = basicProfile.getEmail();
    globalStore.savedData.mine.personId = generateId([]);
    return createDataFile()
      .then((res) => {
        return {
          fileId: res.result.id,
          content: copyObj(globalStore.savedData)
        };
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
  globalStore.savedData = readData.result;
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
        content: copyObj(globalStore.savedData)
      }
    })
    .then(saveToFile);
}

// init function
function initSystem() {
  // read from google account
  getSavedFile()
    .then(readOrCreateData, chainError)
    .then(saveToGlobal, chainError)
    .then(readFromGmail, chainError)
    .then(extractRelevantMessages, chainError)
    .then(logAndForward, chainError)
    .then(processMessages, chainError)
    .then(logAndForward, chainError)
    .then(updateToDatabase, chainError)
    .then(console.log, finalError);
  readFromGmail()
    .then(getMessageWithId, chainError)
    .then(displayBody, chainError)
    .then(null, finalError);
}