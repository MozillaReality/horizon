// test page: http://jsfiddle.net/cdcnn34k/

export default class PermissionPrompt extends React.Component {
  constructor(props) {
    super(props);
    console.log('Constructing!');
    window.addEventListener('mozChromeEvent', this);
  }

  get request() {
    return this.state && this.state.request;
  }

  handleEvent(e) {
    console.log('debug chrome event is', e.detail.type);
    var detail = e.detail;
    switch (detail.type) {
      case 'permission-prompt':
        this.setState('request', detail);
        break;
      case 'cancel-permission-prompt':
        this.hidePrompt();
        break;
    }
  }

  hidePrompt() {
    this.setState('request', null);
  }

  grant() {
    var req = this.request;
    var details = {
      id: req.id,
      remember: true
    };

    // Populate default choices.
    if (req.permissions['audio-capture'] || req.permissions['video-capture']) {
      details.choices = {};
      for (var perm in req.permissions) {
        if (req.permissions[perm].length > 0) {
          details.choices[perm] = req.permissions[perm][0];
        }
      }
    }

    details.type = 'permission-allow';
    dispatchEvent(new CustomEvent('mozContentEvent',
      {bubbles: true, cancelable: false, detail: details}));
    this.hidePrompt();
  }

  deny() {
    var details = {
      id: this.request.id,
      type: 'permission-deny',
      remember: true
    };
    dispatchEvent(new CustomEvent('mozContentEvent',
      {bubbles: true, cancelable: false, detail: details}));
    this.hidePrompt();
  }

  render() {
    if (!this.request) {
      return null;
    }

    return <div className='dialog'>
      <menu className='permissionPrompt'>
        <section className='body'>
          <h1>Permission Request</h1>
          <p>{this.request.origin} is asking for the following permissions:</p>
          <ul>
          {
            Object.keys(this.request.permissions).map(permission =>
              <li>{permission}</li>
            )
          }
          </ul>
        </section>
        <span onClick={this.deny.bind(this)} />
        <span onClick={this.grant.bind(this)} />
      </menu>
    </div>;
  }
}
