var linear = require('eases/linear')
var bboxToZoom = require('./lib/bbox-to-zoom.js')
var zoomToBbox = require('./lib/zoom-to-bbox.js')

module.exports = function zoomTo (map, opts) {
  var duration = opts.duration || 1000
  var startbox = map.viewbox.slice()
  var endbox = (opts.viewbox || opts.bbox).slice()
  var aspect = (startbox[2]-startbox[0])/(startbox[3]-startbox[1])
  var ease = opts.easing || linear
  endbox[0] = endbox[2]-aspect*(endbox[3]-endbox[1])
  endbox[2] = aspect*(endbox[3]-endbox[1])+endbox[0]
  endbox[3] = (endbox[2]-endbox[0])/aspect + endbox[1]
  endbox[1] = endbox[3] - (endbox[2]-endbox[0])/aspect

  var wrap = Math.floor(((startbox[0]+startbox[2])*0.5+180)/360)*360
  endbox[0] += wrap
  endbox[2] += wrap

  var zend = bboxToZoom(endbox)
  var padding = (opts.padding || 0)
    + (map._size[0] > map._size[1] ? map._size[0]/map._size[1]*0.5 : 0)
  if (padding) zoomToBbox(endbox, zend-padding)

  var bbox = [0,0,0,0]
  var start = Date.now()
  window.requestAnimationFrame(function frame () {
    var now = Date.now()
    var t = (now - start) / duration
    if (now >= start + duration) t = 1
    var x = ease(t)
    bbox[0] = startbox[0]*(1-x) + endbox[0]*x
    bbox[1] = startbox[1]*(1-x) + endbox[1]*x
    bbox[2] = startbox[2]*(1-x) + endbox[2]*x
    bbox[3] = startbox[3]*(1-x) + endbox[3]*x
    map.setViewbox(bbox)
    map.draw()
    if (t < 1) window.requestAnimationFrame(frame)
  })
}
