// packages/ui/index.ts
import './styles.css';

// ==========================================
// 1. CORE CONFIG, THEMES & ASSETS
// ==========================================
export { theme } from './theme';
export * as Assets from './assets';
export { MantineProvider, mantineHtmlProps, ColorSchemeScript } from '@mantine/core';

// Logos & Images
export { default as gtsPureLogo } from './assets/gametablesync_pure.png';
export { default as gtsLogo2048 } from './assets/gametablesync-2048.png';
export { default as gtsLogoSvg } from './assets/gametablesync.svg';


// ==========================================
// 2. SHARED TYPES & INTERFACES
// ==========================================
export type { UUID, DateRange, Status, AvatarResource } from './components/types';
export type { Badge, Player } from './components/player/interfaces';
export type { Tournament, Trophy, Round, Team, MatchingAlgo } from './components/tournament/interfaces';
export type { Club } from './components/club/interfaces';
export type { Game } from './components/game/interfaces';


// ==========================================
// 3. CORE SHARED LAYOUT & UI COMPONENTS
// ==========================================
export { Section } from './components/shared/Section';
export { SubSection } from './components/shared/SubSection';
export { SimpleHeader } from './components/shared/SimpleHeader';
export { Footer } from './components/shared/Footer';
export { ProfileSmall } from './components/player/ProfileSmall';
export { GalleryShowcase, type GalleryImageItem, type GalleryShowcaseProps } from './components/shared/GalleryShowcase';
export { TabbedShowcase, type TabbedShowcaseItem, type TabbedShowcaseProps } from './components/shared/TabbedShowcase';


// ==========================================
// 4. NAVIGATION & FUNCTIONAL CONTROLS
// ==========================================
export { LandingNavbar } from './components/marketing/LandingNavbar';
export { AppHeader } from './components/app/AppHeader';
export { ThemeToggle } from './components/shared/ThemeToggle';
export { LanguageSwitcher } from './components/shared/LanguageSwitcher';
export { LoginModal } from './components/shared/LoginModal';
export { CookieBanner } from './components/shared/CookieBanner';


// ==========================================
// 5. MARKETING & LANDING PAGE COMPONENTS
// ==========================================
export { BrandHeader } from './components/marketing/BrandHeader';
export { LaunchCountdown } from './components/marketing/LaunchCountdown';
export { PriceDetail, type PriceDetailProps } from './components/marketing/PriceDetail';
export { ContactForm } from './components/marketing/ContactForm';


// ==========================================
// 6. GAME FINDER, LFG & BATTLE COMPANION
// ==========================================
export { GameCard, type UIGame } from './components/gamefinder/GameCard';
export { GameFilterBar, type GameFilterValues, type GameFilterBarProps } from './components/game/GameFilterBar';
export {
  Game40kSetupPanel,
  Game40kSetupModal,
  DEFAULT_40K_SETTINGS,
  type Game40kSettings,
  type Game40kSetupPanelProps,
} from './components/game/Game40kSetupModal';
export {
  BattleCompanion40k,
  type BattlePhase40k,
  type SecondaryMissionCard,
  type BattleCompanionArmyInput,
  type BattleCompanion40kProps,
} from './components/game/BattleCompanion40k';
export * from './components/game/battle-hud';


// ==========================================
// 7. TOURNAMENTS & LEADERBOARDS
// ==========================================
export { TournamentCard, type UITournament, type TournamentCardProps } from './components/tournament/TournamentCard';
export {
  TournamentMatchupGraphic,
  type UITournamentParticipant,
  type UITournamentMatch,
  type TournamentMatchupGraphicProps,
} from './components/tournament/TournamentMatchupGraphic';
export {
  TournamentStandingsTable,
  type UITournamentStanding,
  type TournamentStandingsTableProps,
} from './components/tournament/TournamentStandingsTable';
export {
  LeaderboardTable,
  PodiumIcons,
  type UIPodiumCounts,
  type UILeaderboardPlayer,
  type UILeaderboardSystemBoard,
  type LeaderboardTableProps,
} from './components/tournament/LeaderboardTable';


// ==========================================
// 8. ARMY VIEWER & PARSERS
// ==========================================
export * from './components/army-viewer/ArmyListView';
export { ArmyListView } from './components/army-viewer/ArmyListView';
export { ArmyHeaderCard, ArmyRosterTable } from './components/army-viewer/ArmyRosterOverview';
export { ArmyUnitDatasheet, ArmyRulesGlossary } from './components/army-viewer/ArmyUnitDatasheet';
export {
  parseArmyListData,
  extractMetadataFromRoster,
  type ArmyMetadata,
  type ParsedUnit,
  type ParsedArmyRoster,
} from './components/army-viewer/armyParser';


// ==========================================
// 9. ANIMATIONS & GRAPHICS
// ==========================================
export { AnimatedBackground } from './components/animations/AnimatedBackground';
export { AnimatedContainerBackground } from './components/animations/AnimatedContainerBackground';
export { CommandHubGraphic } from './components/animations/CommandHubGraphic';
export { CommandForgeGraphic } from './components/animations/CommandForgeGraphic';
export { FallingD6Graphic } from './components/animations/FallingD6Graphic';
export { RotatingD20Graphic } from './components/animations/RotatingD20Graphic';
export { FanningCardsGraphic } from './components/animations/FanningCardsGraphic';
export { CardDrawGraphic } from './components/animations/CardDrawGraphic';
export { HexTilePathGraphic } from './components/animations/HexTilePathGraphic';
export { CardCycloneGraphic } from './components/animations/CardCycloneGraphic';
export { PortalDiceSummonGraphic } from './components/animations/PortalDiceSummonGraphic';
export { HobbyEssentialsGraphic } from './components/animations/HobbyEssentialsGraphic';

// Pricing Tier Fortification Graphics
export { OutpostGraphic } from './components/animations/pricedetail/OutpostGraphic';
export { StrongholdGraphic } from './components/animations/pricedetail/StrongholdGraphic';
export { CitadelGraphic } from './components/animations/pricedetail/CitadelGraphic';
export { FortressOfTerraGraphic } from './components/animations/pricedetail/FortressOfTerraGraphic';