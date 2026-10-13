// Raw WebGL2 point-cloud renderer. One draw call: N points that morph from shape A to shape B.
// Colour is either a live depth map (turbo colormap on each point's real distance to the camera)
// or the "camera view" colours, crossfaded by uRgb.
import { N, type Shape } from './shapes';

const VS = /* glsl */ `#version 300 es
precision highp float;
in vec3 aPosA; in vec3 aPosB; in vec3 aColA; in vec3 aColB; in float aRand;
uniform mat4 uProj; uniform mat4 uView;
uniform float uMorph; uniform float uTime; uniform float uIdle; uniform float uSize; uniform float uDpr;
uniform float uNear; uniform float uFar;
out vec3 vCol; out float vDepth; out float vFade;
void main() {
  // each point leaves at its own moment, so the cloud dissolves rather than slides
  float t = smoothstep(0.0, 1.0, clamp(uMorph * 1.7 - aRand * 0.7, 0.0, 1.0));
  vec3 p = mix(aPosA, aPosB, t);
  float mid = sin(t * 3.14159265);
  vec3 scatter = vec3(fract(aRand * 43.17), fract(aRand * 17.31), fract(aRand * 91.73)) - 0.5;
  p += scatter * mid * 1.1;
  // idle: a sensor never reads the same twice
  p += vec3(sin(uTime * 0.9 + aRand * 40.0), cos(uTime * 0.7 + aRand * 31.0), sin(uTime * 0.6 + aRand * 23.0)) * 0.0035 * uIdle;
  vec4 mv = uView * vec4(p, 1.0);
  gl_Position = uProj * mv;
  float d = max(0.05, -mv.z);
  vDepth = clamp((d - uNear) / (uFar - uNear), 0.0, 1.0);
  vCol = mix(aColA, aColB, t);
  vFade = 1.0 - mid * 0.35;
  gl_PointSize = uSize * uDpr / d;
}`;

const FS = /* glsl */ `#version 300 es
precision highp float;
in vec3 vCol; in float vDepth; in float vFade;
uniform float uRgb;
out vec4 outColor;
vec3 turbo(float x) {
  const vec4 kR = vec4(0.13572138, 4.61539260, -42.66032258, 132.13108234);
  const vec4 kG = vec4(0.09140261, 2.19418839, 4.84296658, -14.18503333);
  const vec4 kB = vec4(0.10667330, 12.64194608, -60.58204836, 110.36276771);
  const vec2 kR2 = vec2(-152.94239396, 59.28637943);
  const vec2 kG2 = vec2(4.27729857, 2.82956604);
  const vec2 kB2 = vec2(-89.90310912, 27.34824973);
  x = clamp(x, 0.0, 1.0);
  vec4 v4 = vec4(1.0, x, x * x, x * x * x);
  vec2 v2 = v4.zw * v4.z;
  return vec3(dot(v4, kR) + dot(v2, kR2), dot(v4, kG) + dot(v2, kG2), dot(v4, kB) + dot(v2, kB2));
}
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = dot(c, c);
  if (r > 0.25) discard;
  // near is red, far is blue; far points also dim, as a real depth frame fades out
  vec3 depthCol = turbo(1.0 - vDepth * 0.92) * (1.0 - vDepth * 0.45);
  vec3 col = mix(depthCol, vCol, uRgb);
  outColor = vec4(col, (1.0 - smoothstep(0.16, 0.25, r)) * vFade);
}`;

type Vec3 = [number, number, number];

function perspective(fovy: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}

function lookAt(eye: Vec3, at: Vec3) {
  const z = norm([eye[0] - at[0], eye[1] - at[1], eye[2] - at[2]]);
  const x = norm(cross([0, 1, 0], z));
  const y = cross(z, x);
  return new Float32Array([
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -dot(x, eye), -dot(y, eye), -dot(z, eye), 1,
  ]);
}
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
function mul(m: Float32Array, p: number[]) {
  return [0, 1, 2, 3].map((r) => m[r] * p[0] + m[4 + r] * p[1] + m[8 + r] * p[2] + m[12 + r] * p[3]);
}

export interface Camera {
  target: Vec3;
  dist: number;
  theta: number; // azimuth, radians
  phi: number; // elevation, radians
}

export interface Frame {
  morph: number; // 0 = shape A, 1 = shape B
  rgb: number; // 0 = depth map, 1 = camera colours
  time: number;
  idle: number; // 0..1
  cam: Camera;
}

export function createCloud(canvas: HTMLCanvasElement, opts: { count: number; maxDpr: number; minSize?: number }) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) return null;

  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link');
  gl.useProgram(prog);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const attr = (name: string, size: number, data: Float32Array | null) => {
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data ?? new Float32Array(N * size), gl.DYNAMIC_DRAW);
    const loc = gl.getAttribLocation(prog, name);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    return buf;
  };
  const rand = new Float32Array(N);
  for (let i = 0; i < N; i++) rand[i] = Math.random();
  const bufs = {
    posA: attr('aPosA', 3, null),
    posB: attr('aPosB', 3, null),
    colA: attr('aColA', 3, null),
    colB: attr('aColB', 3, null),
  };
  attr('aRand', 1, rand);

  const u = (n: string) => gl.getUniformLocation(prog, n);
  const U = {
    proj: u('uProj'), view: u('uView'), morph: u('uMorph'), time: u('uTime'), idle: u('uIdle'),
    size: u('uSize'), dpr: u('uDpr'), near: u('uNear'), far: u('uFar'), rgb: u('uRgb'),
  };

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 1);

  let count = Math.min(N, opts.count);
  let viewProj = new Float32Array(16);
  let eye: Vec3 = [0, 0, 5];
  let w = 1, h = 1, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr);
    w = canvas.clientWidth || 1;
    h = canvas.clientHeight || 1;
    const cw = Math.round(w * dpr), ch = Math.round(h * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    gl!.viewport(0, 0, cw, ch);
  }

  function setPair(a: Shape, b: Shape) {
    const up = (buf: WebGLBuffer, data: Float32Array) => {
      gl!.bindBuffer(gl!.ARRAY_BUFFER, buf);
      gl!.bufferSubData(gl!.ARRAY_BUFFER, 0, data);
    };
    up(bufs.posA, a.pos);
    up(bufs.colA, a.col);
    up(bufs.posB, b.pos);
    up(bufs.colB, b.col);
  }

  function render(f: Frame) {
    const { cam } = f;
    eye = [
      cam.target[0] + cam.dist * Math.cos(cam.phi) * Math.sin(cam.theta),
      cam.target[1] + cam.dist * Math.sin(cam.phi),
      cam.target[2] + cam.dist * Math.cos(cam.phi) * Math.cos(cam.theta),
    ];
    // a wider lens on portrait screens so the subject still fits
    const aspect = w / h;
    const fov = aspect < 0.8 ? 0.95 : 0.62;
    const proj = perspective(fov, aspect, 0.05, 40);
    const view = lookAt(eye, cam.target);
    viewProj = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += proj[k * 4 + r] * view[c * 4 + k];
      viewProj[c * 4 + r] = s;
    }
    gl!.uniformMatrix4fv(U.proj, false, proj);
    gl!.uniformMatrix4fv(U.view, false, view);
    gl!.uniform1f(U.morph, f.morph);
    gl!.uniform1f(U.time, f.time);
    gl!.uniform1f(U.idle, f.idle);
    gl!.uniform1f(U.rgb, f.rgb);
    // points keep a minimum size on small screens, or the cloud turns to dust
    gl!.uniform1f(U.size, Math.max(opts.minSize ?? 6.5, (Math.min(w, 1600) / 1440) * 9.5));
    gl!.uniform1f(U.dpr, dpr);
    gl!.uniform1f(U.near, Math.max(0.1, cam.dist - 2.2));
    gl!.uniform1f(U.far, cam.dist + 2.4);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.drawArrays(gl!.POINTS, 0, count);
  }

  /** World point → CSS pixels, plus its distance to the camera in metres */
  function project(p: Vec3, r = 0) {
    const c = mul(viewProj, [p[0], p[1], p[2], 1]);
    if (c[3] <= 0) return null;
    const x = (c[0] / c[3] * 0.5 + 0.5) * w;
    const y = (1 - (c[1] / c[3] * 0.5 + 0.5)) * h;
    const dist = Math.hypot(p[0] - eye[0], p[1] - eye[1], p[2] - eye[2]);
    // projected radius: offset along the camera's right vector is close enough for a box
    const side = mul(viewProj, [p[0] + r, p[1], p[2], 1]);
    const px = Math.abs((side[0] / side[3] * 0.5 + 0.5) * w - x);
    return { x, y, dist, rpx: Math.max(px, r ? 6 : 0) };
  }

  resize();
  return {
    gl,
    resize,
    setPair,
    render,
    project,
    count: () => count,
    // points are shuffled, so any prefix is a uniform sample
    setCount: (n: number) => (count = Math.max(Math.round(N * 0.3), Math.min(N, n))),
  };
}
