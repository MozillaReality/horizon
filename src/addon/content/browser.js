var browser = function () {
  return {
    init: function () {
      gBrowser.addEventListener("load", function () {
        dump('GOT LOAD FROM EXTENSION.');
      });
    },

    run: function () {
      dump('Trying to run() from extension.');
    }
  };
}();

window.addEventListener('load', browser.init, false);
