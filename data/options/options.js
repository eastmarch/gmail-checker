var background = (function () {
  var _tmp = {};
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    for (var id in _tmp) {
      if (_tmp[id] && (typeof _tmp[id] === "function")) {
        if (request.path == 'background-to-options') {
          if (request.method === id) _tmp[id](request.data);
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {_tmp[id] = callback},
    "send": function (id, data) {chrome.runtime.sendMessage({"path": 'options-to-background', "method": id, "data": data})}
  }
})();

var load = function () {
  background.send("load");
  window.removeEventListener("load", load, false);

  var main = document.getElementById("main");
  var number = document.getElementById("number");
  var interval = document.getElementById("interval");

  main.addEventListener("change", function (e) {background.send("store", {"main": e.target.value - 1})});
  number.addEventListener("change", function (e) {background.send("store", {"number": e.target.value})});
  interval.addEventListener("change", function (e) {background.send("store", {"interval": e.target.value})});
};

background.receive("load", function (e) {
  document.getElementById("main").value = e.main + 1;
  document.getElementById("number").value = e.number;
  document.getElementById("interval").value = e.interval;
});

window.addEventListener("load", load, false);

var reset = function () {
  background.send("store", {"main": 0});
  background.send("store", {"number": 1});
  background.send("store", {"interval": 10});
  load();
}

document.getElementById("btnreset").addEventListener("click", reset, false);