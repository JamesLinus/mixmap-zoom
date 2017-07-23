var mixmap = require('mixmap')
var regl = require('regl')
var createMesh = require('earth-mesh')

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

var css = require('sheetify')
var style = css`
  :host {
    position: absolute;
    top: 0px;
    left: 0px;
    right: 0px;
    bottom: 0px;
    background-color: #101010;
    overflow: hidden;
  }
`

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
    zoomTo(map, getBounds(mesh.triangle), 1000)
    emitter.emit('render')
  })
  window.addEventListener('resize', function () {
    idlecb(function () { emitter.emit('render') })
  })
})

app.route('/', function (state, emit) {
  return html`<body>
    ${mix.render()}
    <div class="${style}">
    <div class="map">
        ${map.render({ width: window.innerWidth, height: window.innerHeight })}
      </div>
    </div>
  </body>`
})
app.mount('body')

var ease = require('eases/linear')

function zoomTo (map, box, time) {
  var startbox = map.viewbox.slice()
  var endbox = box.slice()
  var wrap = Math.floor(((startbox[0]+startbox[2])*0.5+180)/360)*360
  var aspect = (startbox[2]-startbox[0])/(startbox[3]-startbox[1])
  endbox[0] += wrap
  endbox[2] += wrap
  if ((endbox[2] - endbox[0]) / (endbox[3] - endbox[1]) > aspect) {
    endbox[1] = (endbox[3]+endbox[1])*0.5 - (endbox[3]-endbox[1])*aspect*0.5
    endbox[3] = (endbox[3]+endbox[1])*0.5 + (endbox[3]-endbox[1])*aspect*0.5
  } else {
    endbox[0] = (endbox[2]+endbox[0])*0.5 - (endbox[2]-endbox[0]*aspect*0.5
    endbox[2] = (endbox[2]+endbox[0])*0.5 + (endbox[2]-endbox[0])*aspect*0.5
  }
  var bbox = [0,0,0,0]
  var start = Date.now()
  window.requestAnimationFrame(function frame () {
    var now = Date.now()
    var t = (now - start) / time
    if (now >= start + time) t = 1
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
