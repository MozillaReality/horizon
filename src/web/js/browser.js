import * as FrameManager from '/js/frame_manager.js';
import * as Utils from '/js/lib/utils.js';

var runtime = {};
runtime.utils = new Utils();

runtime.frameManager = new FrameManager();
runtime.frameManager.start();
