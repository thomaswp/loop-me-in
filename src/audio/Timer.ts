import { Handler } from "../util/Handler";
import { Part } from "./Part";

export interface Place {
    part: Part;
    localTime: number;
    iteration: number;
}

export class Timer {

    playing = false;

    readonly onPlay = new Handler<Place>();
    readonly onPause = new Handler<Place>();
    // readonly onLoop = new Handler<void>();
    readonly onPartStarted = new Handler<Place>();

    readonly barDuration : number;

    private _loopDuration: number;

    private lastPlayPauseTime = 0;
    private playStartDate: Date;
    private partTimeout: NodeJS.Timeout;
    private lastPlace = {} as Place;
    private parts = [] as Part[];

    // private timeHandlers = new Map<number, Handler<number>>();

    constructor(barDuration: number) {
        this.barDuration = barDuration;
        this.updateParts();
    }

    get time() {
        if (!this.playing) return this.lastPlayPauseTime;
        let time = new Date().getTime() - this.playStartDate.getTime() + this.lastPlayPauseTime;
        time %= this._loopDuration;
        return time;
    }

    set time(value: number) {
        if (this.playing) {
            console.error("Attempt to set time while playing");
            return;
        }
        this.lastPlayPauseTime = value;
    }

    get loopDuration() {
        return this._loopDuration;
    }

    getPlace() : Place {
        let time = this.time;
        for (let part of this.parts) {
            const duration = part.totalDuration;
            if (time <= duration) {
                let localTime = time % part.duration;
                let iteration = Math.floor(time / part.duration);
                if (iteration >= part.repetitions) iteration = part.repetitions - 1;
                return {part, localTime, iteration};
            }
            time -= duration;
        }
        console.log(this.parts);
        throw 'Missing parts?';
    }

    addPart(part: Part) {
        this.parts.push(part);
        this.updateParts();
    }

    private updateParts() {
        this._loopDuration = this.parts.reduce((a, b) => a + b.totalDuration, 0);
        this.startPartCallback(this._loopDuration - this.time);

    }

    togglePlay() {
        if (!this.playing) this.play();
        else this.pause();
    }

    play() {
        if (this.playing) return;
        this.lastPlayPauseTime = this.time;
        this.playing = true;
        this.playStartDate = new Date();

        const place = this.getPlace();
        this.onPlay.emit(place);
        this.onPartStarted.emit(place);
        this.lastPlace = place;
        // for (let [offset, handler] of this.timeHandlers) {
        //     this.checkTimeHandler(offset, handler);
        // }
        this.startPartCallback(place.part.duration - place.localTime);
    }

    startPartCallback(delay: number) {
        if (this.partTimeout) clearTimeout(this.partTimeout);
        this.partTimeout = setTimeout(() => {
            if (!this.playing) return;
            const place = this.getPlace();
            // Only trigger a part start if this is early in the clip, or we
            // actually changed parts; otherwise we'll get a double-trigger
            if (
                place.localTime < place.part.duration / 2 ||
                place.part != this.lastPlace.part || 
                place.iteration != this.lastPlace.iteration
            ) {
                this.onPartStarted.emit(place);
                this.lastPlace = place;
            } else {
                console.log('Skipping part start', place);
            }
            this.startPartCallback(place.part.duration - place.localTime);
        }, delay);
    }

    pause() {
        if (!this.playing) return;
        this.lastPlayPauseTime = this.time;
        this.playing = false;
        this.playStartDate = null;
        if (this.partTimeout) clearTimeout(this.partTimeout);
        this.partTimeout = null;
        this.onPause.emit(this.getPlace());
    }

    // checkTimeHandler(offset: number, handler: Handler<number>) {
    //     if (!this.playing) return;

    //     const TIMER_OFFSET = 15;

    //     const time = this.time;
    //     let timeUntil = offset - time;
    //     // If the clip has already stopped, we calculate time until loop
    //     if (timeUntil < -this.duration) timeUntil += this.timer.loopDuration;
    //     if (timeUntil > 0) {
    //         setTimeout(() => {
    //             this.tryPlay()
    //         }, timeUntil - TIMER_OFFSET); // small offet
    //         return;
    //     }
        
    //     let playOffset = -timeUntil;
    //     // console.log(`Playing clip at ${this.offset} with offset ${playOffset}`);
    //     this.audio.currentTime = playOffset / 1000;
    //     this.audio.play();
    //     this.onPlayingChanged.emit(true);
    //     // Try playing at the next loop
    //     setTimeout(() => this.tryPlay(), this.timer.loopDuration - playOffset - TIMER_OFFSET);
        
    //     // Stop when done
    //     setTimeout(() => this.tryStop(), this.duration - playOffset - TIMER_OFFSET);
    // }

    // addTimeHandler(offset: number, callback: (arg: number) => void) {
    //     if (!this.timeHandlers.has(offset)) {
    //         let handler = new Handler<number>();
    //         this.timeHandlers.set(offset, handler);
    //         this.checkTimeHandler(offset, handler);
    //     }
    //     this.timeHandlers.get(offset).add(callback);
    // }
}