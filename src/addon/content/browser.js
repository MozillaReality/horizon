var vrbrowser = function () {
  return {
    init: function () {
      gBrowser.addEventListener("load", function () {
        dump('GOT LOAD FROM EXTENSION.');
      });
    },

    run: function () {
      dump('Trying to run() from extension.');
      gBrowser.selectedTab = gBrowser.addTab('http://kevingrandon.github.io/browser/web/');
    }
  };
}();

window.addEventListener('load', vrbrowser.init, false);
