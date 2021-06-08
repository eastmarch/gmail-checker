var core = {
  "start": function () {core.load()},
  "install": function () {core.load()},
  "load": function () {
    core.alarms("alarm-check", 3000);
  },
  "error": function () {
    app.button.badge(null, '');
    app.button.title("Gmail Checker\nNot logged in to Gmail");
  },
  "alarms": function (name, when) {
    app.alarms.clear(name, function () {
      app.alarms.create(name, {
        "when": Date.now() + when,
        "periodInMinutes": config.checker.interval
      });
    });
  },
  "update": function () {
    var badge = '';
    var count = 0;
    var title = 'Unread emails:';
    var accounts = Object.keys(config.checker.count);
    if (accounts.length == 1) {
      var id = accounts[0];
      count = config.checker.count[id];
      if (count > 0) {
        title = title + '\n🢒 ' + id;
        badge = count.toString();
      } else {
        title = title + '\n🢒 ' + id + ', ' + count;
        badge = '';
      }
    }
    if (accounts.length > 1) {
      for (var id in config.checker.count) {
        count = config.checker.count[id] + count;
        title = title + '\n🢒 ' + id + ', ' + config.checker.count[id];
      }
      if (count > 0) {
        title = title + '\n🢒 In total';
        badge = count.toString();
      } else {
        badge = '';
      }
    }
    //Chromium inserts the badge number into the tooltip without asking
    app.button.title(title);
    app.button.badge(null, badge);
  },
  "check": async function () {
    if (config.checker.number) {
      for (var i = 0; i < config.checker.number; i++) {
        await new Promise(function (resolve, reject) {
          var tmp = "https://mail.google.com/mail/u/" + i + "/feed/atom";
          var url = tmp + '?rand=' + Math.round(Math.random() * 100000000);
          /*  */
          app.request.make(url, "GET", "text", null, function (response) {
            if (response) {
              var parser = new window.DOMParser();
              var feed = parser.parseFromString(response, "text/xml");
              if (feed) {
                var title = feed.querySelector("title");
                if (title) {
                  var link = feed.querySelector("link");
                  var href = link ? link.getAttribute("href") : '';
                  var fullcount = feed.querySelector("fullcount").textContent;
                  var email = title.textContent.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi)[0];
                  /*  */
                  if (href) config.checker.href[href] = parseInt(fullcount);
                  if (email) config.checker.count[email] = parseInt(fullcount);
                  /*  */
                  core.update();
                } else {
                  core.error();
                }
              } else {
                core.error();
              }
            } else {
              core.error();
            }
            /*  */
            window.setTimeout(resolve, 300);
          });
        });
      }
    }
  }
};

app.options.receive("store", function (e) {
  for (var id in e) {
    config.checker[id] = parseInt(e[id]);
  }
  /*  */
  core.alarms("alarm-check", 7000);
});

app.options.receive("load", function () {
  app.options.send("load", {
    "main": config.checker.main,
    "number": config.checker.number,
    "interval": config.checker.interval
  });
});

app.tab.on.updated(function (tabId, changeInfo, tab) {
  //tab.url is only available for the domains specified in the manifest
  if (tab.url && tab.url.includes("mail.google.") && tab.url.endsWith("#inbox")) {
    if (changeInfo.status === "complete" || changeInfo.title) {
      core.alarms("alarm-check", 7000);
    }
  }
});

app.button.on.clicked(function () {
  app.tab.query.all(function (tabs) {
    var key = "mail/u/" + config.checker.main + '/';
    for (var t in tabs) {
      var url = tabs[t].url || '';
      if (url.includes(key)) {
        return app.tab.activate(tabs[t].id, tabs[t].windowId);
      }
    }
    app.tab.open("https://mail.google.com/" + key);
  });
  /*  */
  core.alarms("alarm-check", 300);
});

app.button.context("Check right now", function () {
  core.alarms("alarm-check", 300);
});

app.on.message(function (request, sender) {
  if (request) {
    if (request.path === "options-to-background") {
      for (var id in app.options.message) {
        if (app.options.message[id]) {
          if ((typeof app.options.message[id]) === "function") {
            if (id === request.method) {
              app.options.message[id](request.data);
            }
          }
        }
      }
    }
  }
});

app.on.startup(core.start);
app.on.installed(core.install);
app.alarms.on.alarm(core.check);
