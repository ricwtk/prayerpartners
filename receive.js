function readFromGmail() {
  showDebug(["readFromGmail"]);
  showToast("access inbox");
  var dateQuery;
  if (globalStore.savedData.lastDateChecked == null) {
    dateQuery = '';
  } else {
    showDebug(["readFromGmail", typeof globalStore.savedData.lastDateChecked]);
    dateQuery = "after:" +
      globalStore.savedData.lastDateChecked.getUTCFullYear() + "/" +
      globalStore.savedData.lastDateChecked.getUTCMonth() + "/" +
      globalStore.savedData.lastDateChecked.getUTCDate();
  }
  return gapi.client.gmail.users.messages.list({
    "userId": "me",
    "q": ["subject:PrayerPartners", dateQuery].join(" "),
    "format": "full"
  }).then((res) => {
    return new Promise((resolve, reject) => {
      if (res.result.resultSizeEstimate == 0) {
        reject("No result");
      } else {
        resolve(Promise.all(res.result.messages.map(msg => getMessageWithId(msg.id))));
      }
    });
  });
}

function getMessageWithId(messageId) {
  return gapi.client.gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full"
  });
}

function extractRelevantMessages(resultArrays) {
  showDebug(["extractRelevantMessages", resultArrays]);
  var relMsgs = resultArrays.filter((res) => {
    let headers = res.result.payload.headers;
    // headers['Received'] = from 885265693601 named unknown by gmailapi.google.com with HTTPREST; Tue, 22 Aug 2017 10:26:41 -0400
    // AND later than internalDate
    if (getHeader(headers, "Received").includes("885265693601")) {
      if (getHeader(headers, "To").includes(globalStore.savedData.mine.email)) {
        if (res.result.internalDate > globalStore.savedData.lastInternalDateChecked) {
          return true;
        }
      }
    }
    return false;
  });

  relMsgs = relMsgs.map(msg => {
    let parser = new DOMParser();
    let body = parser.parseFromString(getBody(msg.result.payload), "text/html");
    // showDebug(["extractRelevantMessages"]);
    let action = body.getElementById("action");
    let senderName = body.getElementById("sender-name");
    let senderEmail = body.getElementById("sender-email");
    let updateContent = body.getElementById("update-items");
    // showDebug([action, senderName, senderEmail, updateContent]);
    if ([action, senderName, senderName].indexOf(null) > -1) {
      return null;
    } else {
      return {
        id: msg.result.id,
        action: action.textContent,
        sender: {
          name: senderName.textContent,
          email: senderEmail.textContent
        },
        date: new Date(getHeader(msg.result.payload.headers, "Date")),
        internalDate: msg.result.internalDate,
        content: (updateContent == null) ? null : updateContent
      }
    }
  });
  relMsgs = relMsgs.filter(msg => (msg !== null));

  return {
    invites: relMsgs.filter(msg => (msg.action == action.invite)),
    accepts: relMsgs.filter(msg => (msg.action == action.accept)),
    updates: relMsgs.filter(msg => (msg.action == action.update))
  }
  // set up watch
}

function processMessages(messages) {
  showDebug(["processMessages", messages]);
  // accepts > invites > updates
  let accepts = messages.accepts.filter(uniqueFilter).map(msg => processAccept(msg));
  let invites = messages.invites.filter(uniqueFilter).map(msg => processInvite(msg));
  let updates = (messages.updates.length == 0) ? messages.updates : extractUpdates(messages.updates).map(msg => processUpdate(msg));
  // extract dates from accepts, invites, and updates
  function getDates(el) {
    return {
      date: el.date,
      internalDate: Number(el.internalDate)
    };
  }
  let allDates = [];
  allDates = (accepts.length == 0) ? allDates : allDates.concat(accepts.map(getDates));
  allDates = (invites.length == 0) ? allDates : allDates.concat(invites.map(getDates));
  allDates = (updates.length == 0) ? allDates : allDates.concat(updates.map(getDates));
  if (allDates.length !== 0) {
    // sort allDates to get the latest date
    allDates.sort((a, b) => {
      return b.date - a.date;
    })
    // save latest date as lastdatechecked (allDates[0])
    globalStore.savedData.lastDateChecked = allDates[0].date;
    // save latest internaldate as lastinternaldatechecked
    globalStore.savedData.lastInternalDateChecked = allDates[0].internalDate;
  }
  updateToDatabase();
  return {
    invites: invites,
    accepts: accepts,
    updates: updates
  };
}

function uniqueFilter(el, idx, arr) {
  if (arr.findIndex(a => (a.sender.email == el.sender.email)) == idx) {
    return true;
  } else {
    return false;
  }
}

function genericUniqueFilter(el, idx, arr) {
  if (arr.findIndex(a => (a == el)) == idx) {
    return true;
  } else {
    return false;
  }
}

function processInvite(invite) {
  showDebug(["processInvite", invite]);
  showToast("process invites");
  let friReq = globalStore.savedData.friendRequests.map(friR => friR.email);
  if (!friReq.includes(invite.sender.email)) {
    addFriendRequest(invite.sender.name, invite.sender.email);
  }
  return invite;
}

function processAccept(accept) {
  showDebug(["processAccept", accept]);
  showToast("process accepts");
  // if not in friend list, add to friend list
  let friends = globalStore.savedData.friends.map(fri => fri.email);
  if (!friends.includes(accept.sender.email)) {
    addNewFriend(accept.sender.name, accept.sender.email);
  }
  // if in friend request list, remove from friend request list
  let friRequests = globalStore.savedData.friendRequests.map(friReq => friReq.email);
  if (friRequests.includes(accept.sender.email)) {
    removeFriendRequest(accept.sender.email);
  }
  return accept;
}

function extractUpdates(updates) {
  showDebug(["extractUpdates", updates]);
  let senders = updates.map(update => update.sender.email).filter(genericUniqueFilter);
  // discard if not in friends list
  let friends = globalStore.savedData.friends.filter(friend => friend.email !== null).map(friend => friend.email);
  senders = senders.filter(sender => friends.includes(sender));
  let newUpdates = [];
  senders.forEach(sender => {
    // get email with latest date
    let updatesFromSender = updates.filter(update => update.sender.email == sender);
    updatesFromSender.sort((a, b) => {
      return b.date - a.date;
    });
    newUpdates.push(updatesFromSender[0]);
  });
  return newUpdates;
}

function processUpdate(update) {
  showDebug(["processUpdate", update])
  showToast("process updates");
  // find item with matching itemId
  let friend = globalStore.savedData.friends.find(fri => (fri.email == update.sender.email));
  if (friend !== undefined) {
    // if update.content is null, i.e. no items, remove all items
    if (update.content == null) {
      friend.items = [];
    } else {
      // process DOM
      let items = Array.from(update.content.getElementsByClassName("single-item"));
      items = items.map(item => {
        return {
          id: item.getElementsByClassName("item-id")[0].textContent,
          header: item.getElementsByClassName("item-header")[0].textContent,
          content: item.getElementsByClassName("item-content")[0].textContent
        };
      });
      // remove items with itemId not existed in the update items
      let allIds = items.map(item => item.id);
      friend.items = friend.items.filter(item => allIds.includes(item.id));
      // edit items with matching itemId
      friend.items.forEach(item => {
        let newItem = items.find(it => it.id == item.itemId);
        item.item = newItem.header;
        item.desc = newItem.content;
      });
      // add items with no matching itemId
      let idsInFriendItems = friend.items.map(item => item.itemId);
      items
        .filter(item => !idsInFriendItems.includes(item.id))
        .forEach(item => {
          idsInFriendItems = friend.items.map(item => item.itemId);
          friend.items.push(newFriendItem(item.id, item.header, item.content, "friend"));
        });
      showDebug(["processUpdate", "updated items", friend.email, copyObj(friend.items)]);
    }
  }
  return update;
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
  if (typeof message.parts === 'undefined') {
    encodedBody = message.body.data;
  } else {
    encodedBody = getHTMLPart(message.parts);
  }
  // encodedBody = encodedBody.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
  // return decodeURIComponent(escape(window.atob(encodedBody)));
  return Base64.fromBase64(encodedBody);
}

function getHTMLPart(arr) {
  for (var x = 0; x <= arr.length; x++) {
    if (typeof arr[x].parts === 'undefined') {
      if (arr[x].mimeType === 'text/html') {
        return arr[x].body.data;
      }
    } else {
      return getHTMLPart(arr[x].parts);
    }
  }
  return '';
}