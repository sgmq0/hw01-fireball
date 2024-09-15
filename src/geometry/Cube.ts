import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Cube extends Drawable {
  buffer: ArrayBuffer;
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  center: vec4;

  constructor(center: vec3, public radius: number) {
    super(); // Call the constructor of the super class. This is required.
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);
  }

  create() {
    const S = 0.75;

    let maxIndexCount = 12;
    let maxVertexCount = 8;

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
    let triangles: Array<Uint32Array> = new Array(12);
    for (let i = 0; i < 12; ++i) {
      triangles[i] = new Uint32Array(buffers[b], indexByteOffset + i * 3 * Uint32Array.BYTES_PER_ELEMENT, 3);
    }

    // Create 3-float buffer views into the backing buffer to represent positions
    let vertices: Array<Float32Array> = new Array(8);
    for (let i = 0; i < 8; ++i) {
      vertices[i] =new Float32Array(buffer0, vertexByteOffset + i * 4 * Float32Array.BYTES_PER_ELEMENT, 4);
    }

    // Initialize normals
    vertices[0].set([ S, S, S, 0 ]);
    vertices[1].set([ S, S, -S, 0 ]);
    vertices[2].set([ S, -S, S, 0 ]);
    vertices[3].set([ -S, S, S, 0 ]);
    vertices[4].set([ -S, -S, S, 0 ]);
    vertices[5].set([ -S, S, -S, 0 ]);
    vertices[6].set([ S, -S, -S, 0 ]);
    vertices[7].set([ -S, -S, -S, 0 ]);

    // Initialize indices
    triangles[0].set([ 0,1,2 ]);
    triangles[1].set([ 1,2,6 ]);
    triangles[2].set([ 1,6,7 ]);
    triangles[3].set([ 1,5,7 ]);
    triangles[4].set([ 5,7,4 ]);
    triangles[5].set([ 5,4,3 ]);
    triangles[6].set([ 3,4,0 ]);
    triangles[7].set([ 0,4,2 ]);
    triangles[8].set([ 1,0,5 ]);
    triangles[9].set([ 3,5,0 ]);
    triangles[10].set([ 4,7,2 ]);
    triangles[11].set([ 2,6,7 ]);

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

    console.log(`Created cube with ${vertices.length} vertices`);
  }
};

export default Cube;
