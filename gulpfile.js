const gulp = require('gulp');
const browserSync = require('browser-sync').create();

// Static server + watching scss/html files
function serve() {
    browserSync.init({
        server: "./",
        port: 3000,
        notify: false
    });

    gulp.watch("./*.html").on('change', browserSync.reload);
    gulp.watch("./*.js").on('change', browserSync.reload);
    gulp.watch("./*.css").on('change', browserSync.reload);
}

exports.default = serve;
