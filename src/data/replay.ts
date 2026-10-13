// "Replay": the career as one field recording. Every date and number here comes from the CV
// (src/data/experience.ts) or a project page. Months are indexed from Jan 2020 (= 0).
//
// Honesty rules for this file:
// - A stop's playhead anchor is only a position on the timeline; the visible label is always
//   the real period. Two Pek stops share one anchor because the CV gives no month for them.
// - No invented internal system names: panel labels describe what the figure shows.

export const month = (label: string) => {
  const [m, y] = label.split(' ');
  const i = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(m);
  return (Number(y) - 2020) * 12 + i;
};

const now = new Date();
export const LIVE = (now.getFullYear() - 2020) * 12 + now.getMonth();
export const LIVE_LABEL = now.toLocaleString('en-GB', { month: 'short', year: 'numeric' });

// Timeline axis
export const AXIS = { from: month('Jun 2020'), to: LIVE + 2 };
export const pct = (m: number) => ((m - AXIS.from) / (AXIS.to - AXIS.from)) * 100;
export const YEARS = [2021, 2022, 2023, 2024, 2025, 2026].filter((y) => (y - 2020) * 12 < AXIS.to);

export interface Segment {
  id: string;
  label: string; // short, fits in the bar
  name: string; // full name for the tooltip and screen readers
  period: string;
  from: number;
  to: number;
  lane: 'work' | 'study';
  href: string;
}

export const segments: Segment[] = [
  { id: 'mavis', label: 'Mavis', name: 'Machine vision intern, Mavis Machine Vision', period: 'Jul 2020 to Mar 2021', from: month('Jul 2020'), to: month('Mar 2021') + 1, lane: 'work', href: '/#t-start' },
  { id: 'gensys', label: 'Gensys', name: 'Machine vision engineer, Gensys Automation & Machine Vision', period: 'Dec 2021 to Dec 2022', from: month('Dec 2021'), to: month('Dec 2022') + 1, lane: 'work', href: '/#t-gensys' },
  { id: 'zgn', label: 'ZGN', name: 'Autonomous vehicle development engineer, Doğru Holding (ZGN)', period: 'Dec 2022 to May 2023', from: month('Dec 2022') + 0.5, to: month('May 2023') + 0.5, lane: 'work', href: '/#t-zgn' },
  { id: 'dgr', label: 'DGR', name: 'Computer vision engineer, Doğru Holding (DGR Project)', period: 'May 2023 to Dec 2023', from: month('May 2023') + 0.5, to: month('Dec 2023') + 1, lane: 'work', href: '/#t-dgr' },
  { id: 'bomensoft', label: 'Bomensoft', name: 'AI developer, Bomensoft (remote)', period: 'Jan 2024 to Feb 2024', from: month('Jan 2024'), to: month('Feb 2024') + 1, lane: 'work', href: '/#all' },
  { id: 'robsys', label: 'Robsys', name: 'Software engineer, Robsys Robotic Systems', period: 'Mar 2024 to Mar 2025', from: month('Mar 2024'), to: month('Mar 2025') + 1, lane: 'work', href: '/#t-robsys' },
  { id: 'pek', label: 'Pek Automotive', name: 'Computer vision engineer, Pek Automotive', period: 'Apr 2025 to present', from: month('Apr 2025'), to: LIVE + 1, lane: 'work', href: '/#top' },
  { id: 'bsc', label: 'B.Sc.', name: 'B.Sc. in Mechatronics Engineering, Marmara University', period: 'Graduated Mar 2021', from: month('Sep 2020'), to: month('Mar 2021') + 1, lane: 'study', href: '/#t-start' },
  { id: 'study', label: 'Self-study', name: 'Backpropagation and attention, from first principles', period: '2026', from: month('Feb 2026'), to: month('May 2026') + 1, lane: 'study', href: '/#t-study' },
];

export type Panel =
  | { kind: 'figure'; diagram: string; caption: string }
  | { kind: 'type'; big: string; small: string };

export interface Stop {
  id: string;
  at: number; // playhead anchor (month index)
  track: string; // segment id lit while this stop plays
  org: string;
  period: string;
  title: string;
  metric: { value: string; context: string };
  log: string[]; // short real facts, printed in the log panel
  panel: Panel;
  href?: string; // project page
}

// Newest first: scrolling rewinds. The live head (Pek, harvesting pipeline) is the hero.
export const stops: Stop[] = [
  {
    id: 'study',
    at: month('Apr 2026'),
    track: 'study',
    org: 'Self-study',
    period: 'Feb to May 2026',
    title: 'Backpropagation and attention, from first principles',
    metric: { value: '2', context: 'interactive figures, computed live in your browser' },
    log: [
      'Gradients and backprop worked by hand before using autograd',
      'An RNN written from scratch, then a character-level LSTM',
      'Attention as in BERT and GPT, causal mask and √d scaling',
      'Fine-tuned a Turkish BERT for sentiment; fixed a class imbalance',
    ],
    panel: { kind: 'figure', diagram: 'attention-matrix', caption: 'Attention weights for “Great food, but the service lagged.” Hand-set toy scores.' },
    href: '/projects/ml-first-principles',
  },
  {
    id: 'pek-calibration',
    at: month('Oct 2025'),
    track: 'pek',
    org: 'Pek Automotive',
    period: 'Apr 2025 to present',
    title: 'Camera-to-arm calibration for a harvesting robot',
    metric: { value: '5 mm', context: 'max positional error (2 mm std) against a 10 mm production threshold' },
    log: [
      'Per-arm 2D polynomial regression, camera to arm',
      'Linear misalignment correction',
      'Camera tilt compensation while the arm extends',
      'Replaced a manual calibration procedure',
    ],
    panel: { kind: 'figure', diagram: 'calibration-target', caption: 'Drawn to scale: 10 mm threshold, 5 mm max error, 2 mm std.' },
    href: '/projects/camera-to-arm-calibration',
  },
  {
    id: 'pek-detection',
    at: month('Oct 2025'),
    track: 'pek',
    org: 'Pek Automotive',
    period: 'Apr 2025 to present',
    title: 'Depth and detection for clustered fruit',
    metric: { value: '700 GB', context: 'of field recordings behind the retrained YOLO segmentation' },
    log: [
      'Histogram front-surface search instead of peak depth',
      'Saturation-based exposure control for changing sunlight',
      'Semi-automated annotation workflow',
      'YOLO instance segmentation retrained on occluded clusters',
    ],
    panel: { kind: 'figure', diagram: 'depth-histogram', caption: 'Schematic, not measured data: depth values inside one fruit mask.' },
    href: '/projects/detection-pipeline',
  },
  {
    id: 'robsys',
    at: month('Sep 2024'),
    track: 'robsys',
    org: 'Robsys Robotic Systems, Istanbul',
    period: 'Mar 2024 to Mar 2025',
    title: 'Autonomous navigation for a cleaning robot',
    metric: { value: 'SLAM', context: 'pathfinding and obstacle avoidance built from scratch: off-the-shelf SLAM did not run on the hardware' },
    log: [
      'Stereo, gyroscope and ultrasonic fusion on NVIDIA Jetson',
      'UART protocol co-designed with an embedded engineer',
      'Telemetry and camera streaming to a mobile app',
    ],
    panel: { kind: 'figure', diagram: 'occupancy-grid', caption: 'Schematic, not robot data: an occupancy grid and a planned path.' },
    href: '/projects/autonomous-navigation',
  },
  {
    id: 'dgr',
    at: month('Aug 2023'),
    track: 'dgr',
    org: 'Doğru Holding (DGR Project), Istanbul',
    period: 'May 2023 to Dec 2023',
    title: 'Face recognition with stereo liveness on Jetson Nano',
    metric: { value: '98%', context: 'accuracy, 30% fewer false positives, 4 KB embeddings on-device' },
    log: [
      'Stereo liveness model built from scratch',
      'Performance-critical parts in C++',
      'Anonymised camera feeds streamed live at a stable 30 fps',
      'Per-frame processing under 30 ms',
    ],
    panel: { kind: 'figure', diagram: 'depth-profile', caption: 'Schematic: facial depth from a stereo pair. A real face has relief; a photo is flat.' },
    href: '/projects/face-recognition',
  },
  {
    id: 'zgn',
    at: month('Mar 2023'),
    track: 'zgn',
    org: 'Doğru Holding (ZGN Autonomous & Robotics), Istanbul',
    period: 'Dec 2022 to May 2023',
    title: 'Pathfinding for autonomous vehicles',
    metric: { value: '30%', context: 'less pathfinding processing time' },
    log: ['Maps built directly from construction blueprints'],
    panel: { kind: 'type', big: '', small: 'No figure for this role: no public material. The number is from the CV.' },
  },
  {
    id: 'gensys',
    at: month('Jun 2022'),
    track: 'gensys',
    org: 'Gensys Automation & Machine Vision, Kocaeli',
    period: 'Dec 2021 to Dec 2022',
    title: 'Finding hidden cracks with thermal imaging',
    metric: { value: 'TUBITAK', context: 'funded research project, led by me' },
    log: [
      'Halogen flash heating, thermal camera recording',
      'Fourier phase of every pixel’s cooling curve',
      'Crack depth estimated from when contrast appears',
      'Halcon and C# desktop tools with MSSQL',
    ],
    panel: { kind: 'figure', diagram: 'thermal-plate', caption: 'Synthetic plate with four cracks at known depths.' },
    href: '/projects/thermal-ndt',
  },
  {
    id: 'start',
    at: month('Nov 2020'),
    track: 'mavis',
    org: 'Mavis Machine Vision and Marmara University',
    period: 'Jul 2020 to Mar 2021',
    title: 'Start of the recording',
    metric: { value: '2020', context: 'machine vision intern, then a B.Sc. in Mechatronics Engineering in Mar 2021' },
    log: ['Image processing in Halcon and C#', 'SQL database integration', 'Graduated Mar 2021, Marmara University'],
    panel: { kind: 'type', big: '', small: 'First frame of the recording. Nothing from the internship is public.' },
  },
];

// The live head: what the hero panels show
export const live = {
  track: 'pek',
  org: 'Pek Automotive, Logatec',
  period: 'Apr 2025 to present',
  title: 'Perception-to-picking pipeline for harvesting robots',
  metric: { value: '5', context: 'countries of field deployments, as the responsible computer vision engineer' },
  log: [
    'Apr 2025  Joined Pek Automotive. The harvester was not operational',
    'Calibration, detection, depth and picking logic, end to end',
    'Field-ready multi-arm apple and orange harvester',
    'Fleet installs, remote updates and log collection',
  ],
  href: '/projects/harvesting-pipeline',
};

// Playhead position for a project page, by slug
export const pageAt: Record<string, { at: number; track: string }> = {
  'harvesting-pipeline': { at: LIVE, track: 'pek' },
  'camera-to-arm-calibration': { at: month('Oct 2025'), track: 'pek' },
  'detection-pipeline': { at: month('Oct 2025'), track: 'pek' },
  'autonomous-navigation': { at: month('Sep 2024'), track: 'robsys' },
  'face-recognition': { at: month('Aug 2023'), track: 'dgr' },
  'thermal-ndt': { at: month('Jun 2022'), track: 'gensys' },
  'ml-first-principles': { at: month('Apr 2026'), track: 'study' },
  'side-project-infrastructure': { at: LIVE, track: '' },
};
