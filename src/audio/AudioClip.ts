import { Storable } from "../store/Storable";
import { Store, StoreObject } from "../store/Store";
import { ChangeHandler, Handler } from "../util/Handler";
import { Part } from "./Part";
import { Place, Timer } from "./Timer";

export enum PlayMode {
    Once = 0,
    Always,
    EveryOther,
    Echo,
}

export class AudioClip extends Storable<AudioClip> {
    readonly offset: number;
    readonly timer: Timer;
    readonly part: Part;
    readonly onPlayingChanged = new ChangeHandler<boolean>(false);
    readonly onDataFiltered = new Handler<void>();
    readonly onLoaded = new Handler<void>();
    readonly partID: string;

    duration: number;
    playMode: PlayMode;
    hidden = false;

    private _muted = false;
    private _volume = 100;
    private _filteredData: number[];
    
    private audio: HTMLAudioElement;
    private loaded = false;
    private chunks: Blob;

    constructor(part: Part, offset: number, playMode: PlayMode) {
        super('AudioClip');
        const timer = part.timer;
        this.timer = timer;
        this.part = part;
        this.partID = part.guid;
        this.playMode = playMode;
        this.duration = 0;
        if (this.playMode == PlayMode.Once) this._muted = true;

        // Use negative offsets for really-late starting clips so they get played.
        if (offset > part.duration - 500) offset -= part.duration;
        this.offset = offset;
    }

    static async create(part: Part, obj: StoreObject) {
        const clip = new AudioClip(part, 0, PlayMode.Once);
        await clip.readObject(obj);
        const audioURL = window.URL.createObjectURL(clip.chunks);
        clip.initialize(audioURL, clip.duration, clip.chunks);
        return clip;
    }

    getPrimitiveFields(): string[] {
        this.registerSerializableField(
            'chunks',
            (blob: Blob) => (AudioClip.blobToBase64(blob)),
            (string: string) => (fetch(string).then(res => res.blob())),
        );
        this.registerSerializableField(
            'playMode',
            (mode: PlayMode) => (new Promise(r => r(mode.toString()))),
            (string: string) => (PlayMode[string]),
        );
        return ['offset', 'duration', 'partID', 'muted'];
    }

    static blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = function () {
            resolve(reader.result as string);
            };
            reader.readAsDataURL(blob);
        });
    };

    initialize(source: string, duration: number, chunks?: Blob) {
        this.duration = duration;
        this.chunks = chunks;

        this.audio = new Audio(source);
        this.audio.oncanplaythrough = () => {
            if (this.loaded) return;
            this.loaded = true;
            // console.log('loaded', this);
            this.tryPlay();
            this.onLoaded.emit();
        }

        this.timer.onPartStarted.add(place => {
            this.tryPlay(place);
        }, this);

        this.timer.onPause.add(_ => this.pause(), this);

        if (chunks) {
            this.createFilteredData(chunks);
        } else {
            this.createFilteredData(this.createChunks());
        }

        return this;
    }

    get playing() {
        if (!this.timer.playing) return false;
        const place = this.timer.getPlace();
        if (place.part.guid != this.part.guid) return false;
        // Only play every other time!
        if (this.playMode == PlayMode.EveryOther && place.iteration % 2 != 0) return;
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
        // console.log('Trying to play', this);
        if (this.muted) return;
        if (!this.loaded || !this.timer.playing) return;

        if (!place) place = this.timer.getPlace();
        // console.log(this.timer, place.part, this.part);
        // If this part isn't playing or this clip is done, return
        if (place.part.guid != this.part.guid) return;
        if (place.localTime > this.end) return;
        // console.log(place.localTime);

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
            console.log('delaying for...', timeUntil);
            return;
        }
        
        if (!this.playing) return;
        let playOffset = -timeUntil;
        // console.log(`Playing ${this.part.name} clip at ${this.offset} with offset ${playOffset} in ${this.timer.time}`);
        this.audio.currentTime = playOffset / 1000;
        // console.log('Actually playing', this);
        this.audio.play();
        this.onPlayingChanged.emit(true);
        
        // Stop when done
        setTimeout(() => this.tryStop(), this.duration - playOffset);
    }

    tryStop() {
        if (!this.playing) {
            // console.log(`Stopping ${this.part.name} clip at ${this.offset} at duration ${this.duration} with ${this.audio.currentTime}`);
            // this.audio.pause();
            this.onPlayingChanged.emit(false);
            if (this.playMode == PlayMode.Once || this.playMode == PlayMode.Echo) {
                // console.log('Muting', this);
                this.muted = true;
            }
            return;
        }

        const place = this.timer.getPlace();
        setTimeout(() => this.tryStop(), this.end - place.localTime);
    }

    pause() {
        if (!this.loaded) return;
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
        // console.log(rawData);

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
        // console.log(filteredData);

        const max = filteredData.reduce((a, b) => Math.max(a, Math.abs(b)), 0);
        const scale = max == 0 ? 1 : Math.min(1 / max, 10);
        // console.log(scale);
        filteredData = filteredData.map(x => x * scale);

        this._filteredData = filteredData;
        this.onDataFiltered.emit();
    }
}
