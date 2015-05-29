import ContentScripts from './content_scripts.js';
import Debugging from './debugging.js';
import FrameCommunicator from './frame_communicator.js';
import FrameManager from './frame_manager.js';
import ViewportManager from './viewport_manager.js';
import GamepadInput from './inputs/gamepad/index.js';
import KeyboardInput from './inputs/keyboard/index.js';
import Utils from './lib/utils.js';

var runtime = {};
runtime.utils = new Utils();

runtime.contentScripts = new ContentScripts();
runtime.debugging = new Debugging();
runtime.frameCommunicator = new FrameCommunicator('browser');
runtime.frameManager = new FrameManager();
runtime.gamepadInput = new GamepadInput();
runtime.keyboardInput = new KeyboardInput();
runtime.viewportManager = new ViewportManager();

runtime.contentScripts.init(runtime);
runtime.debugging.init(runtime);
runtime.frameCommunicator.init(runtime);
runtime.frameManager.init(runtime);
runtime.gamepadInput.init(runtime);
runtime.keyboardInput.init(runtime);
runtime.viewportManager.init(runtime);
