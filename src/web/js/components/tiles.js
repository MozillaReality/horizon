import Settings from '../settings.js';

export default class Directory extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      sites: []
    };

    // Loads JSON for Directory.
    fetch(Settings.jsonDirectoryUrl)
    .then(response => {
      return response.json();
    })
    .then(data => {
      this.setState({
        sites: data.sites
      });
    });
  }

  render() {
    return <div id='directory' className='directory threed' ref='directory'>
    {
      this.state.sites.map((site, key) =>
        <a className='directory__tile' href={site.url} key={`site${key}`}>
          {site.name}
          <span className='type'>
            {site.type}
          </span>
        </a>)
    }
    </div>;
  }
}
