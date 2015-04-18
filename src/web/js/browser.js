import * as Navigation from '/js/navigation.js';
import * as Utils from '/js/lib/utils.js';

var runtime = {};
runtime.utils = new Utils();

runtime.navigation = new Navigation();
runtime.navigation.start();
