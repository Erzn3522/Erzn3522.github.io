// The intro robot's rig: a pose (a handful of angles) in, twelve part matrices out.
// Column-major 4x4, the layout WebGL expects. Parts hang off each other like a real arm:
// root → head → eyes/mouth/antenna, root → arms → clipboard/pen, root → wheels.
import { PART, RIG } from './shapes';

type M = Float32Array;

function mul(a: M, b: M): M {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = s;
  }
  return o;
}
const T = (x: number, y: number, z: number): M => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
const S = (x: number, y: number, z: number): M => new Float32Array([x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]);
const Rx = (a: number): M => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); };
const Ry = (a: number): M => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); };
const Rz = (a: number): M => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); };
/** Apply m about a pivot */
const about = (p: readonly number[], m: M) => mul(T(p[0], p[1], p[2]), mul(m, T(-p[0], -p[1], -p[2])));

export interface Pose {
  x: number; // floor position
  z: number;
  yaw: number; // whole robot, 0 = facing the camera
  bob: number; // body lift, metres
  lean: number; // body roll, radians
  headYaw: number;
  headPitch: number; // + looks down
  headRoll: number;
  blink: number; // 1 open, 0 shut
  talk: number; // 0..1 mouth LED height
  antenna: number; // wobble angle
  spin: number; // wheel angle
  armL: number; // clipboard arm lift
  armRx: number; // pen arm, forward/back
  armRz: number; // pen arm, out to the side (wave)
}

export const restPose = (): Pose => ({
  x: 0, z: 0, yaw: 0, bob: 0, lean: 0, headYaw: 0, headPitch: 0, headRoll: 0,
  blink: 1, talk: 0.25, antenna: 0, spin: 0, armL: 0, armRx: 0, armRz: 0,
});

const out = new Float32Array(16 * 12);
const glow = new Float32Array(12);
glow[PART.eyes] = 1;
glow[PART.mouth] = 1;
glow[PART.antenna] = 0.5;
glow[PART.paper] = 0.85;
glow[PART.pen] = 0.7;
export const robotGlow = glow;

export function rig(p: Pose): Float32Array {
  const root = mul(T(p.x, p.bob, p.z), mul(Ry(p.yaw), about([0, 0.2, 0], Rz(p.lean))));
  const head = mul(root, about(RIG.neck, mul(Ry(p.headYaw), mul(Rx(p.headPitch), Rz(p.headRoll)))));
  const set = (i: number, m: M) => out.set(m, i * 16);
  set(PART.body, root);
  set(PART.head, head);
  set(PART.eyes, mul(head, about([0, RIG.eyeY, 0.2], S(1, Math.max(0.08, p.blink), 1))));
  set(PART.mouth, mul(head, about([0, RIG.mouthY, 0.2], S(1, 0.15 + p.talk * 1.1, 1))));
  set(PART.antenna, mul(head, about(RIG.antenna, mul(Rz(p.antenna), Rx(p.antenna * 0.5)))));
  set(PART.wheelL, mul(root, about(RIG.wheelL, Rx(p.spin))));
  set(PART.wheelR, mul(root, about(RIG.wheelR, Rx(p.spin))));
  const armL = mul(root, about(RIG.shoulderL, Rx(-p.armL)));
  set(PART.armL, armL);
  set(PART.board, armL);
  set(PART.paper, armL);
  const armR = mul(root, about(RIG.shoulderR, mul(Rz(p.armRz), Rx(-p.armRx))));
  set(PART.armR, armR);
  set(PART.pen, armR);
  return out;
}
