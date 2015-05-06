import * as FrameManager from 'js/frame_manager.js';
import * as ViewportManager from 'js/viewport_manager.js';
import * as GamepadControl from 'js/controls/gamepad.js';
import * as KeyboardControl from 'js/controls/keyboard.js';
import * as Utils from 'js/lib/utils.js';

var runtime = {};
runtime.utils = new Utils();

runtime.frameManager = new FrameManager();
runtime.gamepadControl = new GamepadControl();
runtime.keyboardControl = new KeyboardControl();
runtime.viewportManager = new ViewportManager();

runtime.frameManager.start(runtime);
runtime.gamepadControl.start(runtime);
runtime.keyboardControl.start(runtime);
runtime.viewportManager.start(runtime);
