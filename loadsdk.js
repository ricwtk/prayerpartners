// facebook
window.fbAsyncInit = function () {
  if (DEBUG) console.log("FB.init");
  FB.init({
    appId: '280921122406136',
    cookie: true,
    xfbml: true,
    version: 'v2.10',
  });
  FB.AppEvents.logPageView();
  // attach status listeners
  FB.Event.subscribe("auth.statusChange", resp => {
    if (resp.status != "connected") {
      if (DEBUG) console.log("fb account is logged out");
      afterFbLogout();
    } else {
      if (DEBUG) console.log("fb account is logged in");
      afterFbLogin();
    }
  });
};

(function (d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {
    return;
  }
  js = d.createElement(s);
  js.id = id;
  js.src = "//connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

// google
function initGoogleApi() {
  if (DEBUG) console.log("initGoogleApi");
  gapi.load('client:auth2', function () {
    gapi.auth2.init({
      client_id: '885265693601-q38bh4n7s7rdrv6lpn4qbb6sbt065pum.apps.googleusercontent.com',
    });

    // attach status listeners
    gapi.auth2.getAuthInstance().isSignedIn.listen(signInStatus => {
      if (DEBUG) console.log("signInStatus", signInStatus);
      if (signInStatus) {
        if (DEBUG) console.log("google account is logged in");
        afterGoogleLogin();
      } else {
        if (DEBUG) console.log("google account is logged out");
        afterGoogleLogout();
      }
    });
  });
}