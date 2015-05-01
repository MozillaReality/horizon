[![Build Status](https://travis-ci.org/MozVR/horizon.svg?branch=master)](https://travis-ci.org/MozVR/horizon)

# Horizon

An experimental browser written using web standards. This browser can be run inside of a standalone Graphene build, or as an addon. Find the addon here: http://mozvr.github.io/horizon/horizon.xpi

## Installation

1. Clone the git repository from GitHub:

        git clone git@github.com:MozVR/horizon.git

2. Open the working directory:

        cd horizon

3. Install the Node dependencies:

        npm install


## Development

To start the server and file watchers:

    npm start

Then launch the site from your favourite browser:

[__http://localhost:8000/__](http://localhost:8000/)

If you wish to serve the site from a different port:

    PORT=8000 npm start


### Running inside of a graphene build

We are currently using a fork of graphene with some minor modifications here: https://github.com/KevinGrandon/gecko-projects/tree/larch_vr/

Once you have a clone of the project you need to add the following line to a .mozconfig file:
```
--enable-application=b2g/graphene
```

Build the gecko project with:
```
./mach build
```

You can run the built binary like so:

```
/path/to/gecko-projects/obj-graphene/dist/HIRO.app/Contents/MacOS/graphene --start-manifest http://localhost:8000/manifest.webapp
```


### Running as an addon.
TODO...

### Packaging the addon.

This will build and package the addon into the .xpi file.

```
gulp addon
```

## Deployment

In production, the server is run like so:

    npm start


## Developer Tools

The easiest way to use developer tools with this project is to select the "Remote Runtime" option in WebIDE. To do so:

* Open a Firefox Nightly browser.
* Navigate to Tools -> Web Developer -> WebIDE
* Click Select Runtime -> Remote Runtime
* By default you should be able to connect to the running browser at: localhost:6000
