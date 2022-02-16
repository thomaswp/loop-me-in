import { AudioClip } from "./AudioClip";

export class AudioRecorder {
    static isSupported() : boolean {
        return !!navigator.mediaDevices.getUserMedia;
    }

    static isReady() : boolean {
        return !!this.mediaStream;
    }

    static mediaStream: MediaStream;

    chunks: BlobPart[];
    fileName: string;
    mediaRecorder: MediaRecorder;
    recording: boolean;
    startTime: Date;


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

    constructor() {
        if (!AudioRecorder.isReady()) {
            throw 'Audio not ready!';
        }
        this.chunks = [];
        this.fileName = 'audio'
        this.mediaRecorder = new MediaRecorder(AudioRecorder.mediaStream);
        this.mediaRecorder.ondataavailable = (e) => {
            this.chunks.push(e.data);
            // console.log('update', this.chunks);
        };
        this.recording = false;
    }

    start() {
        this.recording = true;
        this.mediaRecorder.start();
        this.startTime = new Date();
        // console.log("recorder started");
    }

    stop(callback: (clip: AudioClip) => void) {
        if (!this.recording) return;
        this.mediaRecorder.onstop = () => {
            // console.log('stop', this.chunks);
            const blob = new Blob(this.chunks, { 'type' : 'audio/ogg; codecs=opus' });
            const audioURL = window.URL.createObjectURL(blob);
            const duration = new Date().getTime() - this.startTime.getTime();
            const clip = new AudioClip(audioURL, duration);
            callback(clip);
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
