import EventEmitter from '../../web/js/lib/event_emitter.js';

/*

# FrameCommunicator

A simple class that wraps `postMessage` with an event emitter.

## Sample usage

var fc = new FrameCommunicator();

window.addEventListener('load', () => {
  // Send a `postMessage` of type 'scrollinit'. (See note about `send` below.)
  fc.send('scroll.init', {
    scrollTop: document.body.scrollTop,
    scrollLeft: document.body.scrollLeft
  });

  // Listen for `postMessage` messages of type 'scroll'.
  fc.on('scroll.to', data => {
    window.scrollTo(data.scrollTop, data.scrollLeft);
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

  send() {
    // NOTE: communicating with the parent browser is not possible in the
    // platform, but it is a necessity that will need to be implemented soon.
    // See issue #120: https://github.com/MozVR/horizon/issues/120
    throw Error('Not Implemented');
  }
}


var fc = new FrameCommunicator();

fc.on('scroll.step', data => {
  log("[add-on] Received 'scroll.step' message", data);

  var el = getActiveScrollElement();
  if ('scrollTop' in data) {
    el.scrollTop += data.scrollTop;
  }
  if ('scrollLeft' in data) {
    el.scrollLeft += data.scrollLeft;
  }
});

fc.on('scroll.to', data => {
  log("[add-on] Received 'scroll.to' message", data);

  var el = getActiveScrollElement();
  if ('scrollTop' in data) {
    el.scrollTop = data.scrollTop;
  }
  if ('scrollLeft' in data) {
    el.scrollLeft = data.scrollLeft;
  }
});

fc.on('scroll.home', data => {
  log("[add-on] Received 'scroll.home' message");

  var el = getActiveScrollElement();
  el.scrollTop = 0;
});

fc.on('scroll.end', data => {
  log("[add-on] Received 'scroll.end' message");

  var el = getActiveScrollElement();
  el.scrollTop = el.scrollHeight;
});

window.addEventListener('load', () => {
  log('Loaded content script', window.location.href);
});

window.addEventListener('unload', () => {
  fc.off();
});


function getActiveScrollElement(doc) {
  doc = doc || document;

  // This is whichever element currently has focus
  // (really only useful if `pointer-events` are not disabled).
  var el = doc.activeElement;

  while ('contentWindow' in el) {
    doc = el.contentWindow.document;
    el = doc.activeElement;
  }

  if (el.tagName.toLowerCase() === 'body') {
    // If `pointer-events` are disabled, just scroll the `<html>` of the
    // active `<iframe>` element.
    //
    // Also, this lets us scroll an `<iframe>` if the element is visible but
    // not focussed yet.
    // Related: https://miketaylr.com/posts/2014/11/document-body-scrollTop.html
    el = el.parentNode;
  }

  return el;
}


// Simple wrapper to easily toggle logging.
var log = false ? () => console.log.apply(console, arguments) : () => {};
