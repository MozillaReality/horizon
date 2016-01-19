/**
 * Developer Tools
 */
export default class Devtools {

  constructor() {}

  init() {
    // turns on remote debugging using web-IDE.
    navigator.mozSettings.createLock().set({'debugger.remote-mode': 'adb-devtools'});
  }
}
