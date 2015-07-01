export default class Utils {
  constructor() {
    window.$ = this.$;
    window.$$ = this.$$;
  }

  $(sel) {
    return document.querySelector(sel);
  }

  $$(sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel));
  }

  toArray(list) {
    return Array.prototype.slice.call(list);
  }

  evaluateDOMRequest(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = e => {
        resolve(e.target.result);
      };
      req.onerror = e => {
        reject(e);
      };
    });
  }

  /**
   * Returns the form element of the the focussed element, if possible.
   *
   * @param {Element} el
   */
  getFocusedForm(el) {
    el = el || document.activeElement;

    var form = el.closest('form');
    if (form && this.toArray(form.elements).indexOf(el) !== -1) {
      return form;
    }
  }

  /**
   * Emits a DOM mouse event.
   *
   * @param {String} eventName Name of event to fire (e.g., 'click', 'mouseover', 'mouseout').
   * @param {Element} el Element on which to emit mouse event.
   */
  emitMouseEvent(eventName, el) {
    var evt = new MouseEvent(eventName, {
      view: window,
      bubbles: true,
      cancelable: true
    });
    el.dispatchEvent(evt);
    return evt;
  }

  /**
   * Sleeps for some milliseconds to enable easy chaining of Promises.
   *
   * @param {Number} duration Time in milliseconds to sleep (e.g., 1500 for 1.5 seconds).
   */
  sleep(duration = 0) {
    return new Promise(resolve => {
      window.setTimeout(() => {
        resolve();
      }, duration);
    });
  }

  /**
   * Returns an anchor element if its 'click' event can he hijacked by Horizon.
   *
   * @param {Event} e A 'click' event (delegated on document).
   * @returns {(Element|null)} a The parent anchor element that was clicked and can be hijacked.
   */
  getHijackableAnchor(e) {
    if (!e || !e.target) {
      return null;
    }

    var a = e.target.closest('a');

    // Ignore an element/anchor if…
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey ||
        a.hasAttribute('download') || a.target || a.href[0] === '#' ||
        a.protocol !== 'http:' && a.protocol !== 'https:') {
      return null;
    }

    return a;
  }
}
