# mixmap-zoom

bounding-box zoom animations for mixmap

[check out this demo](http://substack.neocities.org/mixmap/demos/zoom.html)

![](https://substack.neocities.org/images/mixmap-zoom.jpg)

# example

``` js
var mixmap = require('mixmap')
var regl = require('regl')
var zoomTo = require('mixmap-zoom')

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
```

# api

``` js
var zoomTo = require('mixmap-zoom')
```

## zoomTo(map, opts)

zoom a [mixmap][] map from:

* `opts.viewbox` - destination bounding box
* `opts.duration` - animation time in milliseconds. default: 1000
* `opts.easing` - [easing][] function. default: linear
* `opts.padding` - amount of extra space in zoom levels. default: 0

[mixmap]: https://github.com/substack/mixmap
[easing]: https://npmjs.com/package/eases

# install

npm install mixmap-zoom

# license

public domain
