var loginStatus = {
  facebook: {
    checked: false,
    status: false
  },
  google: {
    checked: false,
    status: false
  }
}

window.onload = function () {
  initAWS();
  initGoogleApi();

  // check if facebook is logged in
  var dblcheckFbLogin = function () {
    if (!loginStatus.facebook.checked) {
      console.log("delayed check");
      setTimeout(dblcheckFbLogin, 3000);
      checkFbLogin();
    }
  };
  var checkFbLogin = function () {
    FB.getLoginStatus(function (response) {
      console.log("facebook log in status:", response.status, response);
      if (response.status === 'connected') {
        loginStatus.facebook.status = true;
      } else if (response.status === 'not_authorized') {} else {}
      loginStatus.facebook.checked = true;
    });
  };
  setTimeout(dblcheckFbLogin, 3000);
  checkFbLogin();

  // check if google is logged in
  var checkGoogle = function () {
    if (!gapi.auth2) {
      setTimeout(checkGoogle, 10);
    } else {
      authInst = gapi.auth2.getAuthInstance();
      console.log("google log in status:", authInst.isSignedIn.get(), authInst.currentUser.get());
      loginStatus.google.status = authInst.isSignedIn.get();
      console.log(loginStatus.google.status);
      loginStatus.google.checked = true;
    }
  };
  checkGoogle();

  // check if both account options are checked
  var checkIfFinished = function () {
    if (!loginStatus.google.checked || !loginStatus.facebook.checked) {
      setTimeout(checkIfFinished, 10);
    } else {
      actOnStatus();
    }
  }
  checkIfFinished();
}


function actOnStatus() {
  if (loginStatus.facebook.status) {
    // afterFbLogin();
  } else if (loginStatus.google.status) {
    afterGoogleLogin();
  } else {
    removeLoadingScreen();
  }
}

function removeLoadingScreen(msg) {
  globalStore.showLoading = false;
  if (msg) console.log(msg);
  if (DEBUG) console.log("close loading screen");
}