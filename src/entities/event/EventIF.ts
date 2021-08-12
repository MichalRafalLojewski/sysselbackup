import {MongodbEntityIF} from "../MongodbEntityIF";
import { EventKey } from "./EventKey";

// INTERFACES:
export interface EventIF extends MongodbEntityIF {
    kind: string;
    event_key: EventKey;
    data_object;
    participants: any[];
    belongs_to?;
    belongs_to_kind?: string;
}

// CLASSES:
export class Event implements EventIF {
    public kind: string;
    public event_key: EventKey;
    public data_object;
    public participants: any[];
    public belongs_to;
    public belongs_to_kind: string;
    constructor(kind: string, event_key: EventKey, data_object, participants: any[], belongs_to?, belongs_to_kind?:string) {
        this.data_object = data_object;
        this.participants = participants;
        this.kind = kind;
        this.event_key = event_key;
        this.belongs_to = belongs_to;
        this.belongs_to_kind = belongs_to_kind;
    }
}