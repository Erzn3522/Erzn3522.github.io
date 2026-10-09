import CalibrationTarget from './CalibrationTarget.astro';
import DepthHistogram from './DepthHistogram.astro';
import PickOrder from './PickOrder.astro';
import OccupancyGrid from './OccupancyGrid.astro';
import DepthProfile from './DepthProfile.astro';
import ThermalPlate from './ThermalPlate.astro';

// TODO(abdullah): all figures are schematics. Which projects can show real, non-confidential figures? (README, open question 4)
// Keys used in project frontmatter (`figure.diagram`)
export const diagrams = {
  'calibration-target': CalibrationTarget,
  'depth-histogram': DepthHistogram,
  'pick-order': PickOrder,
  'occupancy-grid': OccupancyGrid,
  'depth-profile': DepthProfile,
  'thermal-plate': ThermalPlate,
} as const;

export type DiagramKey = keyof typeof diagrams;
