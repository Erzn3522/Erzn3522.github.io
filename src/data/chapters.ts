// The home page as a sequence of reconstructions. Every number is from the CV or a project page.
export type ShapeKey = 'orchard' | 'calibration' | 'detection' | 'navigation' | 'face' | 'thermal' | 'attention' | 'name';

export interface Chapter {
  id: string;
  nav: string; // short name for the chapter index
  shape: ShapeKey;
  cam: { target: [number, number, number]; dist: number; theta: number; phi: number };
  /** Camera distance multiplier on portrait screens: wide scenes step back to fit, the hero steps in */
  portrait: number;
  labels?: 'distance' | 'names'; // live distance per anchor, or the anchor's own label
  when?: string;
  title?: string;
  big?: string; // one real number, set as an image
  bigNote?: string;
  text?: string;
  href?: string;
}

export const chapters: Chapter[] = [
  {
    id: 'hello',
    nav: 'Hello',
    shape: 'orchard',
    cam: { target: [0, 1.0, 0], dist: 6.2, theta: 0.0, phi: 0.16 },
    portrait: 0.72,
  },
  {
    id: 'picking',
    nav: 'Picking',
    shape: 'orchard',
    cam: { target: [0.1, 1.35, 0.35], dist: 2.5, theta: -0.42, phi: 0.06 },
    portrait: 1.0,
    labels: 'distance',
    when: 'Pek Automotive, Apr 2025 to present',
    title: 'Perception to picking',
    big: '5',
    bigNote: 'countries of field deployments',
    text: 'I took over a multi-arm apple and orange harvester that was not operational and made it field-ready: calibration, detection, depth and the picking logic that decides which fruit comes next.',
    href: '/projects/harvesting-pipeline',
  },
  {
    id: 'calibration',
    nav: 'Calibration',
    shape: 'calibration',
    cam: { target: [0.15, 0.85, 0.3], dist: 3.7, theta: 0.62, phi: 0.36 },
    portrait: 1.15,
    labels: 'names',
    when: 'Pek Automotive',
    title: 'Camera to arm, within tolerance',
    big: '5 mm',
    bigNote: 'max error against a 10 mm production threshold (2 mm std)',
    text: 'A three-stage calibration replaced a manual procedure: polynomial regression per arm, a misalignment correction, and compensation for the camera tilting as the arm extends.',
    href: '/projects/camera-to-arm-calibration',
  },
  {
    id: 'detection',
    nav: 'Depth',
    shape: 'detection',
    cam: { target: [-0.05, 1.0, 0], dist: 2.7, theta: -0.3, phi: 0.12 },
    portrait: 1.25,
    labels: 'names',
    when: 'Pek Automotive',
    title: 'The front of the fruit, not the peak',
    big: '700 GB',
    bigNote: 'of field recordings behind the retrained segmentation',
    text: 'Peak depth inside a fruit mask lands behind the fruit. A front-surface search fixed it, exposure now follows the sun, and YOLO was retrained on occluded clusters.',
    href: '/projects/detection-pipeline',
  },
  {
    id: 'navigation',
    nav: 'Navigation',
    shape: 'navigation',
    cam: { target: [0, 0, 0], dist: 3.9, theta: 0.4, phi: 0.82 },
    portrait: 1.35,
    labels: 'names',
    when: 'Robsys Robotic Systems, Mar 2024 to Mar 2025',
    title: 'A cleaning robot that maps its own rooms',
    text: 'SLAM, pathfinding and obstacle avoidance built from scratch on NVIDIA Jetson, because off-the-shelf SLAM did not run on the hardware. Stereo cameras, gyroscopes and ultrasonic sensors fused in one pipeline.',
    href: '/projects/autonomous-navigation',
  },
  {
    id: 'liveness',
    nav: 'Liveness',
    shape: 'face',
    cam: { target: [0.1, 1.2, 0.05], dist: 2.9, theta: -0.78, phi: 0.06 },
    portrait: 1.45,
    labels: 'names',
    when: 'Doğru Holding (DGR Project), May to Dec 2023',
    title: 'A face has depth. A photo does not.',
    big: '98%',
    bigNote: 'accuracy, 30% fewer false positives, 4 KB per face on a Jetson Nano',
    text: 'Stereo liveness built from scratch: depth at facial keypoints tells a real face from a printed one. Turn the view and the photo goes flat.',
    href: '/projects/face-recognition',
  },
  {
    id: 'thermal',
    nav: 'Thermal',
    shape: 'thermal',
    cam: { target: [0, 0.9, 0], dist: 2.6, theta: 0.18, phi: 0.42 },
    portrait: 1.35,
    labels: 'names',
    when: 'Gensys Automation & Machine Vision, Dec 2021 to Dec 2022',
    title: 'Cracks you cannot see, by how heat leaves',
    text: 'A TUBITAK-funded project I led: flash-heat a PLA part, film it cooling, and use the Fourier phase of every pixel to find hidden cracks and estimate how deep they are.',
    href: '/projects/thermal-ndt',
  },
  {
    id: 'study',
    nav: 'Self-study',
    shape: 'attention',
    cam: { target: [0, 1.05, 0], dist: 3.3, theta: 0.0, phi: 0.3 },
    portrait: 1.7,
    labels: 'names',
    when: 'Self-study, 2026',
    title: 'Backprop and attention, by hand first',
    text: 'To understand the models I use every day, I worked through deep learning from the maths up. The project page has a gradient step and an attention matrix you can play with.',
    href: '/projects/ml-first-principles',
  },
  {
    id: 'record',
    nav: 'Record',
    shape: 'name',
    cam: { target: [0, 1.0, 0], dist: 4.6, theta: 0.32, phi: 0.12 },
    portrait: 1.9,
  },
  {
    id: 'contact',
    nav: 'Contact',
    shape: 'name',
    cam: { target: [0, 0.45, 0], dist: 4.4, theta: 0.0, phi: 0.0 },
    portrait: 1.9,
  },
];
