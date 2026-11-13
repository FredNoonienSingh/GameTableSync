// packages/ui/components/animations/pricedetail/types.ts
import { MotionValue } from 'framer-motion';
export interface PricingTierGraphicProps {
  progress: MotionValue<number>;
  primaryColor?: string;
  accentColor?: string;
  surfaceColor?: string;
}