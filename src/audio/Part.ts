import { AudioClip } from "./AudioClip";
import { Timer } from "./Timer";

export class Part {
    readonly timer: Timer;
    // TODO: This should be mutable, but it needs to update timer
    readonly bars: number;
    readonly repetitions: number
    readonly clips = [] as AudioClip[];

    constructor(timer: Timer, bars: number, repititions: number) {
        this.timer = timer;
        this.bars = bars;
        this.repetitions = repititions;
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