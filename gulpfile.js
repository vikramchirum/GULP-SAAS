'use strict';

let gulp = require('gulp'),
    gulputil = require('gulp-util'),
    path = require('path'),
    rename = require('gulp-rename'),
    sass = require('gulp-sass'),
    postcss = require('gulp-postcss'),
    cssnano = require('cssnano'),
    autoprefixer = require('autoprefixer'),
    plumber = require('gulp-plumber'),
    sourcemaps = require('gulp-sourcemaps'),
    del = require('del'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify');

let $$ = require('gulp-load-plugins')({
    pattern: ['gulp-*', 'del', 'merge-stream']
});

let paths = {
    jsSourcePath: './Scripts/**/*.js',
    stylesLandingSourcePath: './Styles/**/landing.scss',
    stylesDashBoardSourcePath: './Styles/**/dashboard.scss',

    stylesLandingOutputPath: './wwwroot/dist/css/',
    stylesDashBoardOutputPath: './wwwroot/dist/css/',
    jsOutputPath: './wwwroot/dist/js/'
};

gulp.task('clean:css', () => {
    return del(['./wwwroot/dist/css/**', '!css'], { force: true });
});

gulp.task('clean:js', () => {
    return del(['./wwwroot/dist/js/**', '!js'], { force: true });
});

gulp.task('clean', gulp.series('clean:css', 'clean:js')); 

gulp.task('process:SassLandingStyles', async function () {
    await processStyles(paths.stylesLandingSourcePath, paths.stylesLandingOutputPath);
});

gulp.task('process:SassDashBoardStyles', async function () {
    await processStyles(paths.stylesDashBoardSourcePath, paths.stylesDashBoardOutputPath);
});

gulp.task('minify:LandingStyles', async function () {
    await minifyStyles(paths.stylesLandingSourcePath, paths.stylesLandingOutputPath);
});

gulp.task('minify:DashBoardStyles', async function () {
    await minifyStyles(paths.stylesDashBoardSourcePath, paths.stylesDashBoardOutputPath);
});

gulp.task('build:js', function () {

    let nSrc = 0, nDes = 0;
    gulputil.log(`Starting to build the JS files in ${paths.jsSourcePath} into one file.`);

    return gulp.src([paths.jsSourcePath])
        .on("data", () => nSrc += 1)
        // This will output the non-minified version
        .pipe(concat('scripts.js'))
        .pipe(gulp.dest(paths.jsOutputPath))
        .on("data", () => nDes += 1)
        .on("finish", function () {
            gulputil.log("# src files: ", nSrc);
            gulputil.log("# dest files:", nDes);
            gulputil.log(`Concatination JS files in ${paths.jsSourcePath} is done and outputted to ${paths.jsOutputPath}`);
        });
});

gulp.task('minify:js', function () {

    let nSrc = 0, nDes = 0;
    gulputil.log(`Starting to build the JS files in ${paths.jsSourcePath} into one file and 
                  minify them.`);

    return gulp.src([paths.jsSourcePath])
        .on("data", () => nSrc += 1)
        // This will output the non-minified version
        .pipe(concat('scripts.js'))
        .pipe(gulp.dest(paths.jsOutputPath))
        .on("data", () => nDes += 1)
        // this will output the minfied version and rename to scripts.min.js
        .pipe(uglify())
        .pipe(rename({ extname: '.min.js' }))
        .pipe(gulp.dest(paths.jsOutputPath))
        .on("finish", function () {
            gulputil.log("# src files: ", nSrc);
            gulputil.log("# dest files:", nDes);
            gulputil.log(`Concatination and Minification of JS files in ${paths.jsSourcePath} is done and outputted to ${paths.jsOutputPath}`);
        });
});

gulp.task('build:styles', gulp.series('process:SassLandingStyles'
    , 'process:SassDashBoardStyles'
    , 'minify:LandingStyles'
    , 'minify:DashBoardStyles'
));

gulp.task('build:dev', gulp.series(
    'clean'
    , 'process:SassLandingStyles'
    , 'process:SassDashBoardStyles'
    , 'build:js'
));

gulp.task('build:prod', gulp.series(
    'clean'
    , 'minify:LandingStyles'
    , 'minify:DashBoardStyles'
    , 'minify:js'
));

/*
gulp.task('watch', function () {
    gulp.watch(paths.stylesSourcePath, ['processSassStyles', 'minifyStyles']);
});*/

const processStyles = (inputPath, outputPath) => {

    let nSrc = 0, nDes = 0;
    gulputil.log(`Starting to convert the SASS files in ${inputPath}`);
    return gulp.src(inputPath)
        .on("data", () => nSrc += 1)
        .pipe(sourcemaps.init())
        .pipe(plumber())
        .pipe(sass().on('error', sass.logError)).on('error', errorHandler('Processing SASS Error'))
        .pipe(rename(function (path) {
            path.basename = path.basename.toLocaleLowerCase();
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(outputPath))
        .on("data", () => nDes += 1)
        .on("finish", function () {
            gulputil.log("# src files: ", nSrc);
            gulputil.log("# dest files:", nDes);
            gulputil.log(`Conversion of SASS files to CSS in ${inputPath} is done
                      and outputted to ${outputPath}`);
        });
};

const minifyStyles = (inputPath, outputPath) => {

    let nSrc = 0, nDes = 0;
    let plugins = [
        autoprefixer(), cssnano()
    ];

    gulputil.log(`Starting to convert the SASS files to CSS in ${inputPath} and 
                 and minify them.`);

    return gulp.src(inputPath)
        .on("data", () => nSrc += 1)
        .pipe(sourcemaps.init())
        .pipe(plumber())
        .pipe(sass().on('error', sass.logError)).on('error', errorHandler('Processing SASS Error'))
        .pipe(postcss(plugins)).on('error', errorHandler('Error in Autoprefixer and cssnano'))
        .pipe(rename(function (path) {
            path.basename = path.basename.toLocaleLowerCase() + '.min';
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(outputPath))
        .on("data", () => nDes += 1)
        .on("finish", function () {
            gulputil.log("# src files: ", nSrc);
            gulputil.log("# dest files:", nDes);
            gulputil.log(`Conversion of SASS files to CSS and minification in ${inputPath} is done
                      and outputted to ${outputPath}`);
        });
};

const errorHandler = (title) => {
    return function (err) {
        gulputil.logError(gulputil.colors.red(`[${title}]`), err.toString());
    };
};