import { AvatarResource } from '@gts/ui';

export enum GameFamily {
    TABLETOP="TABLETOP",
    RPG="RPG",
    TCG="TCG"
}

// Only for display !
export interface Game {
    DisplayName: string,
    Avatar:AvatarResource,
}