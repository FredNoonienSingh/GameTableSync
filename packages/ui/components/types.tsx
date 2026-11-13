/* util types */
import type { StaticImageData } from 'next/image';


export type UUID = string;
export type AvatarResource = string | StaticImageData | null;

export enum Status{
    DONE="done",
    ACTIVE="active",
    WAITING="waiting",
    INACTIVE="inactive"
}

export interface DateRange {
    start: Date,
    end: Date
}
