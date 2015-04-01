var gulp = require('gulp');
var connect = require('gulp-connect');

var opt = {
    settings: {
      root: './',
      host: 'localhost',
      port: 8088,
      livereload: {
        port: 35729
      }
    }
  }

gulp.task('default', function() {
  connect.server(opt.settings);
});
