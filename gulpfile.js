var fs = require('fs');

var firefoxConnect = require('node-firefox-connect');
var gulp = require('gulp');
var gutil = require('gulp-util');

var babelify = require('babelify');
var browserify = require('browserify');
var del = require('del');
var detectBinary = require('graphene-marionette-runner').detectBinary;
var es = require('event-stream');
var eslint = require('gulp-eslint');
var minimist = require('minimist');
var moldSourceMap = require('mold-source-map');
var runSequence = require('run-sequence');
var shell = require('gulp-shell');
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
const DIST_WEB_MODULE_ROOT = './dist/web/js/';


/**
 * runs jslint on all javascript files found in the src dir.
 */
gulp.task('lint', function() {
  // Note: To have the process exit with an error code (1) on
  // lint error, return the stream and pipe to failOnError last.
  return gulp.src([
      WEB_ROOT + 'js/**/*.js'
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

gulp.task('copy-web-css', function() {
  return gulp.src([
      WEB_ROOT + 'css/**'
    ])
    .pipe(gulp.dest(DIST_WEB_ROOT + 'css/'));
});

gulp.task('copy-web-fonts', function() {
  return gulp.src([
      WEB_ROOT + 'fonts/**'
    ])
    .pipe(gulp.dest(DIST_WEB_ROOT));
});

gulp.task('copy-web-media', function() {
  return gulp.src([
      WEB_ROOT + 'media/**'
    ])
    .pipe(gulp.dest(DIST_WEB_ROOT));
});

gulp.task('copy-web-root', function() {
  return gulp.src([
      WEB_ROOT + '*'
    ])
    .pipe(gulp.dest(DIST_WEB_ROOT));
});


gulp.task('copy-web-modules', function() {
 return gulp.src([
      './node_modules/react/dist/react.js'
    ])
    .pipe(gulp.dest(DIST_WEB_MODULE_ROOT));
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

gulp.task('babelify-content-scripts', function(cb) {
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
    console.error('[babelify] Error occurred:\n', err.stack);

    // But don't error out the stream.
    cb();
  })
  .pipe(process.env.PRODUCTION ? gutil.noop() : moldSourceMap.transformSourcesRelativeTo(CONTENT_SCRIPTS_ROOT))
  .pipe(fs.createWriteStream(DIST_CONTENT_SCRIPTS_ROOT + 'application/content.js'));
});

gulp.task('generate-content-scripts', function(cb) {
  runSequence('install-content-scripts-into-dist', 'babelify-content-scripts', 'zip-content-scripts', 'zip-content-scripts-bundle', cb);
});


/**
 * converts javascript to es5. this allows us to use harmony classes and modules.
 */
gulp.task('babelify', function(cb) {
  return browserify({
    entries: [
      WEB_ROOT + 'js/app.js',
      './node_modules/gamepad-plus/src/index.js'
    ],
    debug: !!!process.env.PRODUCTION
  })
  .transform(babelify.configure({
    sourceMap: !!!process.env.PRODUCTION,
    presets: ['react', 'es2015']
  }))
  .bundle()
  .on('error', function (err) {
    console.error('[babelify] Error occurred:\n', err.stack);

    // But don't error out the stream.
    cb();
  })
  .pipe(process.env.PRODUCTION ? gutil.noop() : moldSourceMap.transformSourcesRelativeTo(WEB_ROOT))
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
 * Runs integration tests
 */
gulp.task('test', function(cb) {
  if (!fs.existsSync('./horizon')) {
    throw new Error('Horizon binary not found, please read the README.');
  }

  var options = minimist(process.argv.slice(2));
  var scripts = options.file;
  var binary;
  var testFilePattern = 'test/**/*_test.js';
  if (options.file && options.file.length) {
    testFilePattern = options.file;
  }

  gulp.src(testFilePattern, {read: false})
    .pipe(es.map((function (data, callback) {
      detectBinary('./horizon', {product: 'horizon'}, function(err, _binary) {
        binary = _binary;
        callback(null, data.path + ' ');
      });
    })))
    .pipe(es.wait(function(err, testPaths) {
      var port = process.env.PORT || 8000;
      var host = process.env.HOST || '0.0.0.0';

      gulp.src('')
        .pipe(shell([
          'marionette-mocha ' +
          ' --host-log stdout ' +
          ' --host $(pwd)/node_modules/graphene-marionette-runner/host/index.js ' +
          ' --runtime ' + binary +
          ' --start-manifest http://' + host + ':' + port + '/manifest.webapp ' +
          testPaths
        ]))
        .pipe(es.wait(cb));
    }));
});



/**
 * Build the app.
 */
gulp.task('build', function(cb) {
  runSequence(['clobber'], ['copy-web-app', 'copy-web-modules', 'copy-addon-core', 'generate-content-scripts'], ['babelify', 'lint'], cb);
});

gulp.task('build:addon', function (cb) {
  runSequence(['copy-addon-core', 'generate-content-scripts'], cb);
});

gulp.task('build:css', function (cb) {
  runSequence(['copy-web-css'], cb);
});

gulp.task('build:js', function(cb) {
  runSequence(['copy-web-modules'], ['babelify', 'lint'], cb);
});

gulp.task('build:fonts', function (cb) {
  runSequence(['copy-web-fonts'], 'reload', cb);
});

gulp.task('build:media', function (cb) {
  runSequence(['copy-web-media'], 'reload', cb);
});

gulp.task('build:root', function (cb) {
  runSequence(['copy-web-root'], cb);
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

gulp.task('buildandreload:addon', function (cb) {
  runSequence('build:addon', 'reload', cb);
});

gulp.task('buildandreload:css', function (cb) {
  runSequence('build:css', 'reload', cb);
});

gulp.task('buildandreload:js', function (cb) {
  runSequence('build:js', 'reload', cb);
});

gulp.task('buildandreload:root', function (cb) {
  runSequence('build:root', 'reload', cb);
});

gulp.task('buildandreload:fonts', function (cb) {
  runSequence('build:fonts', 'reload', cb);
});

gulp.task('buildandreload:media', function (cb) {
  runSequence('build:media', 'reload', cb);
});


/**
 * Watch for changes on the file system, and rebuild if so.
 */
gulp.task('watch', function() {
  gulp.watch([SRC_ROOT + '{addon,content_scripts}/**'], ['buildandreload:addon']);
  gulp.watch([WEB_ROOT + 'css/**'], ['buildandreload:css']);
  gulp.watch([WEB_ROOT + 'js/**'], ['buildandreload:js']);

  gulp.watch([WEB_ROOT + 'fonts/**'], ['buildandreload:fonts']);
  gulp.watch([WEB_ROOT + 'media/**'], ['buildandreload:media']);
  gulp.watch([WEB_ROOT + '*'], ['buildandreload:root']);
});


gulp.task('webserver', function() {
  gulp.src(DIST_WEB_ROOT)
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
