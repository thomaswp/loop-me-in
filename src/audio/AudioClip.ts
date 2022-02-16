export class AudioClip {
    path: String;
    durationMS: Number;
    barOffset: Number;

    constructor(path: String, duration: Number) {
        this.path = path;
        this.durationMS = duration;
    }
}
