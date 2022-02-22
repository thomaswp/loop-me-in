import { Handler } from "../util/Handler";

export class Timer {

    playing = false;
    loopDuration: number;

    readonly onPlay = new Handler<number>();
    readonly onPause = new Handler<number>();
    readonly onLoop = new Handler<void>();

    private lastPlayPauseTime = 0;
    private playStartDate: Date;
    private loopTimeout: NodeJS.Timeout;

    // private timeHandlers = new Map<number, Handler<number>>();

    constructor(loopDuration: number) {
        this.loopDuration = loopDuration;
    }

    get time() {
        if (!this.playing) return this.lastPlayPauseTime;
        let time = new Date().getTime() - this.playStartDate.getTime() + this.lastPlayPauseTime;
        time %= this.loopDuration;
        return time;
    }

    set time(value: number) {
        if (this.playing) {
            console.error("Attempt to set time while playing");
            return;
        }
        this.lastPlayPauseTime = value;
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
        this.onPlay.emit(this.time);
        // for (let [offset, handler] of this.timeHandlers) {
        //     this.checkTimeHandler(offset, handler);
        // }
        this.checkLoop(this.loopDuration - this.lastPlayPauseTime);
    }

    checkLoop(delay: number) {
        this.loopTimeout = setTimeout(() => {
            if (!this.playing) return;
            this.onLoop.emit();
            let offset = this.time;
            if (offset > this.loopDuration / 2) offset -= this.loopDuration;
            this.checkLoop(this.loopDuration - offset);
        }, delay);
    }

    pause() {
        if (!this.playing) return;
        this.lastPlayPauseTime = this.time;
        this.playing = false;
        this.playStartDate = null;
        if (this.loopTimeout) clearTimeout(this.loopTimeout);
        this.loopTimeout = null;
        this.onPause.emit(this.time);
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