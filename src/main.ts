import {vec3, vec4} from 'gl-matrix';
const Stats = require('stats-js');
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import Cube from './geometry/Cube';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  //'Load Scene': loadScene, // A function pointer, essentially
  color: [ 0, 255, 4 ],
  'wiggle speed': 1,
  'grass amount': 0.5,
  'light intensity': 0.5,
}

let icosphere: Icosphere;
let square: Square;
let cube: Cube;
let prevTesselations: number = 5;

function loadScene() {
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  cube = new Cube(vec3.fromValues(0, 0, 0), 1);
  cube.create();
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  var time = 0;

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'tesselations', 0, 8).step(1);
  //gui.add(controls, 'Load Scene');

  var palette = {
    color: [ 0, 255, 0 ]
  };

  gui.addColor(palette, 'color');
  gui.add(controls, 'wiggle speed', 0, 10).step(0.5);
  gui.add(controls, 'grass amount', 0, 1).step(0.1);
  gui.add(controls, 'light intensity', 0, 1).step(0.1);

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE)

  var color = vec4.fromValues(palette.color[0] / 255, palette.color[1]/255, palette.color[2]/255, 1);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const grass = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/grass-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/grass-frag.glsl')),
  ])

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);

    renderer.clear();
    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      square = new Square(vec3.fromValues(0, 0, 0));
      square.create();
      cube = new Cube(vec3.fromValues(0, 0, 0), 1);
      cube.create();
    }

    color = vec4.fromValues(palette.color[0] / 255, palette.color[1]/255, palette.color[2]/255, 1);

    lambert.setGrass(controls['grass amount']);
    lambert.setLightIntensity(controls['light intensity']);
    renderer.render(camera, lambert, [
      cube,
    ], color, time);

    grass.setTimeFactor(controls['wiggle speed']);
    grass.setLightIntensity(controls['light intensity']);
    renderer.render(camera, grass, [
      square
    ], color, time)

    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
    time += 1;
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
