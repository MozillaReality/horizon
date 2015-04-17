export default class AppFrame {
  constructor(config) {
    this.config = config;
    this.createFrame();
  }

  _handle_new() {
    this.createFrame();
  }

  _handle_back() {

  }

  _handle_forward() {

  }

  _handle_stop() {

  }

  _handle_reload() {

  }

  createFrame() {
    var element = document.createElement('iframe');
    element.setAttribute('src', this.config.url);
    element.setAttribute('remote', 'true');
    element.setAttribute('mozbrowser', 'true');
    element.className = 'frame';
    document.body.appendChild(element);
  }
}
