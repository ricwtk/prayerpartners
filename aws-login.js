// global
var dynamodb, docClient;

function initAWS() {
  console.log("initAWS");
  AWS.config.region = 'us-east-1';
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:455a20ab-254e-4738-8e6c-cfdcaf54dc79',
  });
  dynamodb = new AWS.DynamoDB();
  docClient = new AWS.DynamoDB.DocumentClient();
}

// facebook
function fblogin() {
  FB.login(function (response) {
    // Check if the user logged in successfully.
    if (response.authResponse) {
      console.log('You are now logged in.');
      console.log(response.authResponse.userID); // unique id
      // Add the Facebook access token to the Cognito credentials login map.
      AWS.config.credentials.params.Logins = {};
      AWS.config.credentials.params.Logins['graph.facebook.com'] = response.authResponse.accessToken;
      // Obtain AWS credentials
      AWS.config.credentials.get(errorFcn);
      afterLogIn();
    } else {
      console.log('There was a problem logging you in.');
    }
  });
}

function fblogout() {
  FB.getLoginStatus(function (response) {
    if (response.status === 'connected') {
      var uid = response.authResponse.userID;
      var accessToken = response.authResponse.accessToken;
      FB.api('/' + uid + '/permissions', 'delete', function (response) {
        if (response.success) {
          console.log("Facebook account is logged out of app");
        } else {
          console.log("Facebook account is not logged out of app");
        }
      });
    } else if (response.status === 'not_authorized') {} else {}
  });
}


// google
function googlelogin() {
  let authInst = gapi.auth2.getAuthInstance();
  authInst.signIn({
    scope: "profile email"
  }).then(googleUser => {
    console.log(googleUser.getBasicProfile().getName());
    console.log(googleUser.getAuthResponse());
    console.log(googleUser.getId()); // unique id
    let authResult = googleUser.getAuthResponse();
    AWS.config.credentials.params.Logins = {};
    AWS.config.credentials.params.Logins['accounts.google.com'] = authResult['id_token'];
    // Obtain AWS credentials
    AWS.config.credentials.get(errorFcn);
    afterLogIn();
  }, error => {
    console.log(error)
  });
}

function googlelogout() {
  let authInst = gapi.auth2.getAuthInstance();
  if (authInst.isSignedIn.get()) {
    console.log(authInst.signOut().then(resp => {
      console.log("Google account is logged out");
    }, error => {
      console.log("Google account is not logged out. Error:", error);
    }));
  }
}