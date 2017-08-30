function readFromGmail() {
  var dateQuery;
  if (globalStore.savedData.lastEmailChecked == null) {
    dateQuery = '';
  } else {
    dateQuery = "after:" +
      globalStore.savedData.lastEmailChecked.getUTCFullYear() + "/" +
      globalStore.savedData.lastEmailChecked.getUTCMonth() + "/" +
      globalStore.savedData.lastEmailChecked.getUTCDate();
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
  // read for invites
  // read for accepts
  // read for updates
  // watch for invites, accepts, and updates
  // update lastEmailChecked, messagesAtLastChecked
}

function getMessageWithId(messageId) {
  return gapi.client.gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full"
  });
}

function extractRelevantMessages(resultArrays) {
  var relMsgs = resultArrays.filter((res) => {
    let headers = res.result.payload.headers;
    // headers['Received'] = from 885265693601 named unknown by gmailapi.google.com with HTTPREST; Tue, 22 Aug 2017 10:26:41 -0400
    // AND not in messageIdOnLastDay
    if (getHeader(headers, "Received").includes("885265693601")) {
      if (getHeader(headers, "To").includes(globalStore.savedData.mine.email)) {
        if (!globalStore.savedData.messageIdOnLastDay.includes(res.result.id)) {
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
    let updateContent = body.getElementById("update-content");
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
        content: (updateContent == null) ? null : updateContent.textContent
      }
    }
  });
  relMsgs = relMsgs.filter(msg => (msg !== null));

  return {
    invites: relMsgs.filter(msg => (msg.action == action.invite)),
    accepts: relMsgs.filter(msg => (msg.action == action.accept)),
    updates: relMsgs.filter(msg => (msg.action == action.update))
  }
  // read invites
  // read accepts
  // read updates
  // set up watch
}

function processMessages(messages) {
  // accepts > invites > updates
  let accepts = messages.accepts.filter(filterAccept).filter(uniqueFilter).map(msg => processAccept(msg));
  let invites = messages.invites.filter(filterInvite).map(msg => processInvite(msg));
  let updates = messages.updates.map(msg => processUpdate(msg));
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

function filterInvite(invite) {
  // check if friendRequest already saved in the friendRequest list or in the friend list
  // allow friendRequest if it exists in the friend list => use case: the other friend deleted the acceptance email before it's processed
  // (globalStore.savedData.friends.filter(fri => (fri.email == invite.sender.email)).length == 0)
  let friReq = globalStore.savedData.friendRequests.map(friR => friR.email);
  if (friReq.includes(invite.sender.email)) {
    return true;
  } else {
    return false;
  }
}

function processInvite(invite) {
  let friReq = newFriendRequest(invite.sender.name, invite.sender.email);
  globalStore.savedData.friendRequests.push(friReq);
  return friReq;
}

function filterAccept(accept) {
  // check if friendAccept already in friend list
  if (globalStore.savedData.friends.filter(fri => (fri.email == accept.sender.email)).length == 0) {
    return true;
  } else {
    return false;
  }
}

function processAccept(accept) {
  let friend = newFriend(accept.sender.name, accept.sender.email);
  globalStore.savedData.friends.push(friend);
  return friend;
}

function processUpdate(update) {

}

function setLastChecked() {

}

function displayBody(res) {
  console.log(res);
  // console.log(Base64.fromBase64(res.result.raw));
  console.log(getHeader(res.result.payload.headers, "To"));
  console.log(getHeader(res.result.payload.headers, "From"));
  console.log(new Date(getHeader(res.result.payload.headers, "Date")));
  console.log(getHeader(res.result.payload.headers, "Received"));
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