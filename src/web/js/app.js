import React from 'react';
import ReactDOM from 'react-dom';
import Browser from './components/browser.js';
import Overlay from './components/overlay';

var runtime = {};

ReactDOM.render(
  <div>
    <Browser runtime={runtime}/>
    <Overlay/>
  </div>, document.querySelector('#browser'));
