import EventEmitter from '../../web/js/lib/event_emitter.js';

/*

# FrameCommunicator

A simple class that wraps `postMessage` with an event emitter.

## Sample usage

var fc = new FrameCommunicator();

window.addEventListener('load', () => {
  // Send a `postMessage` of type 'scrollinit'.
  fc.send('scrollinit', {
    scrollTop: document.body.scrollTop,
    scrollLeft: document.body.scrollLeft
  });

  // Listen for `postMessage` messages of type 'scroll'.
  fc.on('scroll', data => {
    document.body.scrollTop = data.scrollTop;
    document.body.scrollLeft = data.scrollLeft;
  });
});

window.addEventListener('unload', () => {
  // Stop listening for 'scroll' messages.
  fc.off('scroll');
});

*/

class FrameCommunicator extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;

    window.addEventListener('message', e => {
      // TODO: Check `e.origin` to make sure it matches the Horizon origin.
      if (e.data && typeof e.data === 'object') {
        this.emit(e.data.type, e.data.data);
      }
    });
  }
}


var fc = new FrameCommunicator();

fc.on('scroll', data => {
  console.log('[add-on] Received scroll message', data);

  if ('scrollTop' in data) {
    document.documentElement.scrollTop += data.scrollTop;
  }
  if ('scrollLeft' in data) {
    document.documentElement.scrollLeft += data.scrollLeft;
  }
});

window.addEventListener('load', () => {
  console.log('Got content script', window.location.href);
});

window.addEventListener('unload', () => {
  fc.off();
});
