const DEBUG = true;

var USERDATATABLE = "pp-userdata";
var USERREQUESTTABLE = "pp-request";
var USERACCEPTTABLE = "pp-accept";
var USERUPDATESTABLE = "pp-updates";

var GOOGLE = {
  CLIENT_ID: "885265693601-q38bh4n7s7rdrv6lpn4qbb6sbt065pum.apps.googleusercontent.com",
  DISCOVERY_DOCS: [
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
    "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"
  ],
  SCOPES: [ //"https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.appfolder",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send"
  ].join(" ")
};


function newUserData(idp, userId, name, email, profilePicture, profileLink) {
  return {
    idp: idp || null,
    userId: userId || null,
    name: name || null,
    email: email || null,
    profilePicture: profilePicture || null,
    profileLink: profileLink || null,
    items: [],
    friends: [],
    friendRequests: [],
    groups: [],
    ui: {
      sectionStyle: {
        width: "300px",
        height: "200px"
      },
    },
    searchField: null
  };
}

function newMineItem() {
  return {
    itemId: null,
    item: null,
    desc: null,
    sharedWith: [],
    order: null,
    tags: [],
    archived: false
  };
}

function newFriendRequest(userId) {
  return {
    userId: userId || null
  }
}

function newFriend(userId, name) {
  return {
    userId: userId || null,
    name: name || null,
    groups: [],
    items: []
  }
}

function newFriendItem(id, title, desc, owner) {
  return {
    itemId: id || generateId([]),
    item: title || null,
    desc: desc || null,
    owner: owner || "mine",
    order: null
  }
}

function newNotification(toId, action, content) {
  return {
    fromId: globalStore.idpData.userId,
    toId: toId,
    action: action,
    content: content
  }
}

function newMessageData() {
  return {
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
}

var aboutText = "PrayerPartners is an open-source prayer items sharing web app. The application utilises the Google Drive app folder API to store the list and the Gmail API to update the shared items.";

var cssStyle = `
  body { text-align: center; }
  .hide, #id { display: none; }
  #main { background-color: #e0f2f1; color: #009688; padding: 1em; }
  a.button { display: inline-block; padding: 1em; background-color: #009688; color: #e0f2f1; text-decoration: none; font-size: 150%; }
  a.button:hover { background-color: #b2dfdb; color: #009688; }
  #sender-name, #sender-email { display: inline-block; text-decoration: none }
  .align-center { text-align: center; color: #009688 }
  #text { font-size: 120%; color: #009688 }
  .top-sep { min-height: 1em; }
  .mid-sep { min-height: 1em; }
  .bottom-sep { min-height: 3em; }
  .item-header, .item-content { text-align: left; padding: 1em; }
  .item-header { background-color: #009688; color: #e0f2f1; padding-bottom: .5em; font-size: 120%; }
  .item-content { background-color: #b2dfdb; color: #009688; padding-top: 0.5em; }
`;

var verbalAction = {
  invite: "sent you an invitation to connect on PrayerPartners",
  accept: "accepted your invitation to connect on PrayerPartners",
  update: "updated the prayer items shared with you"
};

var action = {
  invite: "invite",
  accept: "accept",
  update: "update"
};

var messageSubject = {
  invite: "Invite to PrayerPartners",
  accept: "Accept invitation to PrayerPartners",
  update: "Updates to shared list on PrayerPartners"
};

var messageBody = `
  <html>
    <head><style>%cssStyle%</style></head>
    <body>
      <div id="main">
        <div id="text">
          <div id="sender-name">%name%</div>&nbsp;(<div id="sender-email">%email%</div>) %verbalAction%.
        </div>
        <div class="top-sep"></div>
        <div class="align-center">
          <a class="button" href="https://ricwtk.github.io/prayerpartners/" target="_blank">Go to PrayerPartners</a>
          %msgContent%
        </div>
        <div class="bottom-sep"></div>
        <div class="align-center">
          %aboutText%
        </div>
        <div id="id">PP</div>
        <div id="action" class="hide">%action%</div>
        <div id="hide" class="hide">%randomId%</div>
      </div>
    </body>
  </html>
`;