import Debugging from './debugging.js';
import FrameManager from './frame_manager.js';
import ViewportManager from './viewport_manager.js';
import GamepadControl from './controls/gamepad.js';
import KeyboardControl from './controls/keyboard.js';
import Utils from './lib/utils.js';

var runtime = {};
runtime.utils = new Utils();

runtime.debugging = new Debugging();
runtime.frameManager = new FrameManager();
runtime.gamepadControl = new GamepadControl();
runtime.keyboardControl = new KeyboardControl();
runtime.viewportManager = new ViewportManager();

runtime.debugging.start(runtime);
runtime.frameManager.start(runtime);
runtime.gamepadControl.start(runtime);
runtime.keyboardControl.start(runtime);
runtime.viewportManager.start(runtime);
