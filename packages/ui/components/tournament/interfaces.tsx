import {UUID, 
        DateRange, 
        Club, 
        Player,
        AvatarResource, 
        Status
    } from '@gts/ui';

export enum Placement{
    FIRST=0,
    SECOND=1,
    THIRD=2.
}

export enum MatchingAlgo{
    SWISS="Swiss",
    ROUNDROBIM="Round Robin"
}

export enum TournamentVenue {
  IN_PERSON = 'IN_PERSON',
  ONLINE = 'ONLINE'
}

export enum MatchScheduling {
  LIVE_EVENT = 'LIVE_EVENT',
  FLEXIBLE = 'FLEXIBLE'
}

export interface Team{
    ID:UUID;
    DisplayName:string;
    Players:Player[];
    Score: number;
}

export interface Round{
    ID:UUID,
    Status:Status,
    Result:Record<string, number> //Player ID, Player Score
}

export interface Trophy {
    DisplayName: string;
    IconName:string;
    Placement: Placement;
    WonIn: UUID; // Tournament ID
    AwardedAt: Date;
}

export interface Tournament{
    ID: UUID;
    DisplayName: string;
    AvatarResource:AvatarResource;
    Organizer: Club;
    Time: DateRange;
    TournamentVenue:TournamentVenue;
    MatchScheduling:MatchScheduling;
    Status:Status;
    Teams:Team;
    KeyRequired:boolean;

}