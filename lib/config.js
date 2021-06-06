var config = {};

config.checker = {
  "href": {},
  "count": {},
  /*  */
  set main (val) {app.storage.write("main", val)},
  set number (val) {app.storage.write("number", val)},
  set interval (val) {app.storage.write("interval", val)},
  get main () {return app.storage.read("main") !== undefined ? app.storage.read("main") : 0},
  get number () {return app.storage.read("number") !== undefined ? app.storage.read("number") : 1},
  get interval () {return app.storage.read("interval") !== undefined ? app.storage.read("interval") : 10}
};
