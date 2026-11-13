/* Player Interfaces  */
import {UUID, AvatarResource, Tournament, Trophy, Club, Game} from '@gts/ui';


export interface Badge {
    DisplayName: string,
    IconName:string,
    AwardedBy: Player,
    AwardedAt: Date,
}

export interface ELO{
    Game:Game;
    Score:number;
}

export interface Player {
    ID: UUID,
    DisplayName: string;
    DiscordID: UUID;
    Avatar: AvatarResource;
    MemberAt:Club[]
    Games: Game[];
    ELO: ELO[];
    Badges: Badge[];
    Tournaments: Tournament[];
    Trophies: Trophy[];
}

