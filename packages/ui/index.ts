// packages/ui/index.ts
import './styles.css';


export { theme } from './theme';
export * as Assets from "./assets";

// Interfaces
export {UUID, DateRange, AvatarResource, Status} from './components/types';
export {Badge, Player} from './components/player/interfaces';
export {Tournament,Trophy, Round, Team,MatchingAlgo} from './components/tournament/interfaces'
export {Club} from './components/club/interfaces'
export {Game} from './components/game/interfaces'

export { MantineProvider, mantineHtmlProps, ColorSchemeScript } from '@mantine/core';
export { Section, type AnimationVariant } from './components/shared/Section';

// Animations
export { AnimatedBackground } from './components/shared/AnimatedBackground';
export { CommandHubGraphic } from './components/animations/CommandHubGraphic';
export { FallingD6Graphic } from './components/animations/FallingD6Graphic';
export { RotatingD20Graphic } from './components/animations/RotatingD20Graphic';
export { FanningCardsGraphic } from './components/animations/FanningCardsGraphic';
export { DrawingCardGraphic } from './components/animations/DrawingCardGraphic';
export { HexTilePathGraphic } from './components/animations/HexTilePathGraphic';
export { CardCycloneGraphic } from './components/animations/CardCycloneGraphic';
export { PortalDiceSummonGraphic } from './components/animations/PortalDiceSummonGraphic';
export { HobbyEssentialsGraphic } from './components/animations/HobbyEssentialsGraphic';
export { CommandForgeGraphic } from './components/animations/CommandForgeGraphic'
// ---- Price 
export {OutpostGraphic} from './components/animations/pricedetail/OutpostGraphic';
export {StrongholdGraphic} from './components/animations/pricedetail/StrongholdGraphic';
export {CitadelGraphic} from './components/animations/pricedetail/CitadelGraphic';
export {FortressOfTerraGraphic} from './components/animations/pricedetail/FortressOfTerraGraphic';

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

// Functional Component
export {ThemeToggle} from './components/shared/ThemeToggle';
export {LanguageSwitcher} from './components/shared/LanguageSwitcher';


// Player Components
export {ProfileSmall} from "./components/player/ProfileSmall"

// App Components
export { AppHeader } from './components/app/AppHeader';

// Logos/Images
export { default as gtsPureLogo } from './assets/gametablesync_pure.png';
export { default as gtsLogo2048 } from './assets/gametablesync-2048.png';
export { default as gtsLogoSvg } from './assets/gametablesync.svg';
