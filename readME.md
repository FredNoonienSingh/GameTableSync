> [app-frontend build 8/9] COPY GTS_app/frontend ./GTS_app/frontend                                              145.1s
 => ERROR [app-frontend build 9/9] RUN npm --workspace=GTS_app/frontend run build                                  969.8s
------
 > [app-frontend build 9/9] RUN npm --workspace=GTS_app/frontend run build:
10.87
10.87 > frontend@0.1.0 build
10.87 > next build
10.87
19.18 ▲ Next.js 16.4.5 (Turbopack)
21.58 ✓ Running next.config.ts took 2.4s
21.80 Attention: Next.js now collects completely anonymous telemetry regarding usage.
21.81 This information is used to shape Next.js' roadmap and prioritize features.
21.81 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
21.81 https://nextjs.org/telemetry
21.81
22.48
23.19   Creating an optimized production build ...
311.7 ✓ Compiled successfully in 4.8min
315.8   Running TypeScript ...
888.1 src/api/client.ts(3,46): error TS2339: Property 'VITE_API_URL' does not exist on type 'ImportMetaEnv'.
888.1 ../../packages/ui/components/AnimatedBackground.tsx(7,5): error TS7016: Could not find a declaration file for module 'react/jsx-runtime'. '/app/node_modules/react/jsx-runtime.js' implicitly has an 'any' type.
888.1   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.1 ../../packages/ui/components/AppComponents/AppHeader.tsx(3,26): error TS7016: Could not find a declaration file for module 'react'. '/app/node_modules/react/index.js' implicitly has an 'any' type.
888.1   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.1 ../../packages/ui/components/AppComponents/AppHeader.tsx(67,5): error TS7016: Could not find a declaration file for module 'react/jsx-runtime'. '/app/node_modules/react/jsx-runtime.js' implicitly has an 'any' type.
888.1   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.1 ../../packages/ui/components/AppComponents/AppHeader.tsx(86,33): error TS2322: Type '{ children: (false | "" | Element)[]; component: React.ForwardRefExoticComponent<any>; href: string; gap: "sm"; style: { textDecoration: string; }; }' is not assignable to type 'IntrinsicAttributes & GroupProps & RefAttributes<HTMLDivElement> & { component?: any; renderRoot?: ((props: Record<string, any>) => ReactNode) | undefined; }'.
888.1   Property 'href' does not exist on type 'IntrinsicAttributes & GroupProps & RefAttributes<HTMLDivElement> & { component?: any; renderRoot?: ((props: Record<string, any>) => ReactNode) | undefined; }'. Did you mean 'ref'?
888.1 ../../packages/ui/components/BrandHeader.tsx(3,26): error TS7016: Could not find a declaration file for module 'react'. '/app/node_modules/react/index.js' implicitly has an 'any' type.
888.1   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.1 ../../packages/ui/components/BrandHeader.tsx(25,5): error TS7016: Could not find a declaration file for module 'react/jsx-runtime'. '/app/node_modules/react/jsx-runtime.js' implicitly has an 'any' type.
888.1   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.8 ../../packages/ui/components/ContactForm.tsx(3,26): error TS7016: Could not find a declaration file for module 'react'. '/app/node_modules/react/index.js' implicitly has an 'any' type.
888.8   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.8 ../../packages/ui/components/ContactForm.tsx(97,5): error TS7016: Could not find a declaration file for module 'react/jsx-runtime'. '/app/node_modules/react/jsx-runtime.js' implicitly has an 'any' type.
888.8   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.8 ../../packages/ui/components/ContactForm.tsx(99,15): error TS2322: Type '{ children: Element[]; gutter: { base: number; md: number; }; align: "center"; }' is not assignable to type 'IntrinsicAttributes & GridProps & RefAttributes<HTMLDivElement> & { component?: any; renderRoot?: ((props: Record<string, any>) => ReactNode) | undefined; }'.
888.8   Property 'gutter' does not exist on type 'IntrinsicAttributes & GridProps & RefAttributes<HTMLDivElement> & { component?: any; renderRoot?: ((props: Record<string, any>) => ReactNode) | undefined; }'.
888.8 ../../packages/ui/components/Footer.tsx(3,26): error TS7016: Could not find a declaration file for module 'react'. '/app/node_modules/react/index.js' implicitly has an 'any' type.
888.8   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.8 ../../packages/ui/components/Footer.tsx(42,5): error TS7016: Could not find a declaration file for module 'react/jsx-runtime'. '/app/node_modules/react/jsx-runtime.js' implicitly has an 'any' type.
888.8   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.8 ../../packages/ui/components/LaunchCountdown.tsx(3,37): error TS7016: Could not find a declaration file for module 'react'. '/app/node_modules/react/index.js' implicitly has an 'any' type.
888.8   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.8 ../../packages/ui/components/LaunchCountdown.tsx(60,5): error TS7016: Could not find a declaration file for module 'react/jsx-runtime'. '/app/node_modules/react/jsx-runtime.js' implicitly has an 'any' type.
888.8   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.8 ../../packages/ui/components/Section.tsx(3,24): error TS7016: Could not find a declaration file for module 'react'. '/app/node_modules/react/index.js' implicitly has an 'any' type.
888.8   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.8 ../../packages/ui/components/Section.tsx(42,5): error TS7016: Could not find a declaration file for module 'react/jsx-runtime'. '/app/node_modules/react/jsx-runtime.js' implicitly has an 'any' type.
888.8   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.8 ../../packages/ui/components/Section.tsx(81,17): error TS2322: Type '{ children: Element[]; gutter: { base: number; md: number; }; align: "center"; }' is not assignable to type 'IntrinsicAttributes & GridProps & RefAttributes<HTMLDivElement> & { component?: any; renderRoot?: ((props: Record<string, any>) => ReactNode) | undefined; }'.
888.8   Property 'gutter' does not exist on type 'IntrinsicAttributes & GridProps & RefAttributes<HTMLDivElement> & { component?: any; renderRoot?: ((props: Record<string, any>) => ReactNode) | undefined; }'.
888.8 ../../packages/ui/components/SubSection.tsx(13,5): error TS7016: Could not find a declaration file for module 'react/jsx-runtime'. '/app/node_modules/react/jsx-runtime.js' implicitly has an 'any' type.
888.8   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.8 ../../packages/ui/components/animations/CardCycloneGraphic.tsx(10,5): error TS7016: Could not find a declaration file for module 'react/jsx-runtime'. '/app/node_modules/react/jsx-runtime.js' implicitly has an 'any' type.
888.8   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.8 ../../packages/ui/components/animations/CommandHubGraphic.tsx(12,5): error TS7016: Could not find a declaration file for module 'react/jsx-runtime'. '/app/node_modules/react/jsx-runtime.js' implicitly has an 'any' type.
888.8   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.8 ../../packages/ui/components/animations/DrawingCardsGraphic.tsx(13,5): error TS7016: Could not find a declaration file for module 'react/jsx-runtime'. '/app/node_modules/react/jsx-runtime.js' implicitly has an 'any' type.
888.8   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.8 ../../packages/ui/components/animations/FallingD6Graphic.tsx(16,5): error TS7016: Could not find a declaration file for module 'react/jsx-runtime'. '/app/node_modules/react/jsx-runtime.js' implicitly has an 'any' type.
888.8   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.8 ../../packages/ui/components/animations/FanningCardsGraphic.tsx(9,5): error TS7016: Could not find a declaration file for module 'react/jsx-runtime'. '/app/node_modules/react/jsx-runtime.js' implicitly has an 'any' type.
888.8   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.8 ../../packages/ui/components/animations/HexTilePathGraphic.tsx(18,5): error TS7016: Could not find a declaration file for module 'react/jsx-runtime'. '/app/node_modules/react/jsx-runtime.js' implicitly has an 'any' type.
888.8   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.8 ../../packages/ui/components/animations/HobbyEssentialsGraphic.tsx(15,5): error TS7016: Could not find a declaration file for module 'react/jsx-runtime'. '/app/node_modules/react/jsx-runtime.js' implicitly has an 'any' type.
888.8   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.8 ../../packages/ui/components/animations/PortalDiceSummonGraphic.tsx(19,5): error TS7016: Could not find a declaration file for module 'react/jsx-runtime'. '/app/node_modules/react/jsx-runtime.js' implicitly has an 'any' type.
888.8   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.8 ../../packages/ui/components/animations/RotatingD20Graphic.tsx(10,5): error TS7016: Could not find a declaration file for module 'react/jsx-runtime'. '/app/node_modules/react/jsx-runtime.js' implicitly has an 'any' type.
888.8   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.8 ../../packages/ui/components/army-viewer/ArmyFormatters.tsx(13,9): error TS7016: Could not find a declaration file for module 'react/jsx-runtime'. '/app/node_modules/react/jsx-runtime.js' implicitly has an 'any' type.
888.8   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.8 ../../packages/ui/components/army-viewer/ArmyListView.tsx(3,25): error TS7016: Could not find a declaration file for module 'react'. '/app/node_modules/react/index.js' implicitly has an 'any' type.
888.8   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.8 ../../packages/ui/components/army-viewer/ArmyListView.tsx(27,5): error TS7016: Could not find a declaration file for module 'react/jsx-runtime'. '/app/node_modules/react/jsx-runtime.js' implicitly has an 'any' type.
888.8   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.8 ../../packages/ui/components/army-viewer/ArmyListView.tsx(45,28): error TS7006: Parameter 'unit' implicitly has an 'any' type.
888.8 ../../packages/ui/components/army-viewer/ArmyRosterOverview.tsx(9,5): error TS7016: Could not find a declaration file for module 'react/jsx-runtime'. '/app/node_modules/react/jsx-runtime.js' implicitly has an 'any' type.
888.8   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.8 ../../packages/ui/components/army-viewer/ArmyUnitDatasheet.tsx(13,5): error TS7016: Could not find a declaration file for module 'react/jsx-runtime'. '/app/node_modules/react/jsx-runtime.js' implicitly has an 'any' type.
888.8   If the 'react' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react'
888.8 ../../packages/ui/components/army-viewer/ArmyUnitDatasheet.tsx(74,13): error TS2322: Type '{ children: Element[]; gutter: string; mt: "xs"; }' is not assignable to type 'IntrinsicAttributes & GridProps & RefAttributes<HTMLDivElement> & { component?: any; renderRoot?: ((props: Record<string, any>) => ReactNode) | undefined; }'.
888.8   Property 'gutter' does not exist on type 'IntrinsicAttributes & GridProps & RefAttributes<HTMLDivElement> & { component?: any; renderRoot?: ((props: Record<string, any>) => ReactNode) | undefined; }'.
888.8 ../../packages/ui/components/army-viewer/ArmyUnitDatasheet.tsx(173,13): error TS2322: Type '{ children: Element[]; gutter: string; }' is not assignable to type 'IntrinsicAttributes & GridProps & RefAttributes<HTMLDivElement> & { component?: any; renderRoot?: ((props: Record<string, any>) => ReactNode) | undefined; }'.
888.8   Property 'gutter' does not exist on type 'IntrinsicAttributes & GridProps & RefAttributes<HTMLDivElement> & { component?: any; renderRoot?: ((props: Record<string, any>) => ReactNode) | undefined; }'.
888.8 ../../packages/ui/index.ts(15,10): error TS2305: Module '"./components/animations/DrawingCardsGraphic"' has no exported member 'DrawingCardsGraphic'.
961.2 Failed to type check.
961.2
966.5 npm error Lifecycle script `build` failed with error:
966.6 npm error code 1
966.6 npm error path /app/GTS_app/frontend
966.6 npm error workspace frontend@0.1.0
966.6 npm error location /app/GTS_app/frontend
966.6 npm error command failed
966.6 npm error command sh -c next build
------
failed to solve: process "/bin/sh -c npm --workspace=GTS_app/frontend run build" did not complete successfully: exit code: 1
ubuntu@mind-and-dice-server:~/gametables