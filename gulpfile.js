
/* jshint globalstrict: true */
/* global require */
'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var sass = require('gulp-sass');

var jsFiles = ['gulpfile.js', './js/*.js'];
var sassFiles = './sass/**/*.scss';

gulp.task('jshint', function () {
  gulp.src(jsFiles)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('sass', function () {
  gulp.src(sassFiles)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./css/'));
});

gulp.task('watch', function () {
  gulp.watch(jsFiles, ['jshint']);
  gulp.watch(sassFiles, ['sass']);
});
