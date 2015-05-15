import Debugging from './debugging.js';
import FrameManager from './frame_manager.js';
import ViewportManager from './viewport_manager.js';
import GamepadInput from './inputs/gamepad/index.js';
import KeyboardInput from './inputs/keyboard/index.js';
import Utils from './lib/utils.js';

var runtime = {};
runtime.utils = new Utils();

runtime.debugging = new Debugging();
runtime.frameManager = new FrameManager();
runtime.gamepadInput = new GamepadInput();
runtime.keyboardInput = new KeyboardInput();
runtime.viewportManager = new ViewportManager();

runtime.debugging.start(runtime);
runtime.frameManager.start(runtime);
runtime.gamepadInput.start(runtime);
runtime.keyboardInput.start(runtime);
runtime.viewportManager.start(runtime);
