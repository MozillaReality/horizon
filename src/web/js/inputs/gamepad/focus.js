const DEFAULT_CONFIG = {
  pseudoActiveClassName: 'colon-active',
};

export default class GamepadFocus {

  constructor(opts) {
    opts = opts || {};

    this.config = Object.assign({}, DEFAULT_CONFIG, opts.config || {});
  }

  init(runtime) {
    this.runtime = runtime;
    this.utils = runtime.utils;
  }

  getTargetEl(el, dir) {
    if (!el) {
      // Select the first element we find.
      return $(this.utils.FOCUSABLE_ENABLED_ELEMENTS.join(','));
    }

    let value = this.getNavDirValue(el, dir);
    value = (value || '').trim();

    if (value === 'none') {
      return;
    }

    let activeEl;
    let targetEl;

    if (value) {
      // Prepend a `#` if it's missing.
      if (value[0] !== '#') {
        value = '#' + value;
      }

      let selector = value;
      let targetName;

      // Parse format (e.g., `nav-right: #nav__forward "mainIframe"`).
      let valueParts = selector.match(/(\S\w*)\s*['"](.+)['"]/);

      if (valueParts) {
        selector = valueParts[1];
        targetName = valueParts[2];

        // Per the spec, handle when a `nav-` value points to an frame.
        let targetFrame = $(`[name="${targetName}"]`);
        if (targetFrame) {
          activeEl = this.activeElement;

          if (targetFrame.contentWindow === (activeEl.ownerDocument.defaultView || activeEl.ownerDocument.parentWindow)) {
            targetEl = $(selector);
          } else {
            try {
              targetEl = targetFrame.contentWindow.document.querySelector(selector);
            } catch (e) {
              // It was probably a cross-origin iframe we didn't have permission to access.
              targetEl = $(selector);
            }
          }
        }
      } else {
        targetEl = $(selector);
      }

      // If the target element is not focusable, use the closest sibling.
      if (targetEl && !this.utils.isElementFocusableAndEnabled(targetEl)) {
        targetEl = this._findFocusableSibling(activeEl || this.activeElement, dir);
      }
    }

    // Per the CSS3 UI spec:
    // "If no element matches the selector, the user agent automatically
    // determines which element to navigate the focus to."
    if (!value || !targetEl) {
      value = 'auto';
    }

    // We do some cleverish/amateurish heuristics to figure out the target element.
    if (value === 'auto') {
      activeEl = activeEl || this.activeElement;

      let displayStyle = getComputedStyle(activeEl).getPropertyValue('display');

      if (displayStyle === 'inline' ||
          displayStyle === 'inline-block' ||
          displayStyle === 'flex')
      {
        targetEl = this._findFocusableInlineSibling(activeEl, dir);
      } else {
        targetEl = this._findFocusableInlineSibling(activeEl, dir);
        // targetEl = this._findFocusableBlockSibling(activeEl, dir);
      }
    }

    if (targetEl && targetEl === activeEl) {
      return;
    }

    return targetEl;
  }

  /**
   * Finds the element that appears in the DOM before/after the currently
   * focused element.
   *
   * @param {Element} el DOM element to get direction from.
   * @param {String} dir Desired direction to move focus to.
   */
  _findFocusableInlineSibling(el, dir) {
    let targetEls = $$(this.utils.FOCUSABLE_ELEMENTS.join(','));
    let targetIdx = targetEls.indexOf(el);
    let i = 0;

    if (dir === 'left' || dir === 'up') {
      for (i = targetIdx - 1; i >= 0; i--) {
        if (this.utils.isElementFocusableAndEnabled(targetEls[i])) {
          return targetEls[i];
        }
      }
    }

    if (dir === 'right' || dir === 'down') {
      for (i = targetIdx + 1; i < targetEls.length; i++) {
        if (this.utils.isElementFocusableAndEnabled(targetEls[i])) {
          return targetEls[i];
        }
      }
    }
  }

  /**
   * Finds the element that visually appears to be the next element to
   * directionally navigate to.
   *
   * @param {Element} el DOM element to get direction from.
   * @param {String} dir Desired direction to move focus to.
   */
  _findFocusableBlockSibling(el, dir) {
    // Adapted from https://github.com/potch/visual-tab

    let distance = Infinity;
    let occlusion = 0;
    let offset = Infinity;
    let rect = el.getBoundingClientRect();
    let targetEl;

    let centerX = (rect.left + rect.right) / 2;
    let centerY = (rect.top + rect.bottom) / 2;

    $$(this.utils.FOCUSABLE_ENABLED_ELEMENTS).forEach(tEl => {
      if (tEl === el) {
        return;
      }

      let tgt = tEl.getBoundingClientRect();

      let cx = (tgt.left + tgt.right) / 2;
      let cy = (tgt.top + tgt.bottom) / 2;

      let dx;
      let dy;
      let off;
      let a1;
      let a2;
      let b1;
      let b2;
      let dim1;
      let dim2;

      switch (dir) {
        case 'up':
        case 'down':
          dx = centerX - cx;
          off = dy;
          a1 = rect.left;
          a2 = tgt.left;
          b1 = rect.right;
          b2 = tgt.right;
          dim1 = rect.right - rect.left;
          dim2 = tgt.right - tgt.left;
          /* falls through */
        case 'up':
          dy = rect.top - tgt.bottom;
          break;
        case 'down':
          dy = tgt.top - rect.bottom;
          break;

        case 'left':
        case 'right':
          dy = centerY - cy;
          a1 = rect.top;
          a2 = tgt.top;
          b1 = rect.bottom;
          b2 = tgt.bottom;
          off = dx;
          dim1 = rect.bottom - rect.top;
          dim2 = tgt.bottom - tgt.top;
          /* falls through */
        case 'left':
          dx = rect.left - tgt.right;
          break;
        case 'right':
          dx = tgt.left - rect.right;
          break;
      }

      // Not visible.
      if (off < 0) {
        return;
      }

      let d = Math.sqrt(dx * dx + dy * dy);

      let occ = 0;
      if (a1 <= b2 && b2 <= b1) {
        occ = (b2 - a1) / dim1;
      }
      if (a1 <= a2 && a2 <= b1) {
        occ = (b1 - a2) / dim1;
      }
      if (a1 <= a2 && a2 <= b1 && a1 <= b2 && b2 <= b1) {
        occ = dim2 / dim1;
      }
      if (a2 <= a1 && b1 <= b2) {
        occ = 1;
      }

      if (occ === 0 && occlusion === 0) {
        if (off < offset || (d < distance && off / offset < 1.2)) {
          targetEl = tEl;
          offset = off;
          distance = d;
          occlusion = occ;
        }
      } else {
        if (occ > 0 && occlusion === 0) {
          targetEl = tEl;
          offset = off;
          distance = d;
          occlusion = occ;
        } else if (off < offset && occ > 0) {
          targetEl = tEl;
          offset = off;
          distance = d;
          occlusion = occ;
        } else if (off === offset && occ > occlusion) {
          targetEl = tEl;
          offset = off;
          distance = d;
          occlusion = occ;
        }
      }
    });

    return targetEl;
  }

  nav(dir) {
    let targetEl = this.getTargetEl(this.activeElement, dir);

    // We found an element we can focus.
    if (targetEl) {
      targetEl.focus();
      return targetEl;
    }
  }

  navUp() {
    return this.nav('up');
  }

  navDown() {
    return this.nav('down');
  }

  navLeft() {
    return this.nav('left');
  }

  navRight() {
    return this.nav('right');
  }

  clickDown() {
    let el = this.activeElement;
    if (!el) {
      return;
    }

    el.dispatchEvent(new Event('mousedown'));
    el.classList.add(this.config.pseudoActiveClassName);
  }

  clickUp() {
    let el = this.activeElement;
    if (!el) {
      return;
    }

    el.dispatchEvent(new Event('mouseup'));
    el.classList.remove(this.config.pseudoActiveClassName);
    el.click();

    // Check if the active element is a form element.
    let form = this.utils.getFocusedForm(el);
    if (form) {
      // If so, submit the form.
      form.submit();
      form.dispatchEvent(new Event('submit'));
    }
  }

  get activeElement() {
    var el = document.activeElement;
    if (this.utils.isElementFocusable(el)) {
      return el;
    }
  }

  /**
   * Returns an array of functions of candidates that may return which
   * element to navigate the focus.
   *
   * Uses directional focus navigation per the W3C's CSS3 UI spec:
   *
   *     http://www.w3.org/TR/css3-ui/#nav-dir
   *
   * @param {Element} el DOM element to get direction of.
   * @param {String} dir Desired direction to move focus to.
   * @returns {Array} An array of functions of candidate strategies.
   */
  getNavDirStrategies(el, dir) {
    return [
      () => el.getAttribute('data-nav-' + dir),
      () => this.utils.parseInlineStyle(el)['nav-' + dir],
      () => el.style['nav' + this.utils.toTitleCase(dir)],
      () => getComputedStyle(el).getPropertyValue('nav-' + dir),
    ];
  }

  /**
   * Iterates through all possible strategies and returns the target
   * navigation direction value.
   *
   * @param {Element} el DOM element to get direction of.
   * @param {String} dir Desired direction to move focus to.
   * @returns {String} The target navigation direction value (usually a selector).
   */
  getNavDirValue(el, dir) {
    let strategies = this.getNavDirStrategies(el, dir);

    let match;
    for (var i = 0, n = strategies.length; i < n; i++) {
      match = strategies[i]();

      if (match) {
        return match;
      }
    }
  }

  /**
   * Assigns focus configurations.
   * @param {Object} config Options for focus constants.
   */
  assign(config) {
    this.config = config;
  }
}
