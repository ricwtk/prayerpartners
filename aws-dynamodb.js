function afterFbLogin() {

}

function afterFbLogout() {

}

function afterGoogleLogin() {

}

function afterGoogleLogout() {

}

function afterLogIn() {
  readItem();
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
      document.getElementById('textarea').innerHTML = "Unable to read item: " + "\n" + JSON.stringify(err,
        undefined, 2);
    } else {
      document.getElementById('textarea').innerHTML = "GetItem succeeded: " + "\n" + JSON.stringify(data,
        undefined, 2);
    }
  });
}