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
    this.queue = [];
    if (handlers.getActiveFrame) {
      this.getActiveFrame = handlers.getActiveFrame;
    }
    if (handlers.getActiveFrameElement) {
      this.getActiveFrameElement = handlers.getActiveFrameElement;
    }
  }

  init(runtime) {
    this.runtime = runtime;
  }

  get activeFrame() {
    return this.getActiveFrame();
  }

  get activeFrameLoaded() {
    return this.activeFrame && this.activeFrame.loading === false;
  }

  get activeFrameElement() {
    return this.getActiveFrameElement();
  }

  send(type, data, targetOrigin) {
    if (this.activeFrameLoaded) {
      this.sendMsg(type, data, targetOrigin);
    } else {
      this.queueMsg(type, data, targetOrigin);
    }
  }

  sendMsg(type, data, targetOrigin) {
    let msg = {
      type: type,
      data: data,
      location: this.activeFrame.location
    };

    return this.activeFrameElement.contentWindow.postMessage(msg, targetOrigin || '*');
  }

  queueMsg() {
    this.queue.push(arguments);

    clearInterval(this.queueInterval);

    this.queueInterval = setInterval(() => {
      if (this.activeFrameLoaded) {
        while (this.queue.length) {
          this.sendMsg(...this.queue.pop());
        }

        return clearInterval(this.queueInterval);
      }

    }, 200);
  }
}
