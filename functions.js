// "use strict";
const DEBUG = true;

var GOOGLE = {
  CLIENT_ID: "885265693601-q38bh4n7s7rdrv6lpn4qbb6sbt065pum.apps.googleusercontent.com",
  DISCOVERY_DOCS: [
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest", 
    "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"
  ],
  SCOPES: [//"https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.appfolder",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.compose"].join(" ")
};

// var threadId = 

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

var messageData = {
  type: 'text/html',
  encoding: 'UTF-8',
  from: '',
  to: [],
  cc: [],
  bcc: [],
  replyTo: [],
  date: new Date(),
  subject: '',
  body: ''
}

var aboutText = "PrayerPartners is ...";

var cssStyle = `
  body { text-align: center; }
  .hide, #id { display: none; }
  #main { background-color: #e0f2f1; color: #009688; padding: 1em; }
  a.button { display: inline-block; padding: 1em; background-color: #009688; color: #e0f2f1; text-decoration: none; font-size: 150%; }
  a.button:hover { background-color: #b2dfdb; color: #009688; }
  #sender-name, #sender-email { display: inline-block; }
  .align-center { text-align: center; }
  #text { font-size: 120%; }
  .top-sep { min-height: 1em; }
  .bottom-sep { min-height: 3em; }
`;

var verbalAction = {
  invite: "sent an invitation",
  accept: "accepted your invitation"
};

var action = {
  invite: "invite",
  accept: "accept"
};

var messageSubject = {
  invite: "Invite to PrayerPartners",
  accept: "Accept invitation to PrayerPartners"
};

var messageBody = `
  <html>
    <head>
      <style>
        %cssStyle%
      </style>
    </head>
    <body>
      <div id="main">
        <div id="text">
          <div id="sender-name">%name%</div>&nbsp;(<div id="sender-email">%email%</div>) %verbalAction% to connect on PrayerPartners.
        </div>
        <div class="top-sep"></div>
        <div class="align-center">
          <a class="button" href="https://ricwtk.github.io/prayerpartners/" target="_blank">Go to PrayerPartners</a>
        </div>
        <div class="bottom-sep"></div>
        <div class="align-center">
          %aboutText%
        </div>
        <div id="id">PP</div>
        <div class="hide">%action%</div>
      </div>
    </body>
  </html>
`

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
  showDebug(["signedIn"]);
  showDebug([signinState]);
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
      .then((res)=>{
        return {fileId: res.result.id, content: copyObj(globalStore.savedData)};
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



function readFromGmail() {
  return gapi.client.gmail.users.messages.list({
    "userId": "me",
    "q": "subject:PrayerPartners",
    "format": "full"
  }).then((res) => {
    if (res.result.resultSizeEstimate == 0) {
      throw "No result";
    } else {
      return res.result.messages[0].id;
    }
  });
  // return gapi.client.request({
  //   path: "gmail/v1/users/me/messages/" + "15d5b5c74b3aa89b",
  //   method: 'GET',
  //   params: {
  //     format: "full"
  //   }
  // });

  // q: "from: abe.nong@gmail.com to: ricwtk@gmail.com"
  // threadId: 15d5b5c74b3aa89b 
    // "id": "15d5b5c74b3aa89b",

}

function getMessageWithId(messageId) {
  return gapi.client.gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full"
  });
}

function displayBody(res) {
  console.log(res);
  // console.log(Base64.fromBase64(res.result.raw));
  console.log(getHeader(res.result.payload.headers, "To"));
  console.log(getHeader(res.result.payload.headers, "From"));
  console.log(new Date(getHeader(res.result.payload.headers, "Date")));
  console.log(getBody(res.result.payload));
  // console.log(res.result.raw.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, ''));
  // console.log(atob(res.result.raw.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '')));
}


// https://github.com/sitepoint-editors/gmail-api-javascript-example/blob/master/01%20-%20Basic%20client/index.html
function getHeader(headers, index) {
  var output = '';
  headers.forEach(header => {
    if (header.name == index) {
      output = header.value;
    }
  });
  return output;
}

function getBody(message) {
  // message = returned.result.payload
  var encodedBody = '';
  if(typeof message.parts === 'undefined')
  {
    encodedBody = message.body.data;
  }
  else
  {
    encodedBody = getHTMLPart(message.parts);
  }
  // encodedBody = encodedBody.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
  // return decodeURIComponent(escape(window.atob(encodedBody)));
  return Base64.fromBase64(encodedBody);
}

function getHTMLPart(arr) {
  for(var x = 0; x <= arr.length; x++)
  {
    if(typeof arr[x].parts === 'undefined')
    {
      if(arr[x].mimeType === 'text/html')
      {
        return arr[x].body.data;
      }
    }
    else
    {
      return getHTMLPart(arr[x].parts);
    }
  }
  return '';
}

function generateMessage(action, sendTo) {
  var newMsg = copyObj(messageData);
  newMsg.to.push(sendTo);
  newMsg.subject = copyObj(messageSubject[action]);
  newMsg.body = copyObj(messageBody)
    .replace("%name%", globalStore.savedData.mine.name)
    .replace("%email%", globalStore.savedData.mine.email)
    .replace("%cssStyle%", cssStyle)
    .replace("%aboutText%", aboutText)
    .replace("%verbalAction%", verbalAction[action])
    .replace("%action%", action[action]);

  if (MimeMessage.validMimeMessage(newMsg)) {
    const message = MimeMessage.createMimeMessage(newMsg);
    const base64SafeString = message.toBase64SafeString();

    // console.log(Base64.fromBase64(base64SafeString));
    return base64SafeString;
  } else {
    return null;
  }
}

function sendInvite(sendTo) {
  return gapi.client.gmail.users.messages.send({
    'userId': 'me',
    'resource': {
      'raw': generateMessage(action.invite, sendTo)
    }
  });
}

function sendAccept(sendTo) {
  return gapi.client.gmail.users.messages.send({
    'userId': 'me',
    'resource': {
      'raw': generateMessage(action.accept, sendTo)
    }
  });
}


// init function
function initSystem() {
  // read from google account
  getSavedFile().then(readOrCreateData).then(saveToGlobal);
  readFromGmail().then(getMessageWithId).then(displayBody);
}