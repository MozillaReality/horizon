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

function FrameCommunicator(name) {
  this._listeners = {};
  this.name = name;

  window.addEventListener('message', function (e) {
    // TODO: Check `e.origin` to make sure it matches the Horizon origin.
    if (e.data && typeof e.data === 'object') {
      this.emit(e.data.type, e.data.data);
    }
  }.bind(this));
}

FrameCommunicator.prototype.emit = function (name) {
  var args = Array.prototype.slice.call(arguments, 1);
  (this._listeners[name] || []).forEach(function (func) {
    func.apply(this, args);
  }, this);
  return this;
};

FrameCommunicator.prototype.on = function (name, func) {
  if (name in this._listeners) {
    this._listeners[name].push(func);
  } else {
    this._listeners[name] = [func];
  }
  return this;
};

FrameCommunicator.prototype.off = function (name) {
  if (name) {
    this._listeners[name] = [];
  } else {
    this._listeners = {};
  }
  return this;
};


var fc = new FrameCommunicator();

fc.on('scroll', function (data) {
  console.log('[add-on] Received scroll message', data);

  if ('scrollTop' in data) {
    document.documentElement.scrollTop += data.scrollTop;
  }
  if ('scrollLeft' in data) {
    document.documentElement.scrollLeft += data.scrollLeft;
  }
});

window.addEventListener('load', function () {
  console.log('Got content script', window.location.href);
});

window.addEventListener('unload', function () {
  fc.off();
});
