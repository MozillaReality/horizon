import * as FrameManager from '/js/frame_manager.js';
import * as Hotkeys from '/js/hotkeys.js';
import * as Utils from '/js/lib/utils.js';

var runtime = {};
runtime.utils = new Utils();

runtime.frameManager = new FrameManager();
runtime.hotkeys = new Hotkeys();

runtime.frameManager.start(runtime);
runtime.hotkeys.start(runtime);
