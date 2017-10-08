// global
var dynamodb, docClient;

function initAWS() {
  console.log("initAWS");
  AWS.config.region = 'us-east-1';
  // AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  //   IdentityPoolId: 'us-east-1:455a20ab-254e-4738-8e6c-cfdcaf54dc79',
  // });
  // dynamodb = new AWS.DynamoDB();
  // docClient = new AWS.DynamoDB.DocumentClient();
}

// facebook
function fblogin() {
  FB.login(function (response) {
    // Check if the user logged in successfully.
    if (response.authResponse) {} else {
      console.log('There was a problem logging you in.');
    }
  }, {
    scope: 'email',
    return_scopes: true,
  });
}

function fblogout() {
  FB.getLoginStatus(function (response) {
    if (response.status === 'connected') {
      var uid = response.authResponse.userID;
      var accessToken = response.authResponse.accessToken;
      FB.api('/' + uid + '/permissions', 'delete', function (response) {
        if (response.success) {} else {}
      });
      setTimeout(fblogout, 10);
    } else if (response.status === 'not_authorized') {} else {}
  });
}


// google
function googlelogin() {
  let authInst = gapi.auth2.getAuthInstance();
  authInst.signIn({
    scope: "profile email"
  }).then(googleUser => {}, error => {
    console.log(error)
  });
}

function googlelogout() {
  let authInst = gapi.auth2.getAuthInstance();
  if (authInst.isSignedIn.get()) {
    authInst.signOut().then(resp => {
      // console.log("Google account is logged out");
    }, error => {
      console.log(err);
    });
  }
}

// combined
function logout() {
  fblogout();
  googlelogout();
}