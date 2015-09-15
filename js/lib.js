function request (uri, json) {

  var promise = new Promise(function (resolve, reject) {

    // @LINK: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise
    var xhr = new XMLHttpRequest();
    xhr.open('POST', uri);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(json));
    xhr.onload = function () {

      var json;

      if (this.status === 200) {
        json = JSON.parse(this.response);
        resolve(json);
      } else {
        reject(this.statusText);
      }
    };
    xhr.onerror = function () {
      reject(this.statusText);
    };
  });

  return promise;
}

//export request;
var lib = {};
lib.request = request;
