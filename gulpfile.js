let project_folder = 'dist'
let source_folder = 'src'

let fs = require('fs')

let path = {
    build: {
        html: project_folder + '/',
        css: project_folder + '/css/',
        js: project_folder + '/js/',
        img: project_folder + '/img/',
        fonts: project_folder + '/fonts/',

    },
    src: {
        html:[ source_folder + '/*.html', "!" + source_folder + '/_*.html'],
        css: source_folder + '/scss/style.scss',
        js: source_folder + '/js/script.js',
        img: source_folder + '/img/**/*.{jpg,png,sng,gif,ico,webp}',
        fonts: source_folder + '/fonts/*.ttf',

    },
    watch: {
        html: source_folder + '/**/*.html',
        css: source_folder + '/scss/**/*.scss',
        js: source_folder + '/js/**/*.js',
        img: source_folder + '/img/**/*.{jpg,png,sng,gif,ico,webp}',
    },
    clean: './' + project_folder + '/'
}

let {src, dest} = require('gulp'),
    gulp = require('gulp'),
    scss = require('gulp-sass')(require('sass')),
    createBrowserSync = require('browser-sync').create(),
    fileInclude = require('gulp-file-include'),
    del = require('del'),
    autoprefixer = require('gulp-autoprefixer'),
    groupMedia = require('gulp-group-css-media-queries'),
    cleanCss = require('gulp-clean-css'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify-es').default,
    imageMin = require('gulp-imagemin'),
    webp = require('gulp-webp'),
    webpHtml = require('gulp-webp-html'),
    webpCss = require('gulp-webpcss'),
    svgSprite = require('gulp-svg-sprite'),
    tts2woff = require('gulp-ttf2woff'),
    tts2woff2 = require('gulp-ttf2woff2'),
    fonter =  require('gulp-fonter')

function browserSync(params) {
    createBrowserSync.init({
        server: {
            baseDir: './' + project_folder + '/'
        },
        port: 3000,
        notify: false
    })
}
function fonts(){
    src(path.src.fonts)
        .pipe(tts2woff())
        .pipe(dest(path.build.fonts))
    return  src(path.src.fonts)
        .pipe(tts2woff2())
        .pipe(dest(path.build.fonts))
}
function buildStyles(){
    return src(path.src.css)
        .pipe(
            scss({
                outputStyle: 'expanded'
            })
        )
        .pipe(groupMedia())
        .pipe(
            autoprefixer({
                overrideBrowserslist : ['last 5 versions '],
                cascade:true
            })
        )
        .pipe(webpCss({
            webpClass: '.webp',
            noWebpClass: '.no-webp'
        }))
        .pipe(dest(path.build.css))
        .pipe(cleanCss())
        .pipe(
            rename({
                extname: '.min.css'
            })
        )
        .pipe(dest(path.build.css))
        .pipe(createBrowserSync.stream())
}

function html() {
    return src(path.src.html)
        .pipe(fileInclude())
        .pipe(webpHtml())
        .pipe(dest(path.build.html))
        .pipe(createBrowserSync.stream())
}
function img() {
    return src(path.src.img)
        .pipe(
            webp({
                quality: 70
            })
        )
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(
            imageMin({
                progressive: true,
                svgoPlugins: [{removeViewBox: false}],
                interlaced: true,
                optimizationLevel: 3,
            })
        )
        .pipe(dest(path.build.img))
        .pipe(createBrowserSync.stream())
}
gulp.task('otf2ttf', ()=>{
    return src([source_folder + '/fonts/*.otf'])
        .pipe(fonter({
            formats : ['ttf']
        }))
})
gulp.task('svgSprite', ()=>{
    return gulp.src([source_folder + '/iconsprite/*.svg'])
        .pipe(svgSprite({
            made: {
                stack:{
                    sprite: '../icons/icons.svg',
                    example: true
                }
            }
        }))
        .pipe(dest(path.build.img))
})

function watchFiles(params){
    gulp.watch([path.watch.html],html)
    gulp.watch([path.watch.css],buildStyles)
    gulp.watch([path.watch.js], js)
    gulp.watch([path.watch.img], img)
}
function clean(){
    return del(path.clean)
}

function js(){
    return src(path.src.js)
        .pipe(fileInclude())
        .pipe(dest(path.build.js))
        .pipe(uglify())
        .pipe(
            rename({
                extname: '.min.js'
            })
        )
        .pipe(dest(path.build.js))
        .pipe(createBrowserSync.stream())
}
function fontStyle(){
    let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
    if (file_content == '') {
        fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}
function cb(){

}


let build = gulp.series(clean,gulp.parallel(js,buildStyles, html, img,fonts), fontStyle)
let watch = gulp.parallel(buildStyles,build,watchFiles, browserSync)

exports.fontStyle = fontStyle
exports.fonts = fonts
exports.img = img
exports.js = js
exports.buildStyles = buildStyles
exports.html = html
exports.build = build
exports.watch = watch
exports.default = watch