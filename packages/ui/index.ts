// packages/ui/index.ts
import './styles.css';

export { theme } from './theme';
// Add this line to packages/ui/index.ts
export { MantineProvider, mantineHtmlProps, ColorSchemeScript } from '@mantine/core';
export { Section, type AnimationVariant } from './components/Section';

// Animations
export { AnimatedBackground } from './components/AnimatedBackground';
export { CommandHubGraphic } from './components/animations/CommandHubGraphic';
export { FallingD6Graphic } from './components/animations/FallingD6Graphic';
export { RotatingD20Graphic } from './components/animations/RotatingD20Graphic';
export { FanningCardsGraphic } from './components/animations/FanningCardsGraphic';
export { default as DrawingCardsGraphic } from './components/animations/DrawingCardsGraphic';
export { HexTilePathGraphic } from './components/animations/HexTilePathGraphic';
export { CardCycloneGraphic } from './components/animations/CardCycloneGraphic';
export { PortalDiceSummonGraphic } from './components/animations/PortalDiceSummonGraphic';
export { HobbyEssentialsGraphic } from './components/animations/HobbyEssentialsGraphic';
// Landing Page 

export { BrandHeader } from './components/BrandHeader';
export { ContactForm } from './components/ContactForm';
export { Footer } from './components/Footer';
export { LaunchCountdown } from './components/LaunchCountdown';
export { SubSection } from './components/SubSection';
export * from './components/army-viewer/ArmyListView';

// App Components
export { AppHeader } from './components/AppComponents/AppHeader';

export { default as gtsPureLogo } from './assets/gametablesync_pure.png';
export { default as gtsLogo2048 } from './assets/gametablesync-2048.png';
export { default as gtsLogoSvg } from './assets/gametablesync.svg';
