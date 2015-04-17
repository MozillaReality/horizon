export default class Navigation {
  constructor() {
    window.$ = function(sel) {
      return document.querySelector(sel);
    };


    window.$$ = function(sel) {
      return Array.prototype.slice.call(document.querySelectorAll(sel));
    };
  }
}
