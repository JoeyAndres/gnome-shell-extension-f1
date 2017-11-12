var gulp = require('gulp');
var babel = require('gulp-babel');

gulp.task('default', ['prod']);

gulp.task('prod', ['f1-event-prod', 'external-non-npm']);

gulp.task('f1-event-prod', function() {
    return gulp.src('src/F1Event.js')
        .pipe(babel())
        .pipe(gulp.dest('.'));
});

gulp.task('external-non-npm', function() {
    return gulp.src('src/**/*.js')
        .pipe(gulp.dest('.'));
});