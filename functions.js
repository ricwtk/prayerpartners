"use strict";
// const GOOGLE = {
//   CLIENT_ID: 
// }

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

// google account authentication
function authenticateGoogle() {

}

// read from saved data
function readSaved() {
  // read from saved data, if no saved data, load default
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

// init function
function initSystem() {
  // read from google account
  if (data == null) {
    firstTimeLogIn();
  }

}



initSystem();