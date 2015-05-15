/**
 * Handles remote debugging requests.
 */
export default class Debugging {

  constructor() {}

  init() {
    window.addEventListener('mozChromeEvent', this);
  }

  handleEvent(e) {
    switch (e.type) {
      case 'remote-debugger-prompt':
        // Always allow remote debugging for now.
        this.dispatch('remote-debugger-prompt', {value: true});
        break;
    }
  }

  /**
   * Dispatches an event to gecko.
   */
  dispatch(name, payload) {
    let details = payload || {};
    details.type = name;
    let event = document.createEvent('CustomEvent');
    event.initCustomEvent('mozContentEvent', true, true, details);
    window.dispatchEvent(event);
  }
}
