import { ChangeHandler, Handler } from "../util/Handler";
import { Timer } from "./Timer";

export class AudioClip {
    readonly source: string;
    readonly duration: number;
    readonly offset: number;
    readonly timer: Timer;
    readonly onPlayingChanged = new ChangeHandler<boolean>(false);
    readonly onDataFiltered = new Handler<void>();

    private _muted = false;
    // volume = 100;
    private _volume = 100;
    private _filteredData: number[];

    private audio: HTMLAudioElement;
    private loaded = false;

    constructor(timer: Timer, source: string, offset: number, duration: number, chunks?: Blob) {
        this.timer = timer;
        this.source = source;
        this.duration = duration;

        // this.offset = offset < 0 ? offset + this.timer.loopDuration : offset;
        // Use negative offsets for really-late starting clips so they get played.
        if (offset > timer.loopDuration - 500) offset -= timer.loopDuration;
        this.offset = offset;
        this.audio = new Audio(source);
        this.audio.onloadeddata = () => {
            this.loaded = true;
            this.tryPlay();
        }

        timer.onPlay.add(_ => {
            this.tryPlay();
        }, this);

        timer.onPause.add(_ => this.pause(), this);
        
        if (chunks) {
            this.createFilteredData(chunks);
        } else {
            this.createFilteredData(this.createChunks());
        }
    }

    get playing() {
        const time = this.timer.time;
        return time >= this.offset && time <= this.offset + this.duration;
    }

    get end() {
        return this.offset + this.duration;
    }

    get loopDuration() {
        return this.timer.loopDuration;
    }

    get volume() {
        return this._volume;
    }

    set volume(value: number) {
        this._volume = value;
        this.audio.volume = value / 100;
    }

    get muted() {
        return this._muted
    }

    set muted(value: boolean) {
        this._muted = value;
        if (!value && this.playing) this.tryPlay();
    }

    get filteredData() : number[] {
        return this._filteredData;
    }

    tryPlay() {
        if (this.muted) return;
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
        this.onPlayingChanged.emit(true);
        // Try playing at the next loop
        setTimeout(() => this.tryPlay(), this.timer.loopDuration - playOffset - TIMER_OFFSET);
        
        // Stop when done
        setTimeout(() => this.tryStop(), this.duration - playOffset - TIMER_OFFSET);
    }

    tryStop() {
        if (!this.playing) {
            this.onPlayingChanged.emit(false);
            return;
        }

        let time = this.timer.time;
        let timeUntil = this.offset + this.duration - time;
        if (timeUntil >= this.timer.loopDuration) timeUntil -= this.timer.loopDuration;
        setTimeout(() => this.tryStop(), timeUntil);
    }

    pause() {
        // console.log(`Pausing clip at ${this.offset}`);
        this.audio.pause();
        this.onPlayingChanged.emit(false);
    }

    toggleMuted() {
        this.muted = !this.muted;
        if (this.muted) {
            this.pause();
        } else {
            this.tryPlay();
        }
    }

    delete() {
        this.pause();
        this.timer.onPlay.remove(this);
        this.timer.onPause.remove(this);
    }

    createChunks() : Blob {
        return null;
    }

    async createFilteredData(chunks : Blob) {
        if (!chunks) return;

        const audioContext = new AudioContext();
        const buffer = await audioContext.decodeAudioData(await chunks.arrayBuffer());
        const rawData = buffer.getChannelData(0);
        console.log(rawData);

        // let rawData = [];
        // for (let chunk of chunks) {
        //     let buffer = await chunk.arrayBuffer()
        //     console.log(buffer);
        //     let array = Array.from(new Uint8Array(buffer));
        //     rawData = rawData.concat(array);
        //     console.log(rawData);
        // }

        const samples = Math.round(this.duration / this.timer.loopDuration * 300);
        const blockSize = Math.floor(rawData.length / samples); // the number of samples in each subdivision
        let filteredData : number[] = [];
        for (let i = 0; i < samples; i++) {
            let blockStart = blockSize * i; // the location of the first sample in the block
            let sum = 0;
            for (let j = 0; j < blockSize; j++) {
                sum = sum + Math.abs(rawData[blockStart + j]); // find the sum of all the samples in the block
            }
            filteredData.push(sum / blockSize); // divide the sum by the block size to get the average
        }
        console.log(filteredData);

        const max = filteredData.reduce((a, b) => Math.max(a, Math.abs(b)), 0);
        const scale = max == 0 ? 1 : Math.min(1 / max, 10);
        console.log(scale);
        filteredData = filteredData.map(x => x * scale);

        this._filteredData = filteredData;
        this.onDataFiltered.emit();
    }
}
