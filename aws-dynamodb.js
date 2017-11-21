function afterFbLogin() {
  if (DEBUG) console.log("afterFbLogin");
  // Add the Facebook access token to the Cognito credentials login map.
  let authResp = FB.getAuthResponse();
  AWS.config.credentials = new AWS.WebIdentityCredentials({
    RoleArn: 'arn:aws:iam::195032713377:role/UsersForPrayerPartnersFacebook',
    ProviderId: 'graph.facebook.com', // Omit this for Google
    WebIdentityToken: authResp.accessToken // Access token from identity provider
  });
  FB.api("/me", {
    fields: "id,email,name,link",
  },
    function (meResp) {
      if (meResp && !meResp.error) {
        if (DEBUG) console.log(meResp);
        FB.api("/me/picture", function (picResp) {
          if (DEBUG) console.log(picResp);
          globalStore.idpData = {
            idp: 'facebook',
            userId: 'fb_' + meResp.id,
            name: meResp.name,
            email: meResp.email || null,
            profilePicture: picResp.data.url,
            profileLink: meResp.link || null
          };
          afterLogIn();
          globalStore.fblogin = true;
        });
      }
    }
  );

}

function afterFbLogout() {
  globalStore.fblogin = false;
}

function afterGoogleLogin() {
  if (DEBUG) console.log("afterGoogleLogin");
  gapi.client.load('plus', 'v1', function () {
    let request = gapi.client.plus.people.get({
      'userId': 'me'
    });
    request.execute((meResp) => {
      new Promise((resolve, reject) => {
        if (DEBUG) console.log("Logged in as", meResp.displayName);
        globalStore.idpData = {
          idp: "google",
          userId: "g_" + meResp.id,
          name: meResp.displayName,
          email: meResp.emails[0].value,
          profilePicture: meResp.image.url,
          profileLink: meResp.url
        };
        let googleUser = gapi.auth2.getAuthInstance().currentUser.get();
        let authResp = googleUser.getAuthResponse();
        AWS.config.credentials = new AWS.WebIdentityCredentials({
          RoleArn: 'arn:aws:iam::195032713377:role/UsersForPrayerPartnersGoogle',
          WebIdentityToken: authResp['id_token'] // Access token from identity provider
        });
        globalStore.googlelogin = true;
        resolve(true);
      }).then(afterLogIn);
    });
  });
}

function afterGoogleLogout() {
  globalStore.googlelogin = false;
}

function afterLogIn() {
  new Promise((resolve, reject) => {
    // Obtain AWS credentials
    AWS.config.credentials.get(err => {
      if (err) {
        if (DEBUG) console.log(err);
        reject(err);
      }
    });
    resolve(true);
  }).then(readData, removeLoadingScreen);
}

function readData() {
  let table = USERDATATABLE;

  let params = {
    TableName: table,
    Key: {
      "userId": globalStore.idpData.userId + ""
    }
  };
  if (DEBUG) console.log(params);
  docClient = new AWS.DynamoDB.DocumentClient();
  docClient.get(params, function (err, data) {
    if (err) {
      if (DEBUG) console.log("Unable to read item: ", err);
      removeLoadingScreen(err);
    } else {
      if (DEBUG) console.log("GetItem succeeded: ", copyObj(data));
      if (Object.keys(data).length === 0 && data.constructor === Object) {
        createData();
        readData();
      } else {
        if (DEBUG) console.log(copyObj(data));
        globalStore.savedData = data.Item;
        // update name, email, profilePicture, profileLink from idp if changed
        let checkItems = ["name", "email", "profilePicture", "profileLink"];
        let detailChanged = false;
        checkItems.forEach((item) => {
          if (globalStore.savedData[item] != globalStore.idpData[item]) {
            globalStore.savedData[item] = globalStore.idpData[item];
            detailChanged = true;
          }
        });
        if (detailChanged) updateToDatabase(); // update database
        retrieveRequestsAcceptsUpdates();
      }
    }
  });
}

function createData() {
  let firsttimedata = newUserData(globalStore.idpData.idp, globalStore.idpData.userId, globalStore.idpData.name, globalStore.idpData.email, globalStore.idpData.profilePicture, globalStore.idpData.profileLink);
  firsttimedata.searchField = getSearchField(firsttimedata.name, firsttimedata.email);
  saveDataToTable(firsttimedata, USERDATATABLE);
}


function updateToDatabase() {
  saveDataToTable(copyObj(globalStore.savedData), USERDATATABLE);
}

function saveDataToTable(data, table) {
  let params = {
    TableName: table,
    Item: data
  };

  docClient.put(params, function (err, retdata) {
    if (err) {
      if (DEBUG) console.log("Unable to add item: ", err);
    } else {
      if (DEBUG) console.log("PutItem succeeded: ", retdata);
    }
  });
}

function searchUsers(queryStr, vueObj, resultVarStr) {
  if (DEBUG) console.log("beforefounddata", vueObj[resultVarStr]);
  let params = {
    TableName: USERDATATABLE,
    ProjectionExpression: [
      "userId",
      "email",
      "#name",
      "profileLink",
      "profilePicture",
      "searchField"
    ],
    FilterExpression: "contains(searchField, :name) and userId <> :myId",
    ExpressionAttributeNames: {
      "#name": "name"
    },
    ExpressionAttributeValues: {
      ":name": queryStr.toLowerCase(),
      ":myId": globalStore.savedData.userId
    },
  };
  docClient.scan(params, function (err, data) {
    if (err) {
      if (DEBUG) console.log(err);
      Vue.set(vueObj, resultVarStr, []);
    } else {
      Vue.set(vueObj, resultVarStr, data.Items);
    }
  });
}

function getUsers(userIds, afterGet) {
  let params = {
    RequestItems: {}
  };
  params.RequestItems[USERDATATABLE] = {
    ProjectionExpression: [
      "userId",
      "email",
      "#name",
      "profileLink",
      "profilePicture",
      "searchField"
    ],
    ExpressionAttributeNames: {
      "#name": "name"
    },
    Keys: userIds.map(uid => ({
      userId: uid
    }))
  };
  if (!afterGet) {
    afterGet = function (err, data) {
      if (DEBUG) console.log("getUser", err, data);
    };
  }
  docClient.batchGet(params, afterGet);
}

function sendRequest(toUserId) {
  if (DEBUG) console.log("sendRequest");
  let pprequest = {
    fromXToY: globalStore.savedData.userId + "_" + toUserId,
    to: toUserId,
    from: globalStore.savedData.userId
  };
  saveDataToTable(pprequest, USERREQUESTTABLE);
}

function sendAccept(toUserId) {
  if (DEBUG) console.log("sendAccept");
  let ppaccept = {
    fromXToY: globalStore.savedData.userId + "_" + toUserId,
    to: toUserId,
    from: globalStore.savedData.userId
  };
  saveDataToTable(ppaccept, USERACCEPTTABLE);
}

function updateAndSendSharedList(friendList) {
  if (DEBUG) console.log("updateAndSendSharedList", friendList);
  let namelist = globalStore.savedData.friends.filter(fr => friendList.includes(fr.userId)).map(fr => {
    let res = fr.name;
    if (fr.userId.startsWith("g")) {
      res += " <i class='fa fa-google-plus-official'></i> ";
    } else {
      res += " <i class='fa fa-facebook-official'></i> ";
    }
    return res;
  });
  showToast("send updates of shared items to " + namelist.join(", "));
  // loop through friendlist
  friendList.forEach(friend => {
    // extract items shared with the friend
    let items = globalStore.savedData.items.filter(item => item.sharedWith.includes(friend));
    // send items to the friend
    sendUpdates(friend, items);
  });

}

function sendUpdates(toUserId, updates) {
  if (DEBUG) console.log("sendUpdates");
  let ppupdates = {
    fromXToY: globalStore.savedData.userId + "_" + toUserId,
    from: globalStore.savedData.userId,
    to: toUserId,
    updates: updates.map(upd => {
      return {
        item: upd.item,
        itemId: upd.itemId,
        desc: upd.desc
      }
    })
  };
  saveDataToTable(ppupdates, USERUPDATESTABLE);
}

function retrieveRequestsAcceptsUpdates() {
  retrieveRequests();
}

function retrieveRequests() {
  retrieve(USERREQUESTTABLE, function (err, data) {
    if (DEBUG) console.log("retrieveRequests", err, data);
    if (err) {
      if (DEBUG) console.log(err);
      removeLoadingScreen(err);
    } else {
      let requestAdded = false;
      data.Items.forEach((item) => {
        let fr = newFriendRequest(item.from);
        if (globalStore.savedData.friendRequests.findIndex((fReq) => fReq.userId == fr.userId) == -1) {
          globalStore.savedData.friendRequests.push(fr);
          requestAdded = true;
        }
      });
      if (requestAdded) updateToDatabase();
      removeRequests(data.Items);
      retrieveAccepts();
    }
  });
}

function retrieveAccepts() {
  retrieve(USERACCEPTTABLE, function (err, data) {
    if (DEBUG) console.log("retrieveAccepts", err, data);
    if (err) {
      if (DEBUG) console.log(err);
      removeLoadingScreen(err);
    } else {
      let allFriendIds = globalStore.savedData.friends.map(fr => fr.userId);
      let friendToAdd = data.Items.filter(item => !allFriendIds.includes(item.from)).map(it => it.from);
      removeAccepts(data.Items);
      if (friendToAdd.length > 0) {
        getUsers(friendToAdd, (err, data) => {
          let acceptAdded = false;
          data.Responses[USERDATATABLE].forEach(user => {
            let fr = newFriend(user.userId, user.name);
            globalStore.savedData.friends.push(fr);
            acceptAdded = true;
          });
          if (acceptAdded) updateToDatabase();
          retrieveUpdates();
        });
      } else {
        retrieveUpdates();
      }
    }
  });
}

function retrieveUpdates() {
  retrieve(USERUPDATESTABLE, function (err, data) {
    if (DEBUG) console.log("retrieveUpdates", err, data);
    if (err) {
      if (DEBUG) console.log(err);
      removeLoadingScreen(err);
    } else {
      data.Items.map(updates => {
        let friend = globalStore.savedData.friends.find(fr => fr.userId == updates.from);
        if (friend !== undefined) {
          // remove items with itemId not existed in the update items
          let allIds = updates.updates.map(update => update.itemId);
          friend.items = friend.items.filter(item => allIds.includes(item.itemId) || item.owner == "mine");
          // edit items with matching itemId
          friend.items.forEach(item => {
            if (item.owner != "mine") {
              let newItem = updates.updates.find(it => it.itemId == item.itemId);
              item.item = newItem.item;
              item.desc = newItem.desc;
            }
          });
          // clean orders
          friend.items.sort(function (a, b) {
            return a.order - b.order;
          });
          friend.items.forEach((it, idx, arr) => {
            it.order = idx;
          });
          // add items with no matching itemId
          let idsInFriendItems = friend.items.filter(item => item.owner != "mine").map(item => item.itemId);
          let thisOrder = friend.items.length;
          updates.updates
            .filter(item => !idsInFriendItems.includes(item.itemId))
            .forEach(item => {
              idsInFriendItems = friend.items.filter(item => item.owner != "mine").map(item => item.itemId);
              friend.items.push(newFriendItem(item.itemId, item.item, item.desc, "friend", thisOrder));
              thisOrder += 1;
            });
          updateToDatabase();
        }
      });
      removeUpdates(data.Items);
      removeLoadingScreen();
    }
  });
}

function retrieve(table, afterRetrieve) {
  let params = {
    TableName: table,
    IndexName: "to-index",
    KeyConditionExpression: "#to = :me",
    ExpressionAttributeNames: {
      "#to": "to"
    },
    ExpressionAttributeValues: {
      ":me": globalStore.savedData.userId
    },
  };
  if (!afterRetrieve) {
    afterRetrieve = function (err, data) {
      if (DEBUG) console.log(table, err, data);
    };
  }
  docClient.query(params, afterRetrieve);
}

function removeRequests(requests) {
  requests.map((req) => {
    remove(USERREQUESTTABLE, req.fromXToY, (err, data) => {
      if (err) {
        if (DEBUG) console.log(err);
      } else {
        if (DEBUG) console.log("Request deleted", data);
      }
    });
  });
}

function removeAccepts(accepts) {
  accepts.map((acpt) => {
    remove(USERACCEPTTABLE, acpt.fromXToY, (err, data) => {
      if (err) {
        if (DEBUG) console.log(err);
      } else {
        if (DEBUG) console.log("Accept deleted", data);
      }
    });
  });
}

function removeUpdates(updates) {
  updates.map((updt) => {
    remove(USERUPDATESTABLE, updt.fromXToY, (err, data) => {
      if (err) {
        if (DEBUG) console.log(err);
      } else {
        if (DEBUG) console.log("Update deleted", data);
      }
    });
  });
}

function remove(table, primaryKey, afterDelete) {
  let params = {
    TableName: table,
    Key: {
      fromXToY: primaryKey
    }
  };
  if (!afterDelete) {
    afterDelete = function (err, data) {
      if (DEBUG) console.log(err, data);
    }
  }
  docClient.delete(params, afterDelete);
}