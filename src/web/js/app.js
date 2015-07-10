import React from '../../../node_modules/react';
import Browser from './components/browser.js';

var runtime = {};
React.render(<Browser runtime={runtime}/>, document.body);
