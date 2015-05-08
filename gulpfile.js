var firefoxConnect = require('node-firefox-connect');
var gulp = require('gulp');

var babel = require('gulp-babel');
var del = require('del');
var jshint = require('gulp-jshint');
var runSequence = require('run-sequence');
var zip = require('gulp-zip');
var webserver = require('gulp-webserver');

const SRC_ROOT = './src/';
const ADDON_ROOT = './src/addon/';
const STANDALONE_ROOT = './src/standalone/';
const WEB_ROOT = './src/web/';
const DIST_ROOT = './dist/';
const DIST_ADDON_ROOT = './dist/addon/';
const DIST_WEB_ROOT = './dist/web/';


/**
 * runs jslint on all javascript files found in the src dir.
 */
gulp.task('lint', function() {
  // Note: To have the process exit with an error code (1) on
  // lint error, return the stream and pipe to failOnError last.
  return gulp.src([
      WEB_ROOT + 'js/*.js'
    ])
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'));
});


/**
 * Install pre-commit hook for app.
 */
gulp.task('pre-commit', function() {
  return gulp.src(['./pre-commit'])
    .pipe(gulp.dest('.git/hooks/'));
});


/**
 * Setup steps after an npm install.
 */
gulp.task('install', ['copy-web-app', 'copy-addon-core', 'pre-commit']);


/**
 * Copy all non-js directory app source/assets/components.
 */
gulp.task('copy-web-app', function() {
  return gulp.src([
      WEB_ROOT + '**',
      '!' + WEB_ROOT + 'js/*.js' // do not copy js
    ])
    .pipe(gulp.dest(DIST_WEB_ROOT));
});

gulp.task('copy-addon-core', function() {
  return gulp.src([
      ADDON_ROOT + '**'
    ])
    .pipe(gulp.dest(DIST_ADDON_ROOT));
});

/**
 * converts javascript to es5. this allows us to use harmony classes and modules.
 */
gulp.task('babel', function() {
  var files = [
    WEB_ROOT + 'js/*.js',
    WEB_ROOT + 'js/**/*.js',
    '!' + WEB_ROOT + 'js/ext/*.js' // do not process external files
  ];
  try {
    return gulp.src(files)
      .pipe(babel({
        modules: 'amd'
      }).on('error', function(e) {
        console.log('error running babel', e);
      }))
      .pipe(gulp.dest(DIST_WEB_ROOT + 'js/'));
  } catch (e) {
    console.log('Got error in babel', e);
  }
});


/**
 * Packages the application into a zip.
 */
gulp.task('zip', function() {
  return gulp.src(DIST_WEB_ROOT)
    .pipe(zip('app.zip'))
    .pipe(gulp.dest(DIST_ROOT));
});

/**
 * Packages the addon into a zip.
 */
gulp.task('addon', function(cb) {
  runSequence(['build'], ['make-addon-zip' ], cb);
});

gulp.task('make-addon-zip', function() {
  return gulp.src(DIST_ADDON_ROOT + '**')
    .pipe(zip('dist/horizon.xpi'))
    .pipe(gulp.dest(__dirname));
});

/**
 * Runs travis tests
 */
gulp.task('travis', ['lint', 'babel']);


/**
 * Build the app.
 */
gulp.task('build', function(cb) {
  runSequence(['clobber'], ['copy-web-app', 'copy-addon-core'], ['babel', 'lint' ], cb);
});


/**
 * Reload the Horizon app (via remote debugging runtime).
 */
gulp.task('reload', function (cb) {
  firefoxConnect(process.env.REMOTE_DEBUG_PORT || 6000).then(function (client) {
    client.getWebapps(function (err, webapps) {
      webapps.listRunningApps(function (err, apps) {
        if (err) {
          throw '[remote connect] Error occurred: ' + err;
        }

        if (!apps.length) {
          console.warn('[remote connect] No apps found');
          return;
        }

        webapps.getApp(apps[0], function (err, app) {
          console.log('[remote connect] Reloading %s', apps[0]);

          app.reload(function () {
            console.log('[remote connect] Reloaded');
            client.disconnect();
            cb();
          });
        });
      });
    });
  });
});


/**
 * First `build` the files, and then call `reload` to reload the app.
 */
gulp.task('buildandreload', function (cb) {
  runSequence('build', 'reload', cb);
});


/**
 * Watch for changes on the file system, and rebuild if so.
 */
gulp.task('watch', function() {
  // TODO: We should probably prevent Horizon app from being reloaded if only
  // the `src/addon/` files change.
  gulp.watch([SRC_ROOT + '**'], ['buildandreload']);
});


gulp.task('webserver', function() {
  gulp.src(DIST_WEB_ROOT)
    .pipe(webserver({
      port: process.env.PORT || 8000,
      host: process.env.HOST || 'localhost',
      livereload: false,
      directoryListing: false,
      open: false
    }));
});

/**
 * The default task when `gulp` is run.
 * Adds a listener which will re-build on a file save.
 */
gulp.task('default', function() {
  runSequence('build', 'webserver', 'watch');
});

/**
 * Remove the distributable files.
 */
gulp.task('clobber', function(cb) {
  del('dist/**', cb);
});

/**
 * Cleans all created files by this gulpfile, and node_modules.
 */
gulp.task('clean', function(cb) {
  del([
    'dist/',
    'node_modules/'
  ], cb);
});
