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

const CLICKABLE_ELEMENTS = [
  'a[href]', 'area[href]',
  'button:not([disabled]):not([readonly])',
  'input:not([disabled]):not([readonly])',
  'select:not([disabled]):not([readonly])',
  'textarea:not([disabled]):not([readonly])',
  'iframe', 'frame', 'map', 'object', 'embed',
  '[tabindex]:not([tabindex="-1"])', '[contenteditable]'
];

const FOCUSABLE_ELEMENTS = [
  'input:not([disabled]):not([readonly])',
  'textarea:not([disabled]):not([readonly])',
  'select:not([disabled]):not([readonly])',
];

class FrameCommunicator extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;

    window.addEventListener('message', e => {
      // TODO: Check `e.origin` to make sure it matches the Horizon origin.
      if (e.data && typeof e.data === 'object') {
        // Mark the current location.
        page.location = e.data.location;

        if (page.location && page.location !== window.location.href) {
          // This prevents us from capturing events from iframes of the page.
          return;
        }

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
  constructor() {
    this.location = null;
    window.$ = this.$;
    window.$$ = this.$$;
  }

  $(sel) {
    return document.querySelector(sel);
  }

  $$(sel, el) {
    el = el || document;
    return Array.prototype.slice.call(el.querySelectorAll(sel));
  }


  /**
   * Scrolling
   */
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


  /**
   * Cursor
   */
  emitMouseEvent(eventName, el) {
    let evt = new MouseEvent(eventName, {
      view: window,
      bubbles: true,
      cancelable: true
    });
    el.dispatchEvent(evt);
  }

  mouseUp(data) {
    if (typeof data.top === 'undefined' || typeof data.left === 'undefined') {
      return;
    }

    let el = document.elementFromPoint(data.left, data.top);

    if (el) {
      this.emitMouseEvent('mouseup', el);
    }

    if (el === this.cursorElement) {
      this.emitMouseEvent('click', el);
    } else {
      this.clearHighlight();
    }
  }

  mouseDown(data) {
    if (typeof data.top === 'undefined' || typeof data.left === 'undefined') {
      return;
    }

    let elAtPoint = document.elementFromPoint(data.left, data.top);

    if (elAtPoint.matches(FOCUSABLE_ELEMENTS)) {
      elAtPoint.focus();
      return;
    }

    let clickableEl = elAtPoint.closest(CLICKABLE_ELEMENTS);

    if (!clickableEl && elAtPoint) {
      this.emitMouseEvent('mousedown', elAtPoint);
    } else if (clickableEl) {
      this.highlight(elAtPoint);
      this.emitMouseEvent('mousedown', clickableEl);
    }

    this.cursorElement = elAtPoint;
  }

  clearHighlight() {
    if (this.highlighter) {
      this.highlighter.parentNode.removeChild(this.highlighter);
      this.highlighter = null;
    }
  }

  highlight(el) {
    var rect = el.getBoundingClientRect();
    var top = rect.top + window.scrollY + 'px';
    var left = rect.left + window.scrollX + 'px';
    var width = el.offsetWidth + 'px';
    var height = el.offsetHeight + 'px';
    var cssText = `top: ${top};
        left: ${left};
        width: ${width};
        height: ${height};`

    if (this.highlighter) {
      this.highlighter.style.cssText += cssText;
    } else {
      this.highlighter = document.createElement('div');
      document.body.appendChild(this.highlighter);
      this.highlighter.style.cssText += cssText + `
        box-sizing: border-box;
        outline: 5px solid hsl(200, 89%, 50%);
        position: absolute;
        pointer-events: none;
        z-index: 2147483647;
      `;
    }
  }

  viewmodeChange(detail) {
    if (detail && detail.projection) {
      document.mozViewModeProjection = detail.projection;
      return window.dispatchEvent(new CustomEvent('mozviewmodechange',
        {bubbles: true, cancelable: false, detail: detail}));
    }
  }

  viewmodeReset() {
    this.viewmodeChange({detail: 'mono'});  // The default viewmode before viewmode is known.
  }

  viewmodeRemove() {
    delete document.mozViewModeProjection;
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

fc.on('mouse.mouseup', data => {
  log("[add-on] Received 'mouse.mouseup' message");
  page.mouseUp(data);
});

fc.on('mouse.mousedown', data => {
  log("[add-on] Received 'mouse.mousedown' message");
  page.mouseDown(data);
});

fc.on('viewmode.change', data => {
  log("[add-on] Received 'viewmode.change' message", data);
  page.viewmodeChange(data);
})


window.addEventListener('load', () => {
  log('[add-on] Loaded content script', window.location.href);
});

window.addEventListener('mozviewmodechange', e => {
  log("[add-on] Event fired for viewmode change to '%s'", e.detail.projection);
});

window.addEventListener('beforeunload', () => {
  if (page.location === window.location.href) {
    // Remove all `<meta>` tags so `mozbrowsermetachange` events get called
    // for the parent window (e.g., not the Sechelt `<iframe>` on MozVR.com).
    $$('meta', document.head).forEach(el => {
      el.parentNode.removeChild(el);
    });
  }
});


// Simple wrapper to easily toggle logging.
// TODO: Disable after PR is fully reviewed.
var log = true ? console.log.bind(console) : () => {};
