import {vec3, vec4} from 'gl-matrix';
const Stats = require('stats-js');
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Star from './geometry/Star';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import { big_text } from './big_text';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  //'Load Scene': loadScene, // A function pointer, essentially
  'primary color': [ 0, 0, 0 ],
  'secondary color': [0, 32, 39],
  'tertiary color': [114, 0, 0],
  'noise scale': 1,
  'noise amount': 5.0,
  'rim amount': 0.5,
  buttonAction: function() {
    resetControls();
  }
}

function resetControls() {
  controls['primary color'] = [0, 0, 0];
  controls['secondary color'] = [0, 32, 39];
  controls['tertiary color'] = [114, 0, 0];
  controls['noise scale'] = 1;
  controls['noise amount'] = 5.0;
  controls['rim amount'] = 0.5;
}

let icosphere: Icosphere;
let star: Star;
let prevTesselations: number = 5;

const OBJFile = require('obj-file-parser');

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  star = new Star(vec3.fromValues(0,0,0), 1);
  star.create();
}

async function main() {
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

  gui.addColor(controls, 'primary color');
  gui.addColor(controls, 'secondary color');
  gui.addColor(controls, 'tertiary color');
  gui.add(controls, 'noise scale', 0, 5).step(0.1);
  gui.add(controls, 'noise amount', 0, 10).step(0.1);
  gui.add(controls, 'rim amount', 0, 1).step(0.1);
  gui.add(controls, 'buttonAction').name('Reset to default');

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

  // do all the goofy obj stuff here
  // https://webgl2fundamentals.org/webgl/lessons/webgl-load-obj.html
  const data = new OBJFile(big_text)
  const parsed_data = data.parse();
  
  const positions = parsed_data.models[0];
  console.log(positions)

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const fireball = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/fireball-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/fireball-frag.glsl')),
  ]);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);

    renderer.clear();
    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
    }

    fireball.setTime(time);

    var primary = vec4.fromValues(controls['primary color'][0] / 255, controls['primary color'][1]/255, controls['primary color'][2]/255, 1);
    var secondary = vec4.fromValues(controls['secondary color'][0] / 255, controls['secondary color'][1]/255, controls['secondary color'][2]/255, 1);
    var tertiary = vec4.fromValues(controls['tertiary color'][0] / 255, controls['tertiary color'][1]/255, controls['tertiary color'][2]/255, 1);

    fireball.setPrimaryColor(primary);
    fireball.setSecondaryColor(secondary);
    fireball.setTertiaryColor(tertiary);
    fireball.setColorNoiseScale(controls['noise scale']);
    fireball.setColorNoiseHeight(controls['noise amount']);
    fireball.setRimAmount(controls['rim amount']);

    // get the viewdir of the camera
    let viewdir = vec3.create();
    vec3.subtract(viewdir, camera.controls.center, camera.controls.eye);
    let viewdir2 = vec4.fromValues(viewdir[0], viewdir[1], viewdir[2], 1);

    fireball.setViewDir(viewdir2);
    renderer.render(camera, fireball, [
      icosphere,
    ]);

    lambert.setPrimaryColor(primary);
    renderer.render(camera, lambert, [
      star,
    ]);

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
