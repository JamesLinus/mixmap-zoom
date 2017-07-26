var mixmap = require('mixmap')
var regl = require('regl')
var createMesh = require('earth-mesh')
var zoomTo = require('../')

var mix = mixmap(regl, { extensions: [ 'oes_element_index_uint' ] })
var map = mix.create({ backgroundColor: [0.1,0.11,0.12,1] })

var idlecb = window.requestIdleCallback
  || function (f) { setTimeout(f,0) }

var drawFeature = map.createDraw({
  frag: `
    precision highp float;
    void main () {
      gl_FragColor = vec4(1,0.5,0,1);
    }
  `,
  blend: {
    enable: true,
    func: { src: 'src alpha', dst: 'one minus src alpha' }
  },
  uniforms: {
    zindex: 10.0
  },
  attributes: {
    position: map.prop('positions')
  },
  elements: map.prop('cells')
})

var mixtiles = require('mixmap-tiles')
var tiles = mixtiles(map, {
  frag: `
    precision highp float;
    uniform sampler2D texture;
    varying vec2 vtcoord;
    void main () {
      vec4 tc = texture2D(texture,vtcoord);
      gl_FragColor = vec4(
        vec3(length(tc.xyz)/3.0)
          *pow(length(normalize(tc.xyz)-vec3(0,0,1)),4.0)
          + tc.xyz*0.05,
        tc.a);
    }
  `,
  layers: require('./lib/layers.js'),
  load: require('mixmap-tiles/xhr')
})

window.addEventListener('keydown', function (ev) {
  if (ev.code === 'Equal') {
    map.setZoom(Math.min(6,Math.round(map.getZoom()+1)))
  } else if (ev.code === 'Minus') {
    map.setZoom(map.getZoom()-1)
  }
})

var app = require('choo')()
var html = require('choo/html')

var dragdrop = require('drag-and-drop-files')
app.use(function (state, emitter) {
  state.files = []
  dragdrop(window, function (files) {
    ;(function next () {
      if (files.length === 0) return
      var file = files.shift()
      var r = new FileReader
      r.addEventListener('load', function (ev) {
        emitter.emit('add-file', {
          name: file.name, size: file.size, body: ev.target.result
        })
        idlecb(next)
      })
      r.readAsText(file)
    })()
  })
  emitter.on('add-file', function (file) {
    try { var data = JSON.parse(file.body) }
    catch (err) { return console.error(err) }
    try { var mesh = createMesh(data) }
    catch (err) { return console.error(err) }
    state.files.push({ name: file.name, size: file.size, mesh: mesh })
    drawFeature.props = [mesh.triangle]
    zoomTo(map, {
      viewbox: getBounds(mesh.triangle),
      duration: 1000,
      padding: 0.2
    })
    emitter.emit('render')
  })
  window.addEventListener('resize', function () {
    idlecb(function () { emitter.emit('render') })
  })
})

app.route('/', function (state, emit) {
  var element = mix.render()
  element.style.zIndex = 50
  element.style.position = 'absolute'
  return html`<body style="margin:0; overflow: hidden">
    <style>
      body {
        font-family: monospace;
      }
      .overlay {
        position: absolute;
        top: 100px;
        left: 40px;
        right: 40px;
        padding: 50px;
        text-align: center;
        background-color: black;
        opacity: 0.7;
        color: white;
        z-index: 100;
      }
      .overlay a:link { color: #7f7fff; }
      .overlay a:visited { color: #ff7fff; }
      .overlay.hide {
        display: none;
      }
    </style>
    ${element}
    <div class="overlay ${state.files.length === 0 ? 'show' : 'hide'}">
      <p>
        Drag and drop a geojson file.
      </p>
      <p>
        Here's a file you can use: 
        <a href="mexico.json" download="mexico.json">mexico.json</a>
      </p>
    </div>
    <div class="map">
      ${map.render({ width: window.innerWidth, height: window.innerHeight })}
    </div>
  </body>`
})
app.mount('body')

function getBounds (mesh) {
  var bbox = [Infinity,Infinity,-Infinity,-Infinity]
  for (var i = 0; i < mesh.positions.length; i++) {
    bbox[0] = Math.min(bbox[0],mesh.positions[i][0])
    bbox[1] = Math.min(bbox[1],mesh.positions[i][1])
    bbox[2] = Math.max(bbox[2],mesh.positions[i][0])
    bbox[3] = Math.max(bbox[3],mesh.positions[i][1])
  }
  return bbox
}
