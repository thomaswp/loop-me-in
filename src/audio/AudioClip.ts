import { ChangeHandler, Handler } from "../util/Handler";
import { Part } from "./Part";
import { Place, Timer } from "./Timer";

export class AudioClip {
    readonly source: string;
    readonly duration: number;
    readonly offset: number;
    readonly timer: Timer;
    readonly part: Part;
    readonly onPlayingChanged = new ChangeHandler<boolean>(false);
    readonly onDataFiltered = new Handler<void>();

    private _muted = false;
    // volume = 100;
    private _volume = 100;
    private _filteredData: number[];

    private audio: HTMLAudioElement;
    private loaded = false;

    constructor(part: Part, source: string, offset: number, duration: number, chunks?: Blob) {
        const timer = part.timer;
        this.timer = timer;
        this.part = part;
        this.source = source;
        this.duration = duration;

        // Use negative offsets for really-late starting clips so they get played.
        if (offset > part.duration - 500) offset -= part.duration;
        this.offset = offset;
        this.audio = new Audio(source);
        this.audio.onloadeddata = () => {
            this.loaded = true;
            this.tryPlay();
        }

        timer.onPartStarted.add(place => {
            this.tryPlay(place);
        }, this);

        timer.onPause.add(_ => this.pause(), this);
        
        if (chunks) {
            this.createFilteredData(chunks);
        } else {
            this.createFilteredData(this.createChunks());
        }
    }

    get playing() {
        if (!this.timer.playing) return false;
        const place = this.timer.getPlace();
        if (place.part != this.part) return false;
        const time = place.localTime;
        return time >= this.offset && time <= this.offset + this.duration;
    }

    get end() {
        return this.offset + this.duration;
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

    get partDuration() {
        return this.part.duration
    }

    tryPlay(place?: Place) {
        if (this.muted) return;
        if (!this.loaded || !this.timer.playing) return;

        if (!place) place = this.timer.getPlace();
        // If this part isn't playing or this clip is done, return
        if (place.part != this.part) return;
        if (place.localTime > this.end) return;

        const TIMER_OFFSET = 15;
        const time = place.localTime;

        // We calculate the time until this clip plays. We only worry
        // about the current loop, since tryPlay will be called again
        // when this Part repeats.
        let timeUntil = this.offset - time;
        if (timeUntil > 0) {
            setTimeout(() => {
                this.tryPlay()
            }, timeUntil - TIMER_OFFSET); // small offet
            return;
        }
        
        let playOffset = -timeUntil;
        console.log(`Playing clip at ${this.offset} with offset ${playOffset}`);
        this.audio.currentTime = playOffset / 1000;
        this.audio.play();
        this.onPlayingChanged.emit(true);
        
        // Stop when done
        setTimeout(() => this.tryStop(), this.duration - playOffset);
    }

    tryStop() {
        if (!this.playing) {
            this.onPlayingChanged.emit(false);
            return;
        }

        const place = this.timer.getPlace();
        setTimeout(() => this.tryStop(), this.end - place.localTime);
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
        this.timer.onPartStarted.remove(this);
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

        const samples = Math.round(this.duration / this.part.duration * 300);
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
