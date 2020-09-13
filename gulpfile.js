require('dotenv').config();

const gulp = require('gulp');
const gulp_remove_logging = require('gulp-remove-logging');
const minify = require('gulp-minify');

gulp.task('remove-logging', function () {
    return gulp
      .src([
          'src/**/*.js'      ])
      .pipe(
        gulp_remove_logging({
          // Options (optional)
          // eg:
          // namespace: ['console', 'window.console']
        })
      )
      .pipe(gulp.dest("build"));
  });

gulp.task('minify-js', function(){
    return gulp.src('build/**/*.js')
            .pipe(minify({
              ignoreFiles: ['*.min.js', '*-min.js', '*.bundle.js'],
              ext: {

                  min:'.min.js'
              }
            }))
            .pipe(gulp.dest('build', { sourcemaps: true }));;
});
  

gulp.task(
    "default",
    gulp.series(
      "remove-logging",
      "minify-js",
    )
  );
  