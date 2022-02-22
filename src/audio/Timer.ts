import { Handler } from "../util/Handler";

export class Timer {

    playing = false;
    loopDuration: number;

    readonly onPlay = new Handler<number>();
    readonly onPause = new Handler<number>();

    private lastPlayPauseTime = 0;
    private playStartDate: Date;

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
    }

    pause() {
        if (!this.playing) return;
        this.lastPlayPauseTime = this.time;
        this.playing = false;
        this.playStartDate = null;
        this.onPause.emit(this.time);
    }
}