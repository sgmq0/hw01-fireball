import {vec3, vec4} from 'gl-matrix';
const Stats = require('stats-js');
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Star from './geometry/Star';
import Silly from './geometry/Silly';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import { torso1, torso2, scarf, shoulder, arms } from './big_text';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  //'Load Scene': loadScene, // A function pointer, essentially
  'primary color': [ 0, 0, 0 ],
  'secondary color': [0, 174, 211],
  'tertiary color': [114, 0, 0],
  'star color': [255, 200, 0],
  'noise scale': 1,
  'noise amount': 5.0,
  'rim amount': 0.5,
  'time scale': 1.0,
  'star': true,
  'star glow': true,
  'body': true,
  buttonAction: function() {
    resetControls();
  }
}

function resetControls() {
  controls['primary color'] = [0, 0, 0];
  controls['secondary color'] = [0, 174, 211];
  controls['tertiary color'] = [114, 0, 0];
  controls['star color'] = [255,200,0];
  controls['noise scale'] = 1;
  controls['noise amount'] = 5.0;
  controls['rim amount'] = 0.5;
  controls['time scale'] = 1.0;
  controls['star'] = true;
  controls['star glow'] = true;
  controls['body'] = true;
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
  gui.addColor(controls, 'star color');
  gui.add(controls, 'noise scale', 0, 5).step(0.1);
  gui.add(controls, 'noise amount', 0, 10).step(0.1);
  gui.add(controls, 'rim amount', 0, 1).step(0.1);
  gui.add(controls, 'time scale', 0, 2).step(0.05);
  gui.add(controls, 'buttonAction').name('Reset to default');
  gui.add(controls, 'star').name('star mesh');
  gui.add(controls, 'star glow').name('star glow');
  gui.add(controls, 'body').name('body mesh');

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

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ do all the goofy obj stuff here ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // https://webgl2fundamentals.org/webgl/lessons/webgl-load-obj.html
  const torso = new OBJFile(torso1).parse();
  const torso_array = torso.models[0];
  let positions = torso_array.vertices;
  let normals = torso_array.vertexNormals;
  let faces = torso_array.faces;
  let obj_torso = new Silly(vec3.fromValues(0,0,0), 1, positions, normals, faces);
  obj_torso.create();

  const torso_bot = new OBJFile(torso2).parse();
  const torso_array2 = torso_bot.models[0];
  positions = torso_array2.vertices;
  normals = torso_array2.vertexNormals;
  faces = torso_array2.faces;
  let obj_torso2 = new Silly(vec3.fromValues(0,0,0), 1, positions, normals, faces);
  obj_torso2.create();

  const scarf_file = new OBJFile(scarf).parse();
  const scarf_array = scarf_file.models[0];
  positions = scarf_array.vertices;
  normals = scarf_array.vertexNormals;
  faces = scarf_array.faces;
  let obj_scarf = new Silly(vec3.fromValues(0,0,0), 1, positions, normals, faces);
  obj_scarf.create();

  const shoulder_file = new OBJFile(shoulder).parse();
  const shoulder_array = shoulder_file.models[0];
  positions = shoulder_array.vertices;
  normals = shoulder_array.vertexNormals;
  faces = shoulder_array.faces;
  let obj_shoulder = new Silly(vec3.fromValues(0,0,0), 1, positions, normals, faces);
  obj_shoulder.create();

  const arms_file = new OBJFile(arms).parse();
  const arms_array = arms_file.models[0];
  positions = arms_array.vertices;
  normals = arms_array.vertexNormals;
  faces = arms_array.faces;
  let obj_arms = new Silly(vec3.fromValues(0,0,0), 1, positions, normals, faces);
  obj_arms.create();

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
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/star-frag.glsl')),
  ]);

  const body = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/body-vert.glsl')),
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

    fireball.setTime(time * controls['time scale']);
    lambert.setTime(time * controls['time scale']);

    var primary = vec4.fromValues(controls['primary color'][0] / 255, controls['primary color'][1]/255, controls['primary color'][2]/255, 1);
    var secondary = vec4.fromValues(controls['secondary color'][0] / 255, controls['secondary color'][1]/255, controls['secondary color'][2]/255, 1);
    var tertiary = vec4.fromValues(controls['tertiary color'][0] / 255, controls['tertiary color'][1]/255, controls['tertiary color'][2]/255, 1);
    var star_color = vec4.fromValues(controls['star color'][0] / 255, controls['star color'][1]/255, controls['star color'][2]/255, 1);

    fireball.setPrimaryColor(primary);
    fireball.setSecondaryColor(secondary);
    fireball.setTertiaryColor(tertiary);
    fireball.setStarColor(star_color);
    fireball.setColorNoiseScale(controls['noise scale']);
    fireball.setColorNoiseHeight(controls['noise amount']);
    fireball.setRimAmount(controls['rim amount']);

    var isGlowing;
    if (controls['star glow']) {
      isGlowing = 1;
    } 
    fireball.setIsGlowing(isGlowing);

    var has_star = controls['star'];
    var has_body = controls['body'];

    // get the viewdir of the camera
    let viewdir = vec3.create();
    vec3.subtract(viewdir, camera.controls.center, camera.controls.eye);
    let viewdir2 = vec4.fromValues(viewdir[0], viewdir[1], viewdir[2], 1);

    fireball.setViewDir(viewdir2);
    renderer.render(camera, fireball, [
      icosphere,
    ]);

    if (has_star) {
      lambert.setPrimaryColor(star_color);
      renderer.render(camera, lambert, [
        star,
      ]);
    }

    if (has_body) {
      body.setPrimaryColor(vec4.fromValues(58/255, 80/255, 80/255, 1.0));
      renderer.render(camera, body, [
        obj_torso
      ]);

      body.setPrimaryColor(vec4.fromValues(83/255, 8/255, 8/255, 1.0));
      renderer.render(camera, body, [
        obj_torso2
      ]);

      body.setPrimaryColor(vec4.fromValues(199/255, 22/255, 21/255, 1.0));
      renderer.render(camera, body, [
        obj_scarf
      ]);

      body.setPrimaryColor(vec4.fromValues(63/255, 85/255, 85/255, 1.0));
      renderer.render(camera, body, [
        obj_shoulder
      ]);

      body.setPrimaryColor(vec4.fromValues(99/255, 173/255, 164/255, 1.0));
      renderer.render(camera, body, [
        obj_arms
      ]);
    }

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
