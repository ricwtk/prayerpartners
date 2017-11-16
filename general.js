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

function showToast(toastString) {
  globalStore.toastMessage = toastString;
  globalStore.initToast = true;
}

function copyObj(object) {
  return JSON.parse(JSON.stringify(object));
}

// id generator
function generateId(blacklistId, prefix, suffix) {
  prefix = prefix || "";
  suffix = suffix || "";
  var idChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var idLength = 10;
  do {
    var idResult = '';
    for (var i = idLength; i > 0; --i) idResult += idChars[Math.floor(Math.random() * idChars.length)];
    idResult = prefix + idResult + suffix;
  } while (blacklistId.includes(idResult))
  return idResult;
}

function chainError(err) {
  return Promise.reject(err);
}

function finalError(err) {
  showDebug([err]);
}

function logAndForward(obj) {
  showDebug(["logAndForward", obj]);
  return obj
}

function removeFriendRequest(email) {
  showDebug(["removeFriendRequest", email]);
  let idx = globalStore.savedData.friendRequests.findIndex(friReq => friReq.email == email);
  return globalStore.savedData.friendRequests.splice(idx, 1)[0];
}

function addToFriend(id, name) {
  showDebug(["addToFriend", id, name]);
  let friend = newFriend(id, name);
  globalStore.savedData.friends.push(friend);
}

function acceptFriendRequest(email) {
  showDebug(["acceptFriendRequest", email]);
  let friReq = removeFriendRequest(email);
  let allFriends = globalStore.savedData.friends.map(friend => friend.email);
  if (!allFriends.includes(friReq.email)) {
    addToFriend(friReq.name, friReq.email);
  }
  showToast("added " + email + " as friend");
}

function addNewFriend(name, email) {
  showDebug(["addNewFriend", name, email]);
  let friend = newFriend(name, email);
  globalStore.savedData.friends.push(friend);
  return friend;
}

function addFriendRequest(name, email) {
  showDebug(["addFriendRequest", name, email]);
  let friReq = newFriendRequest(name, email);
  globalStore.savedData.friendRequests.push(friReq);
  return friReq;
}

function getSearchField(name, email) {
  let sf = "";
  if (name) sf += name.toLowerCase() + " ";
  if (email) sf += email.toLowerCase();
  return sf;
}

function limitStr(string, number) {
  if (string.length <= number) {
    return string;
  } else {
    return string.substring(0, number) + "...";
  }
}