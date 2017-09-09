const DEBUG = true;

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

// var threadId = 

var defaultData = {
  lastDateChecked: null,
  lastInternalDateChecked: null,
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

function newFriendRequest(name, email) {
  return {
    name: name,
    email: email,
    rejected: false
  }
}

function newFriend(name, email) {
  return {
    friendId: generateId(globalStore.savedData.friends.map(friend => friend.friendId)),
    name: name,
    email: email,
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
      </div>
    </body>
  </html>
`;