function afterFbLogin() {
  console.log("afterFbLogin");
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
        console.log(meResp);
        FB.api("/me/picture", function (picResp) {
          console.log(picResp);
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
  console.log("afterGoogleLogin");
  gapi.client.load('plus', 'v1', function () {
    let request = gapi.client.plus.people.get({
      'userId': 'me'
    });
    request.execute((meResp) => {
      new Promise((resolve, reject) => {
        console.log("Logged in as", meResp.displayName);
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
        console.log(err);
        reject(err);
      }
    });
    resolve(true);
  }).then(readData, console.log);
}

function readData() {
  let table = USERDATATABLE;

  let params = {
    TableName: table,
    Key: {
      "userId": globalStore.idpData.userId + ""
    }
  };
  console.log(params);
  docClient = new AWS.DynamoDB.DocumentClient();
  docClient.get(params, function (err, data) {
    if (err) {
      console.log("Unable to read item: ", err);
    } else {
      console.log("GetItem succeeded: ", copyObj(data));
      if (Object.keys(data).length === 0 && data.constructor === Object) {
        createData();
        readData();
      } else {
        console.log(copyObj(data));
        globalStore.savedData = data.Item;
        // save data to globalStore
        // update name, email, profilePicture from idp if changed
        // update database
        retrieveRequests();
        retrieveAccepts();
        retrieveUpdates();
      }
    }
  });
}

function createData() {
  // create user personal data
  // create user public data
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
      console.log("Unable to add item: ", err);
    } else {
      console.log("PutItem succeeded: ", retdata);
    }
  });
}

function searchUsers(queryStr, vueObj, resultVarStr) {
  console.log("beforefounddata", vueObj[resultVarStr]);
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
    FilterExpression: "contains(searchField, :name)",
    ExpressionAttributeNames: {
      "#name": "name"
    },
    ExpressionAttributeValues: {
      ":name": queryStr.toLowerCase()
    },
  };
  docClient.scan(params, function (err, data) {
    if (err) {
      console.log(err);
      Vue.set(vueObj, resultVarStr, []);
    } else {
      Vue.set(vueObj, resultVarStr, data.Items);
    }
  });
}

function sendRequest(toUserId) {
  console.log("sendRequest");
  let pprequest = {
    fromXToY: globalStore.savedData.userId + "_" + toUserId,
    to: toUserId,
    from: globalStore.savedData.userId
  };
  saveDataToTable(pprequest, USERREQUESTTABLE);
  // sendNotification(toUserId, "request", "na");
}

function sendAccept(toUserId) {
  console.log("sendAccept");
  let ppaccept = {
    fromXToY: globalStore.savedData.userId + "_" + toUserId,
    to: toUserId
  };
  saveDataToTable(ppaccept, USERACCEPTTABLE);
  // sendNotification(toUserId, "accept", "na");
}

function sendUpdates(toUserId, updates) {
  console.log("sendUpdates");
  let ppupdates = {
    fromXToY: globalStore.savedData.userId + "_" + toUserId,
    to: toUserId,
    updates: updates
  };
  saveDataToTable(ppupdates, USERUPDATESTABLE);
  // sendNotification(toUserId, "update", updates);
}

function retrieveRequests() {
  retrieve(USERREQUESTTABLE);
}

function retrieveAccepts() {
  retrieve(USERACCEPTTABLE);
}

function retrieveUpdates() {
  retrieve(USERUPDATESTABLE);
}

function retrieve(table) {
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
  docClient.query(params, function (err, data) {
    console.log(table, err, data);
  });
}