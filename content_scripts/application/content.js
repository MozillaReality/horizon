(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _arguments = arguments;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _event_emitter = require('../../web/js/lib/event_emitter.js');

var _event_emitter2 = _interopRequireDefault(_event_emitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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

var CLICKABLE_ELEMENTS = ['a[href]', 'area[href]', 'button:not([disabled]):not([readonly])', 'input:not([disabled]):not([readonly])', 'select:not([disabled]):not([readonly])', 'textarea:not([disabled]):not([readonly])', 'iframe', 'frame', 'map', 'object', 'embed', '[tabindex]:not([tabindex="-1"])', '[contenteditable]'];

var FOCUSABLE_ELEMENTS = ['input:not([disabled]):not([readonly])', 'textarea:not([disabled]):not([readonly])', 'select:not([disabled]):not([readonly])'];

var FrameCommunicator = function (_EventEmitter) {
  _inherits(FrameCommunicator, _EventEmitter);

  function FrameCommunicator(name) {
    _classCallCheck(this, FrameCommunicator);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(FrameCommunicator).call(this));

    _this.name = name;

    window.addEventListener('message', function (e) {
      // TODO: Check `e.origin` to make sure it matches the Horizon origin.
      if (e.data && _typeof(e.data) === 'object') {
        _this.emit(e.data.type, e.data.data);
      }
    });
    return _this;
  }

  _createClass(FrameCommunicator, [{
    key: 'send',
    value: function send() {
      // NOTE: communicating with the parent browser is not possible in the
      // platform, but it is a necessity that will need to be implemented soon.
      // See issue #120: https://github.com/MozVR/horizon/issues/120
      throw Error('Not Implemented');
    }
  }]);

  return FrameCommunicator;
}(_event_emitter2.default);

var Page = function () {
  function Page() {
    _classCallCheck(this, Page);

    window.$ = this.$;
    window.$$ = this.$$;
  }

  _createClass(Page, [{
    key: '$',
    value: function $(sel) {
      return document.querySelector(sel);
    }
  }, {
    key: '$$',
    value: function $$(sel, el) {
      el = el || document;
      return Array.prototype.slice.call(el.querySelectorAll(sel));
    }

    /**
     * Scrolling
     */

  }, {
    key: 'scrollStep',
    value: function scrollStep(data) {
      var el = this.activeScrollElement;

      if ('scrollTop' in data) {
        el.scrollTop += data.scrollTop;
      }

      if ('scrollLeft' in data) {
        el.scrollLeft += data.scrollLeft;
      }
    }
  }, {
    key: 'scrollTo',
    value: function scrollTo(data) {
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
  }, {
    key: 'scrollHome',
    value: function scrollHome() {
      this.scrollTo({ scrollTop: 0 });
    }
  }, {
    key: 'scrollEnd',
    value: function scrollEnd() {
      this.scrollTo({ scrollTop: Infinity });
    }

    /**
     * Cursor
     */

  }, {
    key: 'emitMouseEvent',
    value: function emitMouseEvent(eventName, el) {
      var evt = new MouseEvent(eventName, {
        view: window,
        bubbles: true,
        cancelable: true
      });
      el.dispatchEvent(evt);
    }
  }, {
    key: 'mouseUp',
    value: function mouseUp(data) {
      if (typeof data.top === 'undefined' || typeof data.left === 'undefined') {
        return;
      }

      var el = document.elementFromPoint(data.left, data.top);

      if (el) {
        this.emitMouseEvent('mouseup', el);
      }

      if (el === this.cursorElement) {
        this.emitMouseEvent('click', el);
      } else {
        this.clearHighlight();
      }
    }
  }, {
    key: 'mouseDown',
    value: function mouseDown(data) {
      if (typeof data.top === 'undefined' || typeof data.left === 'undefined') {
        return;
      }

      var elAtPoint = document.elementFromPoint(data.left, data.top);

      if (elAtPoint.matches(FOCUSABLE_ELEMENTS)) {
        elAtPoint.focus();
        return;
      }

      var clickableEl = elAtPoint.closest(CLICKABLE_ELEMENTS);

      if (!clickableEl && elAtPoint) {
        this.emitMouseEvent('mousedown', elAtPoint);
      } else if (clickableEl) {
        this.highlight(elAtPoint);
        this.emitMouseEvent('mousedown', clickableEl);
      }

      this.cursorElement = elAtPoint;
    }
  }, {
    key: 'clearHighlight',
    value: function clearHighlight() {
      if (this.highlighter) {
        this.highlighter.parentNode.removeChild(this.highlighter);
        this.highlighter = null;
      }
    }
  }, {
    key: 'highlight',
    value: function highlight(el) {
      var rect = el.getBoundingClientRect();
      var top = rect.top + window.scrollY + 'px';
      var left = rect.left + window.scrollX + 'px';
      var width = el.offsetWidth + 'px';
      var height = el.offsetHeight + 'px';
      var cssText = 'top: ' + top + ';\n        left: ' + left + ';\n        width: ' + width + ';\n        height: ' + height + ';';

      if (this.highlighter) {
        this.highlighter.style.cssText += cssText;
      } else {
        this.highlighter = document.createElement('div');
        document.body.appendChild(this.highlighter);
        this.highlighter.style.cssText += cssText + '\n        box-sizing: border-box;\n        outline: 5px solid hsl(200, 89%, 50%);\n        position: absolute;\n        pointer-events: none;\n        z-index: 2147483647;\n      ';
      }
    }
  }, {
    key: 'activeScrollElement',
    get: function get() {
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
  }]);

  return Page;
}();

var fc = new FrameCommunicator();
var page = new Page();

fc.on('scroll.step', function (data) {
  log("[add-on] Received 'scroll.step' message", data);
  page.scrollStep(data);
});

fc.on('scroll.to', function (data) {
  log("[add-on] Received 'scroll.to' message", data);
  page.scrollTo(data);
});

fc.on('scroll.home', function () {
  log("[add-on] Received 'scroll.home' message");
  page.scrollHome();
});

fc.on('scroll.end', function () {
  log("[add-on] Received 'scroll.end' message");
  page.scrollEnd();
});

fc.on('mouse.mouseup', function (data) {
  log("[add-on] Received 'mouse.mouseup' message");
  page.mouseUp(data);
});

fc.on('mouse.mousedown', function (data) {
  log("[add-on] Received 'mouse.mousedown' message");
  page.mouseDown(data);
});

window.addEventListener('load', function () {
  log('Loaded content script', window.location.href);
});

// Remove all `<meta>` tags so `mozbrowsermetachange` events get called.
window.addEventListener('beforeunload', function () {
  $$('meta', document.head).forEach(function (el) {
    el.parentNode.removeChild(el);
  });
});

// Simple wrapper to easily toggle logging.
var log = false ? function () {
  return console.log.apply(console, _arguments);
} : function () {};

},{"../../web/js/lib/event_emitter.js":2}],2:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * A simple event-emitter class. Like Node's but much simpler.
 */

var EventEmitter = function () {
  function EventEmitter() {
    _classCallCheck(this, EventEmitter);

    this.listeners = {};
  }

  _createClass(EventEmitter, [{
    key: "emit",
    value: function emit(name) {
      var _this = this;

      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      (this.listeners[name] || []).forEach(function (func) {
        return func.apply(_this, args);
      });
      return this;
    }
  }, {
    key: "on",
    value: function on(name, func) {
      if (name in this.listeners) {
        this.listeners[name].push(func);
      } else {
        this.listeners[name] = [func];
      }
      return this;
    }
  }, {
    key: "off",
    value: function off(name) {
      if (name) {
        this.listeners[name] = [];
      } else {
        this.listeners = {};
      }
      return this;
    }
  }]);

  return EventEmitter;
}();

exports.default = EventEmitter;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHBsaWNhdGlvbi9jb250ZW50LmpzIiwiLi4vd2ViL2pzL2xpYi9ldmVudF9lbWl0dGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNnQ0EsSUFBTSxrQkFBa0IsR0FBRyxDQUN6QixTQUFTLEVBQUUsWUFBWSxFQUN2Qix3Q0FBd0MsRUFDeEMsdUNBQXVDLEVBQ3ZDLHdDQUF3QyxFQUN4QywwQ0FBMEMsRUFDMUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFDM0MsaUNBQWlDLEVBQUUsbUJBQW1CLENBQ3ZELENBQUM7O0FBRUYsSUFBTSxrQkFBa0IsR0FBRyxDQUN6Qix1Q0FBdUMsRUFDdkMsMENBQTBDLEVBQzFDLHdDQUF3QyxDQUN6QyxDQUFDOztJQUVJLGlCQUFpQjtZQUFqQixpQkFBaUI7O0FBQ3JCLFdBREksaUJBQWlCLENBQ1QsSUFBSSxFQUFFOzBCQURkLGlCQUFpQjs7dUVBQWpCLGlCQUFpQjs7QUFHbkIsVUFBSyxJQUFJLEdBQUcsSUFBSSxDQUFDOztBQUVqQixVQUFNLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFVBQUEsQ0FBQyxFQUFJOztBQUV0QyxVQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksUUFBTyxDQUFDLENBQUMsSUFBSSxNQUFLLFFBQVEsRUFBRTtBQUN4QyxjQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO09BQ3JDO0tBQ0YsQ0FBQyxDQUFDOztHQUNKOztlQVhHLGlCQUFpQjs7MkJBYWQ7Ozs7QUFJTCxZQUFNLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFD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S0FDYjs7O3dCQUVHLElBQUksRUFBRTtBQUNSLFVBQUksSUFBSSxFQUFFO0FBQ1IsWUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7T0FDM0IsTUFBTTtBQUNMLFlBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO09BQ3JCO0FBQ0QsYUFBTyxJQUFJLENBQUM7S0FDYjs7O1NBMUJrQixZQUFZOzs7a0JBQVosWUFBWSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJy4uLy4uL3dlYi9qcy9saWIvZXZlbnRfZW1pdHRlci5qcyc7XG5cbi8qXG5cbiMgRnJhbWVDb21tdW5pY2F0b3JcblxuQSBzaW1wbGUgY2xhc3MgdGhhdCB3cmFwcyBgcG9zdE1lc3NhZ2VgIHdpdGggYW4gZXZlbnQgZW1pdHRlci5cblxuIyMgU2FtcGxlIHVzYWdlXG5cbnZhciBmYyA9IG5ldyBGcmFtZUNvbW11bmljYXRvcigpO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsICgpID0+IHtcbiAgLy8gU2VuZCBhIGBwb3N0TWVzc2FnZWAgb2YgdHlwZSAnc2Nyb2xsaW5pdCcuIChTZWUgbm90ZSBhYm91dCBgc2VuZGAgYmVsb3cuKVxuICBmYy5zZW5kKCdzY3JvbGwuaW5pdCcsIHtcbiAgICBzY3JvbGxUb3A6IGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wLFxuICAgIHNjcm9sbExlZnQ6IGRvY3VtZW50LmJvZHkuc2Nyb2xsTGVmdFxuICB9KTtcblxuICAvLyBMaXN0ZW4gZm9yIGBwb3N0TWVzc2FnZWAgbWVzc2FnZXMgb2YgdHlwZSAnc2Nyb2xsJy5cbiAgZmMub24oJ3Njcm9sbC50bycsIGRhdGEgPT4ge1xuICAgIHdpbmRvdy5zY3JvbGxUbyhkYXRhLnNjcm9sbFRvcCwgZGF0YS5zY3JvbGxMZWZ0KTtcbiAgfSk7XG59KTtcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3VubG9hZCcsICgpID0+IHtcbiAgLy8gU3RvcCBsaXN0ZW5pbmcgZm9yICdzY3JvbGwnIG1lc3NhZ2VzLlxuICBmYy5vZmYoJ3Njcm9sbCcpO1xufSk7XG5cbiovXG5cbmNvbnN0IENMSUNLQUJMRV9FTEVNRU5UUyA9IFtcbiAgJ2FbaHJlZl0nLCAnYXJlYVtocmVmXScsXG4gICdidXR0b246bm90KFtkaXNhYmxlZF0pOm5vdChbcmVhZG9ubHldKScsXG4gICdpbnB1dDpub3QoW2Rpc2FibGVkXSk6bm90KFtyZWFkb25seV0pJyxcbiAgJ3NlbGVjdDpub3QoW2Rpc2FibGVkXSk6bm90KFtyZWFkb25seV0pJyxcbiAgJ3RleHRhcmVhOm5vdChbZGlzYWJsZWRdKTpub3QoW3JlYWRvbmx5XSknLFxuICAnaWZyYW1lJywgJ2ZyYW1lJywgJ21hcCcsICdvYmplY3QnLCAnZW1iZWQnLFxuICAnW3RhYmluZGV4XTpub3QoW3RhYmluZGV4PVwiLTFcIl0pJywgJ1tjb250ZW50ZWRpdGFibGVdJ1xuXTtcblxuY29uc3QgRk9DVVNBQkxFX0VMRU1FTlRTID0gW1xuICAnaW5wdXQ6bm90KFtkaXNhYmxlZF0pOm5vdChbcmVhZG9ubHldKScsXG4gICd0ZXh0YXJlYTpub3QoW2Rpc2FibGVkXSk6bm90KFtyZWFkb25seV0pJyxcbiAgJ3NlbGVjdDpub3QoW2Rpc2FibGVkXSk6bm90KFtyZWFkb25seV0pJyxcbl07XG5cbmNsYXNzIEZyYW1lQ29tbXVuaWNhdG9yIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IobmFtZSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZSA9PiB7XG4gICAgICAvLyBUT0RPOiBDaGVjayBgZS5vcmlnaW5gIHRvIG1ha2Ugc3VyZSBpdCBtYXRjaGVzIHRoZSBIb3Jpem9uIG9yaWdpbi5cbiAgICAgIGlmIChlLmRhdGEgJiYgdHlwZW9mIGUuZGF0YSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgdGhpcy5lbWl0KGUuZGF0YS50eXBlLCBlLmRhdGEuZGF0YSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzZW5kKCkge1xuICAgIC8vIE5PVEU6IGNvbW11bmljYXRpbmcgd2l0aCB0aGUgcGFyZW50IGJyb3dzZXIgaXMgbm90IHBvc3NpYmxlIGluIHRoZVxuICAgIC8vIHBsYXRmb3JtLCBidXQgaXQgaXMgYSBuZWNlc3NpdHkgdGhhdCB3aWxsIG5lZWQgdG8gYmUgaW1wbGVtZW50ZWQgc29vbi5cbiAgICAvLyBTZWUgaXNzdWUgIzEyMDogaHR0cHM6Ly9naXRodWIuY29tL01velZSL2hvcml6b24vaXNzdWVzLzEyMFxuICAgIHRocm93IEVycm9yKCdOb3QgSW1wbGVtZW50ZWQnKTtcbiAgfVxufVxuXG5cbmNsYXNzIFBhZ2Uge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB3aW5kb3cuJCA9IHRoaXMuJDtcbiAgICB3aW5kb3cuJCQgPSB0aGlzLiQkO1xuICB9XG5cbiAgJChzZWwpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWwpO1xuICB9XG5cbiAgJCQoc2VsLCBlbCkge1xuICAgIGVsID0gZWwgfHwgZG9jdW1lbnQ7XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGVsLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsKSk7XG4gIH1cblxuXG4gIC8qKlxuICAgKiBTY3JvbGxpbmdcbiAgICovXG4gIGdldCBhY3RpdmVTY3JvbGxFbGVtZW50KCkge1xuICAgIC8vIFRoaXMgaXMgdGhlIGVsZW1lbnQgdGhhdCBjdXJyZW50bHkgaGFzIGZvY3VzLlxuICAgIHZhciBlbCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG5cbiAgICB0cnkge1xuICAgICAgZWwgPSBlbC5jb250ZW50V2luZG93LmRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gT29wcywgd2UgdHJpZWQgYWNjZXNzaW5nIHRoZSBkb2N1bWVudCBvZiBhIGNyb3NzLW9yaWdpbiBpZnJhbWU6XG4gICAgICAvLyA+IFBlcm1pc3Npb24gd2FzIGRlbmllZCB0byBhY2Nlc3MgcHJvcGVydHkgJ2RvY3VtZW50J1xuICAgICAgLy8gRmFsbCBiYWNrIHRvIGp1c3Qgc2Nyb2xsaW5nIHRoZSB3aG9sZSBkb2N1bWVudC5cbiAgICAgIHJldHVybiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gICAgfVxuXG4gICAgaWYgKGVsLnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2JvZHknKSB7XG4gICAgICAvLyBJZiBgcG9pbnRlci1ldmVudHNgIGFyZSBkaXNhYmxlZCwganVzdCBzY3JvbGwgdGhlIHBhZ2UncyBgPGh0bWw+YC5cbiAgICAgIC8vIFJlbGF0ZWQ6IGh0dHBzOi8vbWlrZXRheWxyLmNvbS9wb3N0cy8yMDE0LzExL2RvY3VtZW50LWJvZHktc2Nyb2xsVG9wLmh0bWxcbiAgICAgIHJldHVybiBlbC5wYXJlbnROb2RlO1xuICAgIH1cblxuICAgIHJldHVybiBlbDtcbiAgfVxuXG4gIHNjcm9sbFN0ZXAoZGF0YSkge1xuICAgIHZhciBlbCA9IHRoaXMuYWN0aXZlU2Nyb2xsRWxlbWVudDtcblxuICAgIGlmICgnc2Nyb2xsVG9wJyBpbiBkYXRhKSB7XG4gICAgICBlbC5zY3JvbGxUb3AgKz0gZGF0YS5zY3JvbGxUb3A7XG4gICAgfVxuXG4gICAgaWYgKCdzY3JvbGxMZWZ0JyBpbiBkYXRhKSB7XG4gICAgICBlbC5zY3JvbGxMZWZ0ICs9IGRhdGEuc2Nyb2xsTGVmdDtcbiAgICB9XG4gIH1cblxuICBzY3JvbGxUbyhkYXRhKSB7XG4gICAgdmFyIGVsID0gdGhpcy5hY3RpdmVTY3JvbGxFbGVtZW50O1xuXG4gICAgaWYgKCdzY3JvbGxUb3AnIGluIGRhdGEpIHtcbiAgICAgIGlmIChkYXRhLnNjcm9sbFRvcCA9PT0gSW5maW5pdHkpIHtcbiAgICAgICAgZWwuc2Nyb2xsVG9wID0gZWwuc2Nyb2xsSGVpZ2h0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWwuc2Nyb2xsVG9wID0gZGF0YS5zY3JvbGxUb3A7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCdzY3JvbGxMZWZ0JyBpbiBkYXRhKSB7XG4gICAgICBlbC5zY3JvbGxMZWZ0ID0gZGF0YS5zY3JvbGxMZWZ0O1xuICAgIH1cbiAgfVxuXG4gIHNjcm9sbEhvbWUoKSB7XG4gICAgdGhpcy5zY3JvbGxUbyh7c2Nyb2xsVG9wOiAwfSk7XG4gIH1cblxuICBzY3JvbGxFbmQoKSB7XG4gICAgdGhpcy5zY3JvbGxUbyh7c2Nyb2xsVG9wOiBJbmZpbml0eX0pO1xuICB9XG5cblxuICAvKipcbiAgICogQ3Vyc29yXG4gICAqL1xuICBlbWl0TW91c2VFdmVudChldmVudE5hbWUsIGVsKSB7XG4gICAgbGV0IGV2dCA9IG5ldyBNb3VzZUV2ZW50KGV2ZW50TmFtZSwge1xuICAgICAgdmlldzogd2luZG93LFxuICAgICAgYnViYmxlczogdHJ1ZSxcbiAgICAgIGNhbmNlbGFibGU6IHRydWVcbiAgICB9KTtcbiAgICBlbC5kaXNwYXRjaEV2ZW50KGV2dCk7XG4gIH1cblxuICBtb3VzZVVwKGRhdGEpIHtcbiAgICBpZiAodHlwZW9mIGRhdGEudG9wID09PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgZGF0YS5sZWZ0ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBlbCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoZGF0YS5sZWZ0LCBkYXRhLnRvcCk7XG5cbiAgICBpZiAoZWwpIHtcbiAgICAgIHRoaXMuZW1pdE1vdXNlRXZlbnQoJ21vdXNldXAnLCBlbCk7XG4gICAgfVxuXG4gICAgaWYgKGVsID09PSB0aGlzLmN1cnNvckVsZW1lbnQpIHtcbiAgICAgIHRoaXMuZW1pdE1vdXNlRXZlbnQoJ2NsaWNrJywgZWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNsZWFySGlnaGxpZ2h0KCk7XG4gICAgfVxuICB9XG5cbiAgbW91c2VEb3duKGRhdGEpIHtcbiAgICBpZiAodHlwZW9mIGRhdGEudG9wID09PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgZGF0YS5sZWZ0ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBlbEF0UG9pbnQgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGRhdGEubGVmdCwgZGF0YS50b3ApO1xuXG4gICAgaWYgKGVsQXRQb2ludC5tYXRjaGVzKEZPQ1VTQUJMRV9FTEVNRU5UUykpIHtcbiAgICAgIGVsQXRQb2ludC5mb2N1cygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBjbGlja2FibGVFbCA9IGVsQXRQb2ludC5jbG9zZXN0KENMSUNLQUJMRV9FTEVNRU5UUyk7XG5cbiAgICBpZiAoIWNsaWNrYWJsZUVsICYmIGVsQXRQb2ludCkge1xuICAgICAgdGhpcy5lbWl0TW91c2VFdmVudCgnbW91c2Vkb3duJywgZWxBdFBvaW50KTtcbiAgICB9IGVsc2UgaWYgKGNsaWNrYWJsZUVsKSB7XG4gICAgICB0aGlzLmhpZ2hsaWdodChlbEF0UG9pbnQpO1xuICAgICAgdGhpcy5lbWl0TW91c2VFdmVudCgnbW91c2Vkb3duJywgY2xpY2thYmxlRWwpO1xuICAgIH1cblxuICAgIHRoaXMuY3Vyc29yRWxlbWVudCA9IGVsQXRQb2ludDsgICAgXG4gIH1cblxuICBjbGVhckhpZ2hsaWdodCgpIHtcbiAgICBpZiAodGhpcy5oaWdobGlnaHRlcikge1xuICAgICAgdGhpcy5oaWdobGlnaHRlci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuaGlnaGxpZ2h0ZXIpO1xuICAgICAgdGhpcy5oaWdobGlnaHRlciA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgaGlnaGxpZ2h0KGVsKSB7XG4gICAgdmFyIHJlY3QgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICB2YXIgdG9wID0gcmVjdC50b3AgKyB3aW5kb3cuc2Nyb2xsWSArICdweCc7XG4gICAgdmFyIGxlZnQgPSByZWN0LmxlZnQgKyB3aW5kb3cuc2Nyb2xsWCArICdweCc7XG4gICAgdmFyIHdpZHRoID0gZWwub2Zmc2V0V2lkdGggKyAncHgnO1xuICAgIHZhciBoZWlnaHQgPSBlbC5vZmZzZXRIZWlnaHQgKyAncHgnO1xuICAgIHZhciBjc3NUZXh0ID0gYHRvcDogJHt0b3B9O1xuICAgICAgICBsZWZ0OiAke2xlZnR9O1xuICAgICAgICB3aWR0aDogJHt3aWR0aH07XG4gICAgICAgIGhlaWdodDogJHtoZWlnaHR9O2BcblxuICAgIGlmICh0aGlzLmhpZ2hsaWdodGVyKSB7XG4gICAgICB0aGlzLmhpZ2hsaWdodGVyLnN0eWxlLmNzc1RleHQgKz0gY3NzVGV4dDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5oaWdobGlnaHRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmhpZ2hsaWdodGVyKTtcbiAgICAgIHRoaXMuaGlnaGxpZ2h0ZXIuc3R5bGUuY3NzVGV4dCArPSBjc3NUZXh0ICsgYFxuICAgICAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xuICAgICAgICBvdXRsaW5lOiA1cHggc29saWQgaHNsKDIwMCwgODklLCA1MCUpO1xuICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICAgICAgICB6LWluZGV4OiAyMTQ3NDgzNjQ3O1xuICAgICAgYDtcbiAgICB9XG4gIH1cbn1cblxuXG52YXIgZmMgPSBuZXcgRnJhbWVDb21tdW5pY2F0b3IoKTtcbnZhciBwYWdlID0gbmV3IFBhZ2UoKTtcblxuZmMub24oJ3Njcm9sbC5zdGVwJywgZGF0YSA9PiB7XG4gIGxvZyhcIlthZGQtb25dIFJlY2VpdmVkICdzY3JvbGwuc3RlcCcgbWVzc2FnZVwiLCBkYXRhKTtcbiAgcGFnZS5zY3JvbGxTdGVwKGRhdGEpO1xufSk7XG5cbmZjLm9uKCdzY3JvbGwudG8nLCBkYXRhID0+IHtcbiAgbG9nKFwiW2FkZC1vbl0gUmVjZWl2ZWQgJ3Njcm9sbC50bycgbWVzc2FnZVwiLCBkYXRhKTtcbiAgcGFnZS5zY3JvbGxUbyhkYXRhKTtcbn0pO1xuXG5mYy5vbignc2Nyb2xsLmhvbWUnLCAoKSA9PiB7XG4gIGxvZyhcIlthZGQtb25dIFJlY2VpdmVkICdzY3JvbGwuaG9tZScgbWVzc2FnZVwiKTtcbiAgcGFnZS5zY3JvbGxIb21lKCk7XG59KTtcblxuZmMub24oJ3Njcm9sbC5lbmQnLCAoKSA9PiB7XG4gIGxvZyhcIlthZGQtb25dIFJlY2VpdmVkICdzY3JvbGwuZW5kJyBtZXNzYWdlXCIpO1xuICBwYWdlLnNjcm9sbEVuZCgpO1xufSk7XG5cbmZjLm9uKCdtb3VzZS5tb3VzZXVwJywgZGF0YSA9PiB7XG4gIGxvZyhcIlthZGQtb25dIFJlY2VpdmVkICdtb3VzZS5tb3VzZXVwJyBtZXNzYWdlXCIpO1xuICBwYWdlLm1vdXNlVXAoZGF0YSk7XG59KTtcblxuZmMub24oJ21vdXNlLm1vdXNlZG93bicsIGRhdGEgPT4ge1xuICBsb2coXCJbYWRkLW9uXSBSZWNlaXZlZCAnbW91c2UubW91c2Vkb3duJyBtZXNzYWdlXCIpO1xuICBwYWdlLm1vdXNlRG93bihkYXRhKTtcbn0pO1xuXG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgKCkgPT4ge1xuICBsb2coJ0xvYWRlZCBjb250ZW50IHNjcmlwdCcsIHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcbn0pO1xuXG4vLyBSZW1vdmUgYWxsIGA8bWV0YT5gIHRhZ3Mgc28gYG1vemJyb3dzZXJtZXRhY2hhbmdlYCBldmVudHMgZ2V0IGNhbGxlZC5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdiZWZvcmV1bmxvYWQnLCAoKSA9PiB7XG4gICQkKCdtZXRhJywgZG9jdW1lbnQuaGVhZCkuZm9yRWFjaChlbCA9PiB7XG4gICAgZWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChlbCk7XG4gIH0pO1xufSk7XG5cblxuLy8gU2ltcGxlIHdyYXBwZXIgdG8gZWFzaWx5IHRvZ2dsZSBsb2dnaW5nLlxudmFyIGxvZyA9IGZhbHNlID8gKCkgPT4gY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKSA6ICgpID0+IHt9O1xuIiwiLyoqXG4gKiBBIHNpbXBsZSBldmVudC1lbWl0dGVyIGNsYXNzLiBMaWtlIE5vZGUncyBidXQgbXVjaCBzaW1wbGVyLlxuICovXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMubGlzdGVuZXJzID0ge307XG4gIH1cblxuICBlbWl0KG5hbWUsIC4uLmFyZ3MpIHtcbiAgICAodGhpcy5saXN0ZW5lcnNbbmFtZV0gfHwgW10pLmZvckVhY2goZnVuYyA9PiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIG9uKG5hbWUsIGZ1bmMpIHtcbiAgICBpZiAobmFtZSBpbiB0aGlzLmxpc3RlbmVycykge1xuICAgICAgdGhpcy5saXN0ZW5lcnNbbmFtZV0ucHVzaChmdW5jKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5saXN0ZW5lcnNbbmFtZV0gPSBbZnVuY107XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgb2ZmKG5hbWUpIHtcbiAgICBpZiAobmFtZSkge1xuICAgICAgdGhpcy5saXN0ZW5lcnNbbmFtZV0gPSBbXTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5saXN0ZW5lcnMgPSB7fTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cbiJdfQ==
