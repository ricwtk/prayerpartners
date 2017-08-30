// display if debug
function showDebug(debugString) {
  if (DEBUG) {
    try {
      console.log(...debugString);
    } catch (e) {
      console.log(debugString);
    }
  }
}

function copyObj(object) {
  return JSON.parse(JSON.stringify(object));
}

// id generator
function generateId(blacklistId) {
  var idChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var idLength = 10;
  do {
    var idResult = '';
    for (var i = idLength; i > 0; --i) idResult += idChars[Math.floor(Math.random() * idChars.length)];
  } while (blacklistId.includes(idResult))
  return idResult;
}

function chainError(err) {
  return Promise.reject(err);
}

function finalError(err) {
  showDebug([err]);
}

function logAndForward(obj) {
  showDebug([obj]);
  return obj
}