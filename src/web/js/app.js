import React from 'react';
import ReactDOM from 'react-dom';
import Browser from './components/browser.js';

var runtime = {};

ReactDOM.render(<Browser runtime={runtime}/>, document.querySelector('#browser'));
