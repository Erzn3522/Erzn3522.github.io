// Source: Abdullah Erzin – CV.pdf. Newest first.
export interface Role {
  start: string;
  end: string;
  role: string;
  org: string;
  place: string;
  summary: string;
  projects?: string[]; // project slugs
}

export const experience: Role[] = [
  {
    start: 'Apr 2025',
    end: 'present',
    role: 'Computer Vision Engineer',
    org: 'Pek Automotive',
    place: 'Logatec, Slovenia',
    summary:
      'Perception-to-picking pipeline for multi-arm apple and orange harvesting robots, from camera calibration to field deployments in five countries.',
    projects: ['camera-to-arm-calibration', 'harvesting-pipeline', 'detection-pipeline'],
  },
  {
    start: 'Mar 2024',
    end: 'Mar 2025',
    role: 'Software Engineer',
    org: 'Robsys Robotic Systems',
    place: 'Istanbul, Turkey',
    summary: 'Autonomous navigation for a cleaning robot, built from scratch on NVIDIA Jetson.',
    projects: ['autonomous-navigation'],
  },
  {
    start: 'Jan 2024',
    end: 'Feb 2024',
    role: 'AI Developer',
    org: 'Bomensoft',
    place: 'London, UK (remote)',
    summary: 'Optimized AI models and extended backend and web features in Python and JavaScript.',
  },
  {
    start: 'May 2023',
    end: 'Dec 2023',
    role: 'Computer Vision Engineer',
    org: 'Doğru Holding (DGR Project)',
    place: 'Istanbul, Turkey',
    summary:
      'Face recognition with stereo liveness on Jetson Nano. Also a real-time pipeline that anonymized people in security camera feeds and streamed to YouTube Live at a stable 30 fps, keeping per-frame processing under 30 ms.',
    projects: ['face-recognition'],
  },
  {
    start: 'Dec 2022',
    end: 'May 2023',
    role: 'Autonomous Vehicle Development Engineer',
    org: 'Doğru Holding (ZGN Autonomous & Robotics)',
    place: 'Istanbul, Turkey',
    summary:
      'Cut pathfinding processing time for autonomous vehicles by 30%, and designed an algorithm that lets robots build maps directly from construction blueprints.',
  },
  {
    start: 'Dec 2021',
    end: 'Dec 2022',
    role: 'Machine Vision Engineer',
    org: 'Gensys Automation & Machine Vision',
    place: 'Kocaeli, Turkey',
    summary:
      'Machine vision applications in Halcon and C# with MSSQL-backed desktop tools, commissioned on site. Led a TUBITAK-funded thermal NDT research project that estimated the depth of subsurface defects in PLA parts.',
    projects: ['thermal-ndt'],
  },
  {
    start: 'Jul 2020',
    end: 'Mar 2021',
    role: 'Machine Vision Intern',
    org: 'Mavis Machine Vision',
    place: 'Kocaeli, Turkey',
    summary: 'Image-processing applications in Halcon and C# with SQL database integration.',
  },
];

// TODO(abdullah): the CV's AR face filter side project is not on the site. Add it as a sixth project? (README, open question 5)

export const education = {
  date: 'Mar 2021',
  degree: 'B.Sc. in Mechatronics Engineering',
  school: 'Marmara University',
  place: 'Istanbul, Turkey',
};

// Grouped as in the CV
export const skills: { group: string; items: string }[] = [
  { group: 'Languages', items: 'Python, C++, C#, JavaScript, SQL' },
  {
    group: 'Computer vision',
    items:
      'Camera calibration, stereo vision, depth sensing, 3D coordinate transforms, object detection and segmentation, OpenCV, YOLO, Halcon',
  },
  { group: 'Machine learning', items: 'PyTorch, TensorFlow, NumPy' },
  { group: 'Hardware and embedded', items: 'NVIDIA Jetson, Intel RealSense, UART, Linux' },
  { group: 'Infrastructure', items: 'Docker, GitHub Actions, Git, Prometheus, Grafana' },
];
