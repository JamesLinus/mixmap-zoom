var tiles = require(process.env.TILEMETA)
var layers = []
var zooms = [ 0, 1, 3 ]
tiles.forEach(function (file) {
  var level = Number(file.split('/')[0])
  var bbox = file.split('/')[1].replace(/\.jpg$/,'').split('x').map(Number)
  if (!layers[level]) layers[level] = { zoom: zooms[level], tiles: {} }
  layers[level].tiles[file] = bbox
})
module.exports = layers
