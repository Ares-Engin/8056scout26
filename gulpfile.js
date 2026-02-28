const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const postcss = require('gulp-postcss');
const tailwindcss = require('@tailwindcss/postcss');
const atImport = require('postcss-import');
const autoprefixer = require('autoprefixer');

// HTML Task: Just copy to dist
function html() {
    return gulp.src('./src/*.html')
        .pipe(gulp.dest('./docs'));
}

// CSS Task: Process Tailwind WITHOUT minification
function css() {
    const rename = require('gulp-rename');
    return gulp.src('./src/css/input.css')
        .pipe(postcss([
            atImport(),
            tailwindcss(),
            autoprefixer()
        ]))
        .on('error', function (err) {
            console.error('CSS Task Error:', err.toString());
            this.emit('end');
        })
        .pipe(rename('style.css'))
        .pipe(gulp.dest('./docs/css'))
        .pipe(browserSync.stream());
}

// JS Task: Just copy to dist
function js() {
    return gulp.src('./src/js/*.js')
        .pipe(gulp.dest('./docs/js'));
}

// Assets Task: Copy images to dist
function assets() {
    return gulp.src('./src/img/**/*.{png,jpg,jpeg,svg,gif,ico}', { encoding: false })
        .pipe(gulp.dest('./docs/img'));
}

// Data Task: Copy JSON data files to dist
function data() {
    return gulp.src('./src/data/*.json')
        .pipe(gulp.dest('./docs/data'));
}

// Dev Task: Serve and watch
function dev() {
    browserSync.init({
        server: "./docs",
        port: 3000,
        notify: false
    });

    gulp.watch('./src/*.html', html).on('change', browserSync.reload);
    gulp.watch('./src/js/*.js', js).on('change', browserSync.reload);
    gulp.watch('./src/css/input.css', css);
}

// Build Task: Run all tasks
const build = gulp.series(gulp.parallel(html, css, js, assets, data));

// Updated Dev: Build first, then serve and watch
const devTask = gulp.series(build, dev);

exports.html = html;
exports.css = css;
exports.js = js;
exports.assets = assets;
exports.dev = devTask;
exports.build = build;
exports.default = devTask;
