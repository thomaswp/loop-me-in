import { Storable } from "../store/Storable";
import { Store, StoreObject } from "../store/Store";
import { AudioClip } from "./AudioClip";
import { Timer } from "./Timer";

export class Part extends Storable<Part> {
    name: string;

    readonly timer: Timer;
    // TODO: This should be mutable, but it needs to update timer
    readonly bars: number;
    readonly repetitions: number
    readonly clips = [] as AudioClip[];

    constructor(name: string, timer: Timer, bars: number, repetitions: number) {
        super('Part');
        this.name = name;
        this.timer = timer;
        this.bars = bars;
        this.repetitions = repetitions;
        this.listen();
    }

    listen() {
        Store.I.listeners.push({
            // TODO: surely there's a better way...
            shouldUpdate: o => o.type === 'AudioClip' && o.data['partID'] == this.guid,
            // TODO: Handle non-creation updates
            updated: (o, old) => {
                console.log('Creating clip', o, this);
                AudioClip.create(this, o).then(clip => this.clips.push(clip));
            },
        });
    }

    static async create(timer: Timer, obj: StoreObject) {
        const part = new Part(null, timer, 0, 0);
        await part.readObject(obj);
        return part;
    }

    getPrimitiveFields(): string[] {
        return ['name', 'bars', 'repetitions'];
    }

    get duration() : number {
        return this.timer.barDuration * this.bars;
    }

    get totalDuration() : number {
        return this.duration * this.repetitions;
    }

    get relativeTime() : number {
        let { part, localTime } = this.timer.getPlace();
        return part != this ? -1 : localTime;
    }

    get playing() : boolean {
        return this.timer.playing && this.timer.getPlace().part == this;
    }
}