import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Silly extends Drawable {
  buffer: ArrayBuffer;
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  center: vec4;

  input_positions: Array<Object>;
  input_normals: Array<Object>;
  input_faces: Array<Object>;

  constructor(center: vec3, public radius: number, 
    input_positions: Array<Object>, input_normals: Array<Object>, input_faces: Array<Object>) {
    super(); // Call the constructor of the super class. This is required.
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);
    this.input_positions = input_positions;
    this.input_normals = input_normals;
    this.input_faces = input_faces;
  }

  debug() {
    console.log(this.input_positions);
    console.log(this.input_normals);
    console.log(this.input_faces);
  }

  create() {
    let S = 1;
    let S2 = 0.4;

    let maxIndexCount = this.input_faces.length * 2;
    let maxVertexCount = this.input_positions.length;

    // Create buffers to back geometry data
    // Index data will ping pong back and forth between buffer0 and buffer1 during creation
    // All data will be in buffer0 at the end
    const buffer0 = new ArrayBuffer(
      maxIndexCount * 3 * Uint32Array.BYTES_PER_ELEMENT + //indices
      maxVertexCount * 4 * Float32Array.BYTES_PER_ELEMENT + //positions
      maxVertexCount * 4 * Float32Array.BYTES_PER_ELEMENT //normals
    );
    const buffer1 = new ArrayBuffer(
      maxIndexCount * 3 * Uint32Array.BYTES_PER_ELEMENT
    );
    const buffers = [buffer0, buffer1];
    let b = 0;

    const indexByteOffset = 0;
    const vertexByteOffset = maxIndexCount * 3 * Uint32Array.BYTES_PER_ELEMENT;
    const normalByteOffset = vertexByteOffset;
    const positionByteOffset = vertexByteOffset + maxVertexCount * 4 * Float32Array.BYTES_PER_ELEMENT;

    // Create 3-uint buffer views into the backing buffer to represent triangles
    // The C++ analogy to this would be something like:
    // triangles[i] = reinterpret_cast<std::array<unsigned int, 3>*>(&buffer[offset]);
    let triangles: Array<Uint32Array> = new Array(maxIndexCount);
    for (let i = 0; i < maxIndexCount; ++i) {
      triangles[i] = new Uint32Array(buffers[b], indexByteOffset + i * 3 * Uint32Array.BYTES_PER_ELEMENT, 3);
    }

    // Create 3-float buffer views into the backing buffer to represent positions
    let vertices: Array<Float32Array> = new Array(maxVertexCount);
    for (let i = 0; i < maxVertexCount; ++i) {
      vertices[i] =new Float32Array(buffer0, vertexByteOffset + i * 4 * Float32Array.BYTES_PER_ELEMENT, 4);
    }

    // Initialize normals
    for (let i = 0; i < maxVertexCount; ++i) {
      let item: any = this.input_positions[i];
      vertices[i].set([item.x, item.y, item.z, 0]);
    }

    console.log(vertices);

    // Initialize indices
    // only works when all polygons are quads btw
    for (let i = 0; i < maxIndexCount / 2; ++i) {
      let face: any = this.input_faces[i];
      let verts = face.vertices;
      let idx = verts.map((obj: { vertexIndex: any; }) => obj.vertexIndex - 1);

      triangles[i].set([idx[0], idx[1], idx[2]]);
      triangles[i + maxIndexCount / 2].set([idx[0], idx[2], idx[3]]);
    }

    // Populate one position for each normal
    for (let i = 0; i < vertices.length; ++i) {
      let pos = <vec4> new Float32Array(buffer0, positionByteOffset + i * 4 * Float32Array.BYTES_PER_ELEMENT, 4);
      vec4.scaleAndAdd(pos, this.center, vertices[i], this.radius);
    }

    this.buffer = buffer0;
    this.indices = new Uint32Array(this.buffer, indexByteOffset, triangles.length * 3);
    this.normals = new Float32Array(this.buffer, normalByteOffset, vertices.length * 4);
    this.positions = new Float32Array(this.buffer, positionByteOffset, vertices.length * 4);

    this.generateIdx();
    this.generatePos();
    this.generateNor();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    console.log(`Created star with ${vertices.length} vertices`);
  }
};

export default Silly;
