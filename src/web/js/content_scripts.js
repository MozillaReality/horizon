/**
 * Handles loading content scripts and message passing for websites.
 * This is going to be used as a way to inject scrolling code and
 * additional functionality into iframes until we get platform support.
 */
export default class ContentScripts {

  constructor() {}

  init() {
    console.log('Content scripts init..');
    // Execute an XHR to get the addon blob content.
    var appZipUrl = '../content_scripts.zip';
    var xhr = new XMLHttpRequest({mozSystem: true});
    xhr.open('GET', appZipUrl, true);
    xhr.responseType = 'blob';
    xhr.onload = () => {
      console.log('XHR loaded', xhr.status);
      if (xhr.status === 200) {
        this.import(xhr.response);
      }
    };
    xhr.onerror = e => {
      console.log('Error fetching app zip.', e);
    };
    xhr.send();
  }

  import(blob) {
    console.log('Importing blob', blob);

    navigator.mozApps.mgmt.import(blob)
      .then(addon => {
        console.log('Enabling addon');
        // Enable the addon by default.
        navigator.mozApps.mgmt.setEnabled(addon, true);
        console.log('Activated content script addon', addon.manifestURL);
      })
      .catch(error => {
        if (error.name === 'AppAlreadyInstalled') {
          return;
        }

        console.error('Could not activate content script add-on', error);
      });
  }
}
