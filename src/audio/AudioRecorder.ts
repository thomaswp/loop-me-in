import { Store } from "../store/Store";
import { AudioClip, PlayMode } from "./AudioClip";
import { Part } from "./Part";
import { Timer } from "./Timer";

export class AudioRecorder {
    static isSupported() : boolean {
        return !!navigator.mediaDevices.getUserMedia;
    }

    static isReady() : boolean {
        return !!this.mediaStream;
    }

    static mediaStream: MediaStream;

    readonly offset: number;
    readonly part: Part;
    
    chunks: Blob[];
    fileName: string;
    mediaRecorder: MediaRecorder;
    recording: boolean;
    startTime: Date;
    clip: AudioClip;
    timeout;


    static initializeMedia(callback) {

        let onError = function(err) {
            console.error('The following error occurred: ' + err);
        }
        let onSuccess = (stream) => { 
            this.mediaStream = stream;
            // console.log('Recording set up');
            if (callback) callback();
        };
        const constraints = { 
            audio: {
                autoGainControl: false,
                channelCount: 2,
                echoCancellation: false,
                latency: 0,
                noiseSuppression: false,
                sampleRate: 48000,
                sampleSize: 16,
                volume: 1.0,
            },
        };
        navigator.mediaDevices
            .getUserMedia(constraints)
            .then(onSuccess, onError);
    }

    constructor(part: Part, offset: number) {
        if (!AudioRecorder.isReady()) {
            throw 'Audio not ready!';
        }
        this.part = part;
        this.offset = offset;
        this.chunks = [];
        this.fileName = 'audio'
        this.mediaRecorder = new MediaRecorder(AudioRecorder.mediaStream);
        this.mediaRecorder.ondataavailable = (e) => {
            this.chunks.push(e.data);
            // console.log('update', this.chunks);
        };
        this.recording = false;
    }

    start(playMode: PlayMode) {
        this.recording = true;
        this.mediaRecorder.start();
        this.startTime = new Date();
        // console.log("recorder started");

        this.clip = new AudioClip(this.part, this.offset, playMode);
        this.part.clips.push(this.clip);
        this.timeout = setInterval(() => {
            const duration = new Date().getTime() - this.startTime.getTime();
            this.clip.duration = duration;
        }, 15);
    }

    stop() {
        if (!this.recording) return;
        this.mediaRecorder.onstop = () => {
            clearTimeout(this.timeout);
            // console.log('stop', this.chunks);
            const blob = new Blob(this.chunks, { 'type' : 'audio/ogg; codecs=opus' });
            const audioURL = window.URL.createObjectURL(blob);
            const duration = new Date().getTime() - this.startTime.getTime();
            this.clip.initialize(audioURL, duration, blob);
            this.clip.toObject().then(o => Store.I.addObject(o));
            // console.log("adding", clip, "to", this.part);
        };
        this.recording = false;
        this.mediaRecorder.stop();
    }

    // #saveFile() {
    //     // const audio = document.createElement('audio');
    //     // audio.controls = true;
    //     const blob = new Blob(
    //         this.chunks,
    //         { 'type': 'audio/ogg; codecs=opus' }
    //     );
    //     saveData(blob, this.fileName + '.ogg');
    //     this.chunks = [];
    //     // audio.src = audioURL;
    //     console.log("recorder stopped");
    // }
}

// document.addEventListener("DOMContentLoaded", function(){
//     window.saveData = (function () {
//         var a = document.createElement("a");
//         document.body.appendChild(a);
//         a.style = "display: none";
//         return function (blob, fileName) {
//             const url = window.URL.createObjectURL(blob);
//             a.href = url;
//             a.download = fileName;
//             a.click();
//             window.URL.revokeObjectURL(url);
//         };
//     }());
// });
