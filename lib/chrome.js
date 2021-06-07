var app = {};

app.options = {
  "message": {},
  "receive": function (id, callback) {
    app.options.message[id] = callback;
  },
  "send": function (id, data) {
    chrome.runtime.sendMessage({
      "data": data,
      "method": id,
      "path": "background-to-options"
    });
  }
};

app.alarms = {
  "create": function (name, options) {
    if (chrome.alarms) {
      chrome.alarms.create(name, options); 
    }
  },
  "clear": function (name, callback) {
    if (chrome.alarms) {
      chrome.alarms.clear(name ? name : '', function (e) {
        if (callback) callback(e);
      }); 
    }
  },
  "on": {
    "alarm": function (callback) {
      if (chrome.alarms) {
        chrome.alarms.onAlarm.addListener(function (e) {
          app.storage.load(function () {
            callback(e);
          });
        });
      }
    }
  }
};

app.page = {
  "message": {},
  "receive": function (id, callback) {
    app.page.message[id] = callback;
  },
  "send": function (id, data, tabId, frameId) {
    chrome.tabs.query({}, function (tabs) {
      if (tabs && tabs.length) {
        var options = {
          "method": id, 
          "data": data,
          "path": "background-to-page"
        };
        /*  */
        tabs.forEach(function (tab) {
          if (tab) {
            if (tabId !== null) {
              if (tabId === tab.id) {
                if (frameId !== null) {
                  chrome.tabs.sendMessage(tab.id, options, {"frameId": frameId});
                } else {
                  chrome.tabs.sendMessage(tab.id, options);
                }
              }
            } else {
              chrome.tabs.sendMessage(tab.id, options);
            }
          }
        });
      }
    });
  }
};

app.on = {
  "management": function (callback) {
    chrome.management.getSelf(callback);
  },
  "uninstalled": function (url) {
    chrome.runtime.setUninstallURL(url, function () {});
  },
  "installed": function (callback) {
    chrome.runtime.onInstalled.addListener(function (e) {
      app.storage.load(function () {
        callback(e);
      });
    });
  },
  "startup": function (callback) {
    chrome.runtime.onStartup.addListener(function (e) {
      app.storage.load(function () {
        callback(e);
      });
    });
  },
  "message": function (callback) {
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      app.storage.load(function () {
        callback(message, sender, sendResponse);
      });
    });
  }
};

app.storage = (function () {
  chrome.storage.onChanged.addListener(function () {
    chrome.storage.local.get(null, function (e) {
      app.storage.local = e;
      if (app.storage.callback) {
        if (typeof app.storage.callback === "function") {
          app.storage.callback(true);
        }
      }
    });
  });
  /*  */
  return {
    "local": {},
    "callback": null,
    "read": function (id) {
      return app.storage.local[id];
    },
    "on": {
      "changed": function (callback) {
        if (callback) {
          app.storage.callback = callback;
        }
      }
    },
    "write": function (id, data, callback) {
      var tmp = {};
      tmp[id] = data;
      app.storage.local[id] = data;
      chrome.storage.local.set(tmp, function (e) {
        if (callback) callback(e);
      });
    },
    "load": function (callback) {
      var keys = Object.keys(app.storage.local);
      if (keys && keys.length) {
        if (callback) callback("cache");
      } else {
        chrome.storage.local.get(null, function (e) {
          app.storage.local = e;
          if (callback) callback("disk");
        });
      }
    }
  }
})();

app.tab = {
  "update": function (tabId, options, callback) {
    chrome.tabs.update(tabId, options, function (e) {
      if (callback) callback(e);
    });
  },
  "activate": function (tabId, windowId, callback) {
    chrome.tabs.update(tabId, {"active": true}, function (e) {
      chrome.windows.update(windowId, {focused:true});
      if (callback) callback(e);
    });
  },
  "on": {
    "updated": function (callback) {
      chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        app.storage.load(function () {
          if (tab.status === "complete") {
            callback(tabId, changeInfo, tab);
          }
        });
      });
    }
  },
  "open": function (url, index, active, callback) {
    var properties = {
      "url": url, 
      "active": active !== undefined ? active : true
    };
    /*  */
    if (index !== undefined) {
      if (typeof index === "number") {
        properties.index = index + 1;
      }
    }
    /*  */
    chrome.tabs.create(properties, function (tab) {
      if (callback) callback(tab);
    }); 
  },
  "query": {
    "all": function (callback) {
      chrome.tabs.query({}, function (tabs) {
        if (tabs && tabs.length) {
          callback(tabs);
        }
      });
    },
    "index": function (callback) {
      chrome.tabs.query({"active": true, "currentWindow": true}, function (tabs) {
        if (tabs && tabs.length) {
          callback(tabs[0].index);
        } else callback(undefined);
      });
    } 
  }
};

app.request = {
  "make": function (url, method, type, timeout, callback) {
    if (url) {
      try {
        var request = new XMLHttpRequest();
        /*  */
        request.onerror = function () {
          callback(null);
        };
        /*  */
        request.onload = function (e) {
          if (e && e.target) {
            if (e.target.status) {
              if (e.target.status >= 200 && e.target.status < 300 || e.target.status === 304) {
                if (e.target.responseType) {
                  if (e.target.response) {
                    callback(e.target.response);
                  } else {
                    callback(null);
                  }
                } else {
                  if (e.target.responseText) {
                    var response = JSON.parse(e.target.responseText);
                    callback(response);
                  } else {
                    callback(null);
                  }
                }
              } else {
                callback(null);
              }
            } else {
              callback(null);
            }
          } else {
            callback(null);
          }
        };
        /*  */
        request.open(method, url);
        /*  */
        if (type) request.responseType = type;
        if (timeout) request.timeout = timeout;
        /*  */
        request.send();
      } catch (e) {
        callback(null);
      }
    } else {
      callback(null);
    }
  }
};

app.button = {
  "title": function (title, callback) {
    chrome.browserAction.setTitle({"title": title}, function (e) {
      if (callback) callback(e);
    });
  },
  "on": {
    "clicked": function (callback) {
      chrome.browserAction.onClicked.addListener(function (e) {
        app.storage.load(function () {
          callback(e);
        }); 
      });
    }
  },
  "badge": function (tabId, badge, callback) {
    if (tabId) {
      chrome.browserAction.setBadgeText({
        "tabId": tabId,
        "text": badge + ''
      }, function (e) {
        var tmp = chrome.runtime.lastError;
        if (callback) callback(e);
      });
    } else {
      chrome.browserAction.setBadgeText({"text": badge + ''}, function (e) {
        var tmp = chrome.runtime.lastError;
        if (callback) callback(e);
      });
    }
  },
  "icon": function (path, callback) {
    if (path && typeof path === "object") {
      chrome.browserAction.setIcon({"path": path}, function (e) {
        if (callback) callback(e);
      });
    } else {
      chrome.browserAction.setIcon({
        "path": {
          "16": "../data/icons/" + (path ? path + '/' : '') + "16.png",
          "32": "../data/icons/" + (path ? path + '/' : '') + "32.png",
          "48": "../data/icons/" + (path ? path + '/' : '') + "48.png",
          "64": "../data/icons/" + (path ? path + '/' : '') + "64.png"
        }
      }, function (e) {
        if (callback) callback(e);
      }); 
    }
  },
  "context": function (title, callback) {
    var properties = {
      id: "button-context",
      title: title,
      contexts: ["browser_action"],
    }
    chrome.contextMenus.removeAll();
    chrome.contextMenus.create(properties);
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      callback(info, tab);
    });
  }
};