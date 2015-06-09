<!---
<!--- Commented out until this repo is public, or we pay for Travis.
[![Build Status](https://travis-ci.org/MozVR/horizon.svg?branch=master)](https://travis-ci.org/MozVR/horizon)
--->

# Horizon

An experimental browser written using web standards. This browser can be run inside of a standalone Graphene build, or as an add-on. Find the add-on here: http://mozvr.github.io/horizon/horizon.xpi

## Installation

1. Clone the git repository from GitHub:

        git clone git@github.com:MozVR/horizon.git

2. Open the working directory:

        cd horizon

3. Install the Node dependencies:

        npm install


## Development

To start the server and file watchers run the following on the command line:

    gulp

If you wish to serve the site from a different port:

    PORT=8000 gulp


### Running inside of a graphene build

You should build with the gecko branch mirrored here: https://github.com/mozilla/gecko-projects/tree/larch

Once you have a clone of the project you need to add the following line to a .mozconfig file:
```
MOZ_HORIZON=1
ac_add_options --enable-application=b2g/graphene
ac_add_options --with-branding=b2g/branding/horizon
```

Build the gecko project with:
```
./mach build
```

You can run the built binary like so:

```
/path/to/gecko-projects/obj-graphene/dist/Horizon.app/Contents/MacOS/graphene --start-manifest http://localhost:8000/manifest.webapp
```

### Running as an add-on

This will build and package the add-on into the .xpi file.

```
gulp addon
```

To run as an add-on, you will need to simply drop the add-on onto Firefox, or navigate to it with File -> Open.

## Deployment

In production, the server is run like so:

    npm start


## Developer Tools

The easiest way to use developer tools with this project is to select the "Remote Runtime" option in WebIDE. To do so:

* Open a Firefox Nightly browser.
* Navigate to Tools -> Web Developer -> WebIDE
* Click Select Runtime -> Remote Runtime
* By default you should be able to connect to the running browser at: localhost:6000
