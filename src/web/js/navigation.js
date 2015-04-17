export default class Navigation {
  constructor() {
    this.newFrameTrigger = $('#new-frame-trigger');

    this.appendFrame();
  }

  handleEvent(e) {
    this.appendFrame();
  }

  appendFrame() {
    var newFrame = document.createElement('iframe');
    newFrame.setAttribute('src', 'http://mozilla.org')
    newFrame.setAttribute('remote', 'true')
    newFrame.setAttribute('mozbrowser', 'true')
    newFrame.className = 'frame';
    document.body.appendChild(newFrame);
  }

  start() {
    this.newFrameTrigger.addEventListener('click', this);
  }
}
