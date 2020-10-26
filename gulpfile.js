require('dotenv').config();

const gulp = require('gulp');
const clean = require('gulp-clean');
const gulp_remove_logging = require('gulp-remove-logging');
const minify = require('gulp-minify');
const livereload = require('gulp-livereload');


const KEEP_LOGS = !!process.env.LOG;

gulp.task('clean-build', function () {
  return gulp.src('build', {
          read: false,
            allowEmpty: true
          })
          .pipe(clean());
});

gulp.task('remove-logging', function () {
  return gulp
          .src([
              'src/**/*.js'])
          .pipe(
            gulp_remove_logging({
              /** 
               * `console.ignore` will make it look for `console.ignore.log`,
               * which doesn't exist, thus `console.log` will be ignored...
               */
              namespace: KEEP_LOGS ? ['console.ignore'] : ['console', 'window.console']
            })
          )
          .pipe(gulp.dest("build"));
});

gulp.task('minify-js', function(){
  return gulp.src('build/**/*.js')
          .pipe(minify({
            ext: {
              min:'.min.js'
            },
            ignoreFiles: ['-min.js'],
          }))
          .pipe(gulp.dest('build', { sourcemaps: true }));
});
  

gulp.task(
  "default",
  gulp.series(
    "clean-build",
    "remove-logging",
    "minify-js",
  )
);
  

gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('src/**/*.js', gulp.parallel('default'));
});