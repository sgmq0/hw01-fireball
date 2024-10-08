import {vec4, mat4} from 'gl-matrix';
import Drawable from './Drawable';
import {gl} from '../../globals';

var activeProgram: WebGLProgram = null;

export class Shader {
  shader: WebGLShader;

  constructor(type: number, source: string) {
    this.shader = gl.createShader(type);
    gl.shaderSource(this.shader, source);
    gl.compileShader(this.shader);

    if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(this.shader);
    }
  }
};

class ShaderProgram {
  prog: WebGLProgram;

  attrPos: number;
  attrNor: number;
  attrCol: number;

  unifModel: WebGLUniformLocation;
  unifModelInvTr: WebGLUniformLocation;
  unifViewProj: WebGLUniformLocation;
  unifTime: WebGLUniformLocation;
  unifTimeFactor: WebGLUniformLocation;
  unifViewDir: WebGLUniformLocation;

  unifColorPrimary: WebGLUniformLocation;
  unifColorSecondary: WebGLUniformLocation;
  unifColorTertiary: WebGLUniformLocation;
  unifColorStar: WebGLUniformLocation;
  unifColorNoiseScale: WebGLUniformLocation;
  unifColorNoiseHeight: WebGLUniformLocation;
  unifRimAmount: WebGLUniformLocation;
  unifIsGlowing: WebGLUniformLocation;

  constructor(shaders: Array<Shader>) {
    this.prog = gl.createProgram();

    for (let shader of shaders) {
      gl.attachShader(this.prog, shader.shader);
    }
    gl.linkProgram(this.prog);
    if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(this.prog);
    }

    this.attrPos = gl.getAttribLocation(this.prog, "vs_Pos");
    this.attrNor = gl.getAttribLocation(this.prog, "vs_Nor");
    this.attrCol = gl.getAttribLocation(this.prog, "vs_Col");
    this.unifModel      = gl.getUniformLocation(this.prog, "u_Model");
    this.unifModelInvTr = gl.getUniformLocation(this.prog, "u_ModelInvTr");
    this.unifViewProj   = gl.getUniformLocation(this.prog, "u_ViewProj");
    this.unifTime       = gl.getUniformLocation(this.prog, "u_Time");
    this.unifTimeFactor = gl.getUniformLocation(this.prog, "u_TimeFactor");
    this.unifViewDir = gl.getUniformLocation(this.prog, "u_ViewDir");

    this.unifColorPrimary   = gl.getUniformLocation(this.prog, "u_ColorPrimary");
    this.unifColorSecondary = gl.getUniformLocation(this.prog, "u_ColorSecondary");
    this.unifColorTertiary  = gl.getUniformLocation(this.prog, "u_ColorTertiary");
    this.unifColorStar      = gl.getUniformLocation(this.prog, "u_ColorStar");
    this.unifColorNoiseScale  = gl.getUniformLocation(this.prog, "u_ColorNoiseScale");
    this.unifColorNoiseHeight  = gl.getUniformLocation(this.prog, "u_ColorNoiseHeight");
    this.unifRimAmount  = gl.getUniformLocation(this.prog, "u_RimAmount");
    this.unifIsGlowing  = gl.getUniformLocation(this.prog, "u_IsGlowing");
  }

  use() {
    if (activeProgram !== this.prog) {
      gl.useProgram(this.prog);
      activeProgram = this.prog;
    }
  }

  setModelMatrix(model: mat4) {
    this.use();
    if (this.unifModel !== -1) {
      gl.uniformMatrix4fv(this.unifModel, false, model);
    }

    if (this.unifModelInvTr !== -1) {
      let modelinvtr: mat4 = mat4.create();
      mat4.transpose(modelinvtr, model);
      mat4.invert(modelinvtr, modelinvtr);
      gl.uniformMatrix4fv(this.unifModelInvTr, false, modelinvtr);
    }
  }

  setViewProjMatrix(vp: mat4) {
    this.use();
    if (this.unifViewProj !== -1) {
      gl.uniformMatrix4fv(this.unifViewProj, false, vp);
    }
  }

  setTime(time: GLfloat) {
    this.use();
    if (this.unifTime !== -1) {
      gl.uniform1f(this.unifTime, time);
    }
  }

  setTimeFactor(timeFactor: GLfloat) {
    this.use();
    if (this.unifTimeFactor !== -1) {
      gl.uniform1f(this.unifTimeFactor, timeFactor);
    }
  }

  setViewDir(direction: vec4) {
    this.use();
    if (this.unifViewDir !== -1) {
      gl.uniform4fv(this.unifViewDir, direction);
    }
  }

  setPrimaryColor(color: vec4) {
    this.use();
    if (this.unifColorPrimary !== -1) {
      gl.uniform4fv(this.unifColorPrimary, color);
    }
  }

  setSecondaryColor(color: vec4) {
    this.use();
    if (this.unifColorSecondary !== -1) {
      gl.uniform4fv(this.unifColorSecondary, color);
    }
  }

  setTertiaryColor(color: vec4) {
    this.use();
    if (this.unifColorTertiary !== -1) {
      gl.uniform4fv(this.unifColorTertiary, color);
    }
  }

  setStarColor(color: vec4) {
    this.use();
    if (this.unifColorStar !== -1) {
      gl.uniform4fv(this.unifColorStar, color);
    }
  }

  setColorNoiseScale(scaleAmt: GLfloat) {
    this.use();
    if (this.unifColorNoiseScale !== -1) {
      gl.uniform1f(this.unifColorNoiseScale, scaleAmt);
    }
  }

  setColorNoiseHeight(height: GLfloat) {
    this.use();
    if (this.unifColorNoiseHeight !== -1) {
      gl.uniform1f(this.unifColorNoiseHeight, height);
    }
  }

  setRimAmount(amount: GLfloat) {
    this.use();
    if (this.unifRimAmount !== -1) {
      gl.uniform1f(this.unifRimAmount, amount);
    }
  }

  setIsGlowing(isGlowing: GLint) {
    this.use();
    if (this.unifIsGlowing !== -1) {
      gl.uniform1i(this.unifIsGlowing, isGlowing);
    }
  }

  draw(d: Drawable) {
    this.use();

    if (this.attrPos != -1 && d.bindPos()) {
      gl.enableVertexAttribArray(this.attrPos);
      gl.vertexAttribPointer(this.attrPos, 4, gl.FLOAT, false, 0, 0);
    }

    if (this.attrNor != -1 && d.bindNor()) {
      gl.enableVertexAttribArray(this.attrNor);
      gl.vertexAttribPointer(this.attrNor, 4, gl.FLOAT, false, 0, 0);
    }

    d.bindIdx();
    gl.drawElements(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0);

    if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
    if (this.attrNor != -1) gl.disableVertexAttribArray(this.attrNor);
  }
};

export default ShaderProgram;
