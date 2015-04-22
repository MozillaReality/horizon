Cu.import('resource://gre/modules/Services.jsm');

var origin = 'http://kevingrandon.github.io';

var vrbrowser = function () {
  return {
    init: function () {
      gBrowser.addEventListener("load", function () {
      });
    },

    run: function () {
      dump('Trying to run() from extension.');
      var newTabBrowser = gBrowser.addTab(origin + '/browser/web/');
      gBrowser.selectedTab = newTabBrowser;

      var browser = gBrowser.getBrowserForTab(newTabBrowser);
      newTabBrowser.addEventListener('load', () => {
        console.log('Got load event.');
        var aWindow = browser.contentWindowAsCPOW;
        if (!aWindow) {
          return;
        }
        var docShell = aWindow.QueryInterface(Ci.nsIInterfaceRequestor)
                            .getInterface(Ci.nsIDocShell);
        console.log('Got docShell. App id is:', docShell.appId);
        docShell.setIsApp(1);
        docShell.setIsBrowserInsideApp(1);
        console.log('Called setIsApp. App id: ', docShell.appId);

        var uri = Services.io.newURI(origin, null, null);
        Services.perms.add(uri, 'embed-apps', Services.perms.ALLOW_ACTION);
        Services.perms.add(uri, 'browser', Services.perms.ALLOW_ACTION);
        Services.perms.add(uri, 'systemXHR', Services.perms.ALLOW_ACTION);
      });
    }
  };
}();

window.addEventListener('load', vrbrowser.init, false);
