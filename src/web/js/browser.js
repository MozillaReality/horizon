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
runtime.settings = {
  www_directory_src: '/directory.json',
  www_browser_start_src: '/media/browser_start.wav',
  www_hud_hide_src: '/media/hud_hide.wav',
  www_hud_show_src: '/media/hud_show.wav',
  www_start_page: 'http://0.0.0.0:8080',
  play_audio_on_browser_start: false,
  hmd_scale: -100,
  pixels_per_meter: 96 / 2.54,
};

runtime.contentScripts.init(runtime);
runtime.debugging.init(runtime);
runtime.frameCommunicator.init(runtime);
runtime.frameManager.init(runtime);
runtime.gamepadInput.init(runtime);
runtime.keyboardInput.init(runtime);
runtime.viewportManager.init(runtime);
