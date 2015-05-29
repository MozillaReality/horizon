/*

# FrameCommunicator

A simple class that wraps `postMessage` for easy unidirectional messaging to
the content window of the active frame.

## Sample usage

var fc = new FrameCommunicator();

fc.init(runtime);

// Send a `postMessage` message of type 'scroll'.
fc.send('scroll', {
  scrollTop: 100
  scrollLeft: 0
});

*/

export default class FrameCommunicator {
  constructor(name) {
    this.name = name;
  }

  init(runtime) {
    this.runtime = runtime;
  }

  get activeFrameElement() {
    return this.runtime.frameManager.activeFrame.element;
  }

  send(type, data, targetOrigin) {
    var msg = {
      type: type,
      data: data
    };
    this.activeFrameElement.contentWindow.postMessage(msg, targetOrigin || '*');
  }
}
