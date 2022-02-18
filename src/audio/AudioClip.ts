import { Timer } from "./Timer";

export class AudioClip {
    readonly source: string;
    readonly duration: number;
    readonly offset: number;
    readonly timer: Timer;

    private audio: HTMLAudioElement;
    private loaded = false;

    constructor(timer: Timer, source: string, offset: number, duration: number) {
        this.timer = timer;
        this.source = source;
        this.duration = duration;
        this.offset = offset < 0 ? offset + this.timer.loopDuration : offset;
        this.audio = new Audio(source);
        this.audio.onloadeddata = () => {
            this.loaded = true;
            this.tryPlay();
        }

        timer.onPlay.add(_ => {
            this.tryPlay();
        });

        timer.onPause.add(_ => this.pause());
    }

    get playing() {
        const time = this.timer.time;
        return time >= this.offset && time <= this.offset + this.duration;
    }

    tryPlay() {
        const TIMER_OFFSET = 15;

        if (!this.loaded || !this.timer.playing) return;
        const time = this.timer.time;
        let timeUntil = this.offset - time;
        // If the clip has already stopped, we calculate time until loop
        if (timeUntil < -this.duration) timeUntil += this.timer.loopDuration;
        if (timeUntil > 0) {
            setTimeout(() => {
                this.tryPlay()
            }, timeUntil - TIMER_OFFSET); // small offet
            return;
        }
        
        let playOffset = -timeUntil;
        // console.log(`Playing clip at ${this.offset} with offset ${playOffset}`);
        this.audio.currentTime = playOffset / 1000;
        this.audio.play();
        // Try playing at the next loop
        setTimeout(() => this.tryPlay(), this.timer.loopDuration - playOffset - TIMER_OFFSET);
    }

    pause() {
        // console.log(`Pausing clip at ${this.offset}`);
        this.audio.pause();
    }
}
