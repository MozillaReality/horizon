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
}
