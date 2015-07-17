/*

# FrameCommunicator

A simple class that wraps `postMessage` for easy unidirectional messaging to
the content window of the active frame.

## Sample usage

var fc = new FrameCommunicator();

fc.init(runtime);

// Send a `postMessage` message of type 'scroll'.
fc.send('scroll.to', {
  scrollTop: 100
  scrollLeft: 0
});

*/

export default class FrameCommunicator {
  constructor(name, handlers) {
    this.name = name;
    if (handlers.getActiveFrameElement) {
      this.getActiveFrameElement = handlers.getActiveFrameElement;
    }
  }

  init(runtime) {
    this.runtime = runtime;
  }

  get activeFrameElement() {
    return this.getActiveFrameElement();
  }

  send(type, data, targetOrigin) {
    var msg = {
      type: type,
      data: data
    };
    this.activeFrameElement.contentWindow.postMessage(msg, targetOrigin || '*');
  }
}
