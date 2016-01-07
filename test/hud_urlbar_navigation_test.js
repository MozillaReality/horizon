var assert = require('assert');
var Marionette = require('marionette-client');

marionette('hud navigation', function() {
  var settings = {
    profile: {
      prefs: {
        'dom.ipc.tabs.disabled': true,
        'browser.shell.checkDefaultBrowser': false,
        'focusmanager.testmode': true,
      }
    }
  };

  var client = marionette.client(settings);

  test('navigates to a new page', function() {
    var hud = client.findElement('#hud');
    var body = client.findElement('body');
    assert.ok(!hud.displayed());

    // Manually show the HUD.
    client.executeScript(function() {
      window.wrappedJSObject.runtime.keyboardInput.handleEvent({
        key: ' '
      });
    });

    assert.ok(hud.displayed());

    var urlInput = client.findElement('#urlbar__input');
    urlInput.clear();
    var RETURN = '\ue006';
    var SITE = 'http://mozilla.org/';
    urlInput.sendKeys(SITE + RETURN);

    client.waitFor(function() {
      var iframe = client.findElement('iframe[src="' + SITE + '"]');
      return iframe && iframe.displayed();
    });
  });
});
