const { src, dest } = require('gulp');
const path = require('path');

function buildIcons() {
  return src(
    [path.join(__dirname, 'nodes', '**', 'icon.*'), path.join(__dirname, 'credentials', '**', 'icon.*')],
    { base: __dirname, encoding: false }
  ).pipe(dest(path.join(__dirname, 'dist')));
}

exports['build:icons'] = buildIcons;
