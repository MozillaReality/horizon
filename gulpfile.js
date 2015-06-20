var fs = require('fs');

var firefoxConnect = require('node-firefox-connect');
var gulp = require('gulp');

var babelify = require('babelify');
var browserify = require('browserify');
var del = require('del');
var eslint = require('gulp-eslint');
var moldSourceMap = require('mold-source-map');
var runSequence = require('run-sequence');
var zip = require('gulp-zip');
var webserver = require('gulp-webserver');

const SRC_ROOT = './src/';
const ADDON_ROOT = './src/addon/';
const CONTENT_SCRIPTS_ROOT = './src/content_scripts/';
const WEB_ROOT = './src/web/';
const DIST_ROOT = './dist/';
const DIST_ADDON_ROOT = './dist/addon/';
const DIST_CONTENT_SCRIPTS_ROOT = './dist/content_scripts/';
const DIST_WEB_ROOT = './dist/web/';
const DIST_WEBVR_DEMOS_ROOT = './node_modules/webvr-demos/public/';


/**
 * runs jslint on all javascript files found in the src dir.
 */
gulp.task('lint', function() {
  // Note: To have the process exit with an error code (1) on
  // lint error, return the stream and pipe to failOnError last.
  return gulp.src([
      WEB_ROOT + 'js/*.js'
    ])
    .pipe(eslint())
    .pipe(eslint.format());
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
gulp.task('install', ['copy-web-app', 'copy-addon-core', 'generate-content-scripts', 'pre-commit']);


/**
 * Copy all non-js directory app source/assets/components.
 */
gulp.task('copy-web-app', function() {
  return gulp.src([
      WEB_ROOT + '**',
      '!' + WEB_ROOT + 'js/{*,**/*}' // do not copy js
    ])
    .pipe(gulp.dest(DIST_WEB_ROOT));
});

gulp.task('copy-addon-core', function() {
  return gulp.src([
      ADDON_ROOT + '**'
    ])
    .pipe(gulp.dest(DIST_ADDON_ROOT));
});

gulp.task('zip-content-scripts', function() {
  return gulp.src(DIST_CONTENT_SCRIPTS_ROOT + '/application/**')
      .pipe(zip('application.zip'))
      .pipe(gulp.dest(DIST_CONTENT_SCRIPTS_ROOT));
});

gulp.task('zip-content-scripts-bundle', function() {
  return gulp.src(DIST_CONTENT_SCRIPTS_ROOT + '/**')
      .pipe(zip('content_scripts.zip'))
      .pipe(gulp.dest(DIST_WEB_ROOT));
});

gulp.task('install-content-scripts-into-dist', function() {
  return gulp.src([
      CONTENT_SCRIPTS_ROOT + '**',
      // Ignore the root file since the browserify+babelify'd bundle
      // is generated separately by the task below.
      '!' + CONTENT_SCRIPTS_ROOT + 'application/content.js'
    ])
    .pipe(gulp.dest(DIST_CONTENT_SCRIPTS_ROOT));
});

gulp.task('babelify-content-scripts', function() {
  return browserify({
    entries: [
      CONTENT_SCRIPTS_ROOT + 'application/content.js',
    ],
    debug: !!!process.env.PRODUCTION
  })
  .transform(babelify.configure({
    sourceMap: !!!process.env.PRODUCTION
  }))
  .bundle()
  .on('error', function (err) {
    console.log('[babelify] Error occurred: ', err.message);
  })
  .pipe(moldSourceMap.transformSourcesRelativeTo(CONTENT_SCRIPTS_ROOT))
  .pipe(fs.createWriteStream(DIST_CONTENT_SCRIPTS_ROOT + 'application/content.js'));
});

gulp.task('generate-content-scripts', function(cb) {
  runSequence('install-content-scripts-into-dist', 'babelify-content-scripts', 'zip-content-scripts', 'zip-content-scripts-bundle', cb);
});


/**
 * converts javascript to es5. this allows us to use harmony classes and modules.
 */
gulp.task('babelify', function() {
  return browserify({
    entries: [
      WEB_ROOT + 'js/browser.js',
      './node_modules/gamepad-plus/src/index.js'
    ],
    debug: !!!process.env.PRODUCTION
  })
  .transform(babelify.configure({
    sourceMap: !!!process.env.PRODUCTION
  }))
  .bundle()
  .on('error', function (err) {
    console.log('[babelify] Error occurred: ', err.message);
  })
  .pipe(moldSourceMap.transformSourcesRelativeTo(WEB_ROOT))
  .pipe(fs.createWriteStream(DIST_WEB_ROOT + 'js/main.js'));
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
  runSequence(['build'], ['make-addon-zip'], cb);
});

gulp.task('make-addon-zip', function() {
  return gulp.src(DIST_ADDON_ROOT + '**')
    .pipe(zip('dist/horizon.xpi'))
    .pipe(gulp.dest(__dirname));
});

/**
 * Runs travis tests
 */
gulp.task('travis', ['lint', 'babelify']);


/**
 * Build the app.
 */
gulp.task('build', function(cb) {
  runSequence(['clobber'], ['copy-web-app', 'copy-addon-core', 'generate-content-scripts'], ['babelify', 'lint'], cb);
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
  }, function() {
    console.log('[remote connect] failed to connect');
    cb();
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
  gulp.watch([SRC_ROOT + '{*,**/*}'], ['buildandreload']);
});


gulp.task('webserver', function() {
  gulp.src([DIST_WEB_ROOT, DIST_WEBVR_DEMOS_ROOT])
    .pipe(webserver({
      port: process.env.PORT || 8000,
      host: process.env.HOST || '0.0.0.0',
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
