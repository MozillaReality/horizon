export default class Navigation {
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
}
