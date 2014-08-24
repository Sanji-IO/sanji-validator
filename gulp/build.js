'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

gulp.task('scripts', function() {
  return gulp.src([
    './src/value.js',
    './src/provider.js',
    './src/directive.js',
    './src/module.js'
  ])
 .pipe($.concat('sanji-validator.js'))
 .pipe($.ngAnnotate())
 .pipe(gulp.dest('dist'))
 .pipe($.rename('sanji-validator.min.js'))
 .pipe($.uglify())
 .pipe(gulp.dest('dist'));
});

gulp.task('build', ['scripts']);
