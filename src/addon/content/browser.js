Cu.import('resource://gre/modules/Services.jsm');

var origin = 'http://kevingrandon.github.io';

/**
 * Installs the toolbar button with the given ID into the given
 * toolbar, if it is not already present in the document.
 *
 * @param {string} toolbarId The ID of the toolbar to install to.
 * @param {string} id The ID of the button to install.
 * @param {string} afterId The ID of the element to insert after. @optional
 */
function installButton(toolbarId, id, afterId) {
  if (!document.getElementById(id)) {
      var toolbar = document.getElementById(toolbarId);

      // If no afterId is given, then append the item to the toolbar
      var before = null;
      if (afterId) {
          let elem = document.getElementById(afterId);
          if (elem && elem.parentNode == toolbar)
              before = elem.nextElementSibling;
      }

      toolbar.insertItem(id, before);
      toolbar.setAttribute("currentset", toolbar.currentSet);
      document.persist(toolbar.id, "currentset");

      if (toolbarId == "addon-bar")
          toolbar.collapsed = false;
  }
}

var vrbrowser = function () {
  return {
    init: function () {
      // Install the icon onto the main toolbar.
      installButton('nav-bar', 'vrbrowser-toolbar-button');
      installButton('addon-bar', 'vrbrowser-toolbar-button');

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
        //docShell.setIsBrowserInsideApp(1);
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
