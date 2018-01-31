<!--[![Build Status](https://travis-ci.org/MozVR/horizon.svg?branch=master)](https://travis-ci.org/MozVR/horizon)-->

# Horizon

**An experimental browser written using web standards.**

This browser can be run inside of a standalone Graphene build, or as an [browser extension](https://mozvr.github.io/horizon/horizon.xpi).


## Installation

1. Clone the git repository from GitHub:
    ```sh
    git clone git@github.com:MozVR/horizon.git
    ```
2. Open the working directory:
    ```sh
    cd horizon
    ```
3. Install the Node dependencies:
    ```sh
    npm install
    ```


## Development

To start the server and file watchers run the following on the command line:

```sh
npm start
```

If you wish to serve the site from a different port:

```sh
PORT=8000 npm start
```

### Running inside of a Graphene build

You should build with the Gecko branch mirrored here: https://github.com/mozilla/gecko-projects/tree/larch

Once you have a clone of the project you need to add the following line to a `.mozconfig` file:

```sh
MOZ_HORIZON=1
ac_add_options --enable-application=b2g/graphene
ac_add_options --with-branding=b2g/branding/horizon
mk_add_options MOZ_OBJDIR=obj-horizon
```

Build the gecko project with:
```sh
./mach build
```

You can run the built binary like so:

```sh
/path/to/gecko-projects/obj-graphene/dist/Horizon.app/Contents/MacOS/graphene --start-manifest http://localhost:8000/manifest.webapp
```

### Running as an add-on

This will build and package the add-on into the .xpi file.

```sh
npm run addon
```

To run as an add-on, you will need to simply drop the add-on onto Firefox, or navigate to it with `File` > `Open`.

## Deployment

In production, the server is run like so:

```sh
npm start
```

## Developer Tools

The easiest way to use Developer Tools with this project is to select the `Remote Runtime` option in WebIDE. To do so:

* Open the Firefox Nightly browser
* Navigate to `Tools` > `Web Developer` > `WebIDE`
* Click `Select Runtime` > `Remote Runtime`
* By default you should be able to connect to the running browser at `localhost:6000`


## Maintainers

Run this command to publish a new tag to GitHub and version to npm:

```sh
npm run release
```
