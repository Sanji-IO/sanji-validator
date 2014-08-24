var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

var concat = require('gulp-concat');
var ngAnnotate = require('gulp-ng-annotate');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

gulp.task('scripts', function() {
  return gulp.src([
    './src/value.js',
    './src/provider.js',
    './src/directive.js',
    './src/module.js'
  ])
 .pipe(concat('sanji-validator.js'))
 .pipe(ngAnnotate())
 .pipe(gulp.dest('dist'))
 .pipe(rename('sanji-validator.min.js'))
 .pipe(uglify())
 .pipe(gulp.dest('dist'));
});

gulp.task('default', ['scripts']);

var browserSync = require('browser-sync');

gulp.task('webdriver-update', $.protractor.webdriver_update);

gulp.task('webdriver-standalone', $.protractor.webdriver_standalone);

gulp.task('protractor-only', ['webdriver-update', 'wiredep'], function (done) {
  var testFiles = [
    'test/e2e/**/*.js'
  ];

  gulp.src(testFiles)
    .pipe($.protractor.protractor({
      configFile: 'test/protractor.conf.js',
    }))
    .on('error', function (err) {
      // Make sure failed tests cause gulp to exit non-zero
      throw err;
    })
    .on('end', function () {
      // Close browser sync server
      browserSync.exit();
      done();
    });
});

gulp.task('protractor', ['serve:e2e', 'protractor-only']);
gulp.task('protractor:src', ['serve:e2e', 'protractor-only']);
gulp.task('protractor:dist', ['serve:e2e-dist', 'protractor-only']);

var wiredep = require('wiredep');

gulp.task('test', function() {

  var bowerDeps = wiredep({
    directory: 'bower_components',
    exclude: ['bootstrap-sass-official'],
    dependencies: true,
    devDependencies: true
  });

  var testFiles = bowerDeps.js.concat([
    'src/**/*.js',
    'test/unit/**/*.js'
  ]);

  return gulp.src(testFiles)
    .pipe($.karma({
      configFile: 'test/karma.conf.js',
      action: 'run'
    }))
    .on('error', function(err) {
      // Make sure failed tests cause gulp to exit non-zero
      throw err;
    });
});
