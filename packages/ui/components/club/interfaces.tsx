import {UUID, AvatarResource, Player, Tournament} from '@gts/ui';

export enum Subscription{
    OUTPOST="OUTPOST",
    STRONGHOLD="STRONGHOLD",
    CITADEL="CITADEL"
    FORT
}

export interface Table{
    ID:UUID,
}

export interface ClubMember extends Player {
    clubRole: 'OWNER' | 'ADMIN' | 'KEYMASTER' |'PLAYER';
    JoinedAt: Date
}

export interface Club {
    ID: UUID;
    DisplayName: string;
    Avatar:AvatarResource;

}