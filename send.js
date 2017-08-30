function genContent(act, sharedItems) {
  if (sharedItems.length > 0 && act == action.update) {
    return "<div class=\"mid-sep\"></div>\n" +
      sharedItems.map(item => {
        return "<div class=\"item-id hide\">" + item.itemId + "</div>\n" +
          "<div class=\"item-header\">" + item.item + "</div>\n" +
          "<div class=\"item-content\">" + item.desc + "</div>";
      }).join();
  } else {
    return "";
  }
}

function generateMessage(act, sendTo, sharedItems = []) {
  var newMsg = newMessageData();
  newMsg.to.push(sendTo);
  newMsg.subject = messageSubject[act];
  newMsg.body = messageBody
    .replace("%name%", globalStore.savedData.mine.name)
    .replace("%email%", globalStore.savedData.mine.email)
    .replace("%cssStyle%", cssStyle)
    .replace("%aboutText%", aboutText)
    .replace("%verbalAction%", verbalAction[act])
    .replace("%action%", action[act])
    .replace("%msgContent%", genContent(act, sharedItems));
  showDebug(["generateMessage", newMsg]);

  if (MimeMessage.validMimeMessage(newMsg)) {
    showDebug(["generateMessage", "validMimeMessage"]);
    const message = MimeMessage.createMimeMessage(newMsg);
    const base64SafeString = message.toBase64SafeString();

    // console.log(Base64.fromBase64(base64SafeString));
    return base64SafeString;
  } else {
    showDebug(["generateMessage", "invalidMimeMessage"]);
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

function sendUpdate(sendTo, updates) {
  return gapi.client.gmail.users.messages.send({
    'userId': 'me',
    'resource': {
      'raw': generateMessage(action.update, sendTo, updates)
    }
  });
}

function attemptInvite(inviteEmail) {
  // if in friends list, return and notify. do not send invite
  let friendEmailList = globalStore.savedData.friends.map(friend => friend.email);
  if (friendEmailList.includes(inviteEmail)) {
    return {
      error: true,
      debugMsg: inviteEmail + " is in existing friend list"
    };
  }
  // else, if in friend requests list, send accept email, remove friend request, add to friends list
  let friendRequestList = globalStore.savedData.friendRequests.map(friReq => friReq.email);
  if (friendRequestList.includes(inviteEmail)) {

  }
  // else, send invite email

}

function updateAndSendSharedList(friendList) {
  showDebug(["updateAndSendSharedList", friendList]);
  // loop through friendlist
  friendList.forEach(friend => {
    // extract items shared with the friend
    let items = globalStore.savedData.mine.items.filter(item => item.sharedWith.includes(friend));
    // send items to the friend
    sendUpdate(friend, items).then(() => {
      showDebug(["updateAndSendSharedList", "Sent updated shared list to " + friend]);
    }, finalError);
  });

}