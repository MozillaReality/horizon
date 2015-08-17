import Browser from './components/browser.js';

var runtime = {};
window.runtime = runtime; // Expose runtime to the window object for test hooks.
React.render(<Browser runtime={runtime}/>, document.body);
