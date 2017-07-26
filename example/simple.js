var mixmap = require('mixmap')
var regl = require('regl')
var zoomTo = require('../')

var mix = mixmap(regl, { extensions: [ 'oes_element_index_uint' ] })
var map = mix.create({ backgroundColor: [0.1,0.11,0.12,1] })

var drawFeature = map.createDraw({
  frag: `
    precision highp float;
    void main () {
      gl_FragColor = vec4(1,0.5,0,1);
    }
  `,
  uniforms: { zindex: 10.0 },
  attributes: { position: map.prop('positions') },
  elements: map.prop('cells')
})

var mixtiles = require('mixmap-tiles')
var tiles = mixtiles(map, {
  layers: require('./lib/layers.js'),
  load: require('mixmap-tiles/xhr')
})

var count = 0
var boxes = [[-118,15,-87,33],[-200,-40,50,80]]
setInterval(function () {
  zoomTo(map, {
    viewbox: boxes[(count++)%boxes.length],
    duration: 1000,
    padding: 0.2
  })
}, 2000)

window.addEventListener('keydown', function (ev) {
  if (ev.code === 'Equal') {
    map.setZoom(Math.min(6,Math.round(map.getZoom()+1)))
  } else if (ev.code === 'Minus') {
    map.setZoom(map.getZoom()-1)
  }
})

document.body.style = 'margin: 0px; overflow: hidden'
document.body.appendChild(mix.render())
document.body.appendChild(map.render(
  { width: window.innerWidth, height: window.innerHeight }))
