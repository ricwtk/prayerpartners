function afterFbLogin() {
  new Promise((resolve, reject) => {
    console.log("afterFbLogin");
    // Add the Facebook access token to the Cognito credentials login map.
    AWS.config.credentials.params.Logins = {};
    AWS.config.credentials.params.Logins['graph.facebook.com'] = FB.getAuthResponse().accessToken;
    globalStore.fblogin = true;
    resolve(true);
  }).then(afterLogIn);
}

function afterFbLogout() {
  globalStore.fblogin = false;
}

function afterGoogleLogin() {
  new Promise((resolve, reject) => {
    console.log("afterGoogleLogin");
    let googleUser = gapi.auth2.getAuthInstance().currentUser.get();
    let profile = googleUser.getBasicProfile();
    console.log("Logged in as", profile.getEmail());
    let authResp = googleUser.getAuthResponse();
    AWS.config.credentials.params.Logins = {};
    AWS.config.credentials.params.Logins['accounts.google.com'] = authResp['id_token'];
    globalStore.googlelogin = true;
    resolve(true);
  }).then(afterLogIn);
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
  }).then(readItem, console.log);
}

function readItem() {
  var table = "Movies";
  var year = 2015;
  var title = "The Big New Movie";

  var params = {
    TableName: table,
    Key: {
      "year": year,
      "title": title
    }
  };
  docClient.get(params, function (err, data) {
    if (err) {
      console.log("Unable to read item: " + "\n" + JSON.stringify(err, undefined, 2));
    } else {
      console.log("GetItem succeeded: " + "\n" + JSON.stringify(data, undefined, 2));
    }
  });
}