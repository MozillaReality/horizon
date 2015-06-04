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


class Page {
  get activeScrollElement() {
    // This is the element that currently has focus.
    var el = document.activeElement;

    try {
      el = el.contentWindow.document.activeElement;
    } catch (e) {
      // Oops, we tried accessing the document of a cross-origin iframe:
      // > Permission was denied to access property 'document'
      // Fall back to just scrolling the whole document.
      return document.documentElement;
    }

    if (el.tagName.toLowerCase() === 'body') {
      // If `pointer-events` are disabled, just scroll the page's `<html>`.
      // Related: https://miketaylr.com/posts/2014/11/document-body-scrollTop.html
      return el.parentNode;
    }

    return el;
  }

  scrollStep(data) {
    var el = this.activeScrollElement;

    if ('scrollTop' in data) {
      el.scrollTop += data.scrollTop;
    }

    if ('scrollLeft' in data) {
      el.scrollLeft += data.scrollLeft;
    }
  }

  scrollTo(data) {
    var el = this.activeScrollElement;

    if ('scrollTop' in data) {
      if (data.scrollTop === Infinity) {
        el.scrollTop = el.scrollHeight;
      } else {
        el.scrollTop = data.scrollTop;
      }
    }

    if ('scrollLeft' in data) {
      el.scrollLeft = data.scrollLeft;
    }
  }

  scrollHome() {
    this.scrollTo({scrollTop: 0});
  }

  scrollEnd() {
    this.scrollTo({scrollTop: Infinity});
  }
}


var fc = new FrameCommunicator();
var page = new Page();

fc.on('scroll.step', data => {
  log("[add-on] Received 'scroll.step' message", data);
  page.scrollStep(data);
});

fc.on('scroll.to', data => {
  log("[add-on] Received 'scroll.to' message", data);
  page.scrollTo(data);
});

fc.on('scroll.home', () => {
  log("[add-on] Received 'scroll.home' message");
  page.scrollHome();
});

fc.on('scroll.end', () => {
  log("[add-on] Received 'scroll.end' message");
  page.scrollEnd();
});


window.addEventListener('load', () => {
  log('Loaded content script', window.location.href);
});


// Simple wrapper to easily toggle logging.
var log = false ? () => console.log.apply(console, arguments) : () => {};
