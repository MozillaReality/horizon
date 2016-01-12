import Browser from './components/browser.js';
import ReactDOM from 'react-dom';

var runtime = {};
ReactDOM.render(<Browser runtime={runtime}/>, document.querySelector('#browser'));
