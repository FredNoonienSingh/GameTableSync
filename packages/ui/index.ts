// packages/ui/index.ts
import './styles.css';


export { theme } from './theme';
export * as Assets from "./assets";
// Add this line to packages/ui/index.ts
export { MantineProvider, mantineHtmlProps, ColorSchemeScript } from '@mantine/core';
export { Section, type AnimationVariant } from './components/shared/Section';

// Animations
export { AnimatedBackground } from './components/shared/AnimatedBackground';
export { CommandHubGraphic } from './components/animations/CommandHubGraphic';
export { FallingD6Graphic } from './components/animations/FallingD6Graphic';
export { RotatingD20Graphic } from './components/animations/RotatingD20Graphic';
export { FanningCardsGraphic } from './components/animations/FanningCardsGraphic';
export { default as DrawingCardsGraphic } from './components/animations/DrawingCardsGraphic';
export { HexTilePathGraphic } from './components/animations/HexTilePathGraphic';
export { CardCycloneGraphic } from './components/animations/CardCycloneGraphic';
export { PortalDiceSummonGraphic } from './components/animations/PortalDiceSummonGraphic';
export { HobbyEssentialsGraphic } from './components/animations/HobbyEssentialsGraphic';
export { CommandForgeGraphic } from './components/animations/CommandForgeGraphic'
// Landing Page 

export { PriceDetail, type PriceDetailProps } from './components/marketing/PriceDetail';
export { SimpleHeader } from './components/shared/SimpleHeader';
export { LandingNavbar} from './components/marketing/LandingNavbar';
export { BrandHeader } from './components/marketing/BrandHeader';
export { ContactForm } from './components/marketing/ContactForm';
export { Footer } from './components/shared/Footer';
export { LaunchCountdown } from './components/marketing/LaunchCountdown';
export { SubSection } from './components/shared/SubSection';
export * from './components/army-viewer/ArmyListView';

// App Components
export { AppHeader } from './components/app/AppHeader';

export { default as gtsPureLogo } from './assets/gametablesync_pure.png';
export { default as gtsLogo2048 } from './assets/gametablesync-2048.png';
export { default as gtsLogoSvg } from './assets/gametablesync.svg';
