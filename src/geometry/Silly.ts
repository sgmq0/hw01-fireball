import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Star extends Drawable {
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
    const S = 1.5;
    const S2 = S / 6;

    let maxIndexCount = 16;
    let maxVertexCount = 10;

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
    vertices[0].set([ 0, S, 0, 0 ]);
    vertices[1].set([ S * 0.75, 0, 0, 0 ]);
    vertices[2].set([ 0, -S, 0, 0 ]);
    vertices[3].set([ -S * 0.75, 0, 0, 0 ]);

    vertices[4].set([ -S2, S2, 0, 0 ]);
    vertices[5].set([ S2, S2, 0, 0 ]);
    vertices[6].set([ S2, -S2, 0, 0 ]);
    vertices[7].set([ -S2, -S2, 0, 0 ]);

    vertices[8].set([ 0, 0, S2, 0 ]);
    vertices[9].set([ 0, 0, -S2, 0 ]);

    // Initialize indices
    triangles[0].set([ 0,5,8 ]);
    triangles[1].set([ 5,1,8 ]);
    triangles[2].set([ 1,6,8 ]);
    triangles[3].set([ 6,2,8 ]);
    triangles[4].set([ 2,7,8 ]);
    triangles[5].set([ 7,3,8 ]);
    triangles[6].set([ 3,4,8 ]);
    triangles[7].set([ 4,0,8 ]);
    triangles[8].set([ 0,5,9 ]);
    triangles[9].set([ 5,1,9 ]);
    triangles[10].set([ 1,6,9 ]);
    triangles[11].set([ 6,2,9 ]);
    triangles[12].set([ 2,7,9 ]);
    triangles[13].set([ 7,3,9 ]);
    triangles[14].set([ 3,4,9 ]);
    triangles[15].set([ 4,0,9 ]);

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

export default Star;
