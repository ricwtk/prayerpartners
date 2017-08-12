"use strict";
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

// google account authentication
function authenticateGoogle() {

}

// read from saved data
function readSaved() {

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

// init function
function initSystem() {

}



initSystem();