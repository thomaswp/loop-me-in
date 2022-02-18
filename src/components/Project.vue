<template>
  <h1>Record</h1>
  <input 
    class="scrubber" type="range" ref="scrubber" min="0" 
    :max="this.partDuration" 
    :value="scrubberValue"
    :disabled="recording"
    @input="pause"
    @change="scrub"
  />
  <br />
  <button @click="timer.togglePlay" :disabled="recording">{{ !timer.playing ? "Play" : "Pause"}}</button>
  <p>
    Clips: {{ clips.length }}
  </p>
  <clip
    v-for="clip in clips"
    :key="clip"
    :clip="clip"
  />
  <button @click="toggleRecord" :disabled="!timer.playing">{{ !recording ? "Record" : "Stop"}}</button>
</template>

<script lang="ts">

import { AudioClip } from '../audio/AudioClip'
import { AudioRecorder } from '../audio/AudioRecorder'
import Clip from './Clip.vue';
import { Timer } from '../audio/Timer'
import clickTrackURL from '../assets/audio/click.ogg'

export default {
  name: "Project",
  components: {
    Clip
  },
  props: {
    msg: String,
  },
  data() {
    let barDuration = 2000;
    let barCount = 4;
    return {
      clips: [] as AudioClip[],
      audioRecorder: null as AudioRecorder,
      timer: new Timer(barDuration * barCount),
      barDurationMS: barDuration,
      barCount: barCount,
      recordOffset: 60,
      scrubberValue: 0,
      wasPlaying: false,
    };
  },
  computed: {
    recording() {
      return this.audioRecorder != null;
    },
    partDuration() {
      return this.barDurationMS * this.barCount;
    },
  },
  methods: {
    toggleRecord() {
      if (this.recording) this.stopClip();
      else this.startClip();
    },

    startClip() {
      if (this.recording) return;
      this.audioRecorder = new AudioRecorder(
        // We offset the start time to account for mic delays
        this.timer.time - this.recordOffset);
      this.audioRecorder.start();
    },

    stopClip() {
      if (!this.recording) return;
      this.audioRecorder.stop(this.timer, (audioURL) => {
        console.log("stopping:", audioURL, this.clips);
        this.clips.push(audioURL);
        this.audioRecorder = null;
      });
    },

    pause() {
      if (this.recording) return;
      if (!this.timer.playing) return;
      console.log("pause");
      this.timer.pause();
      this.wasPlaying = true;
      this.updateTime();
    },

    scrub() {
      if (this.recording) return;
      console.log("scrub");
      this.timer.pause();
      this.updateTime();
      if (this.wasPlaying) {
        this.timer.play();
        this.wasPlaying = false;
      }
    },

    updateTime() {
      const newTime = parseInt(this.$refs['scrubber'].value);
      this.timer.time = this.scrubberValue = newTime;
    }
  },
  mounted() {
    AudioRecorder.initializeMedia(() => {
      // TODO
    });
    setInterval(() => {
      // console.log(this.scrubberValue, this.timer.time);
      if (this.timer.playing) {
        this.scrubberValue = this.timer.time;
      }
    }, 10);
    this.clips = [
      new AudioClip(this.timer, clickTrackURL, 0, 2000),
      new AudioClip(this.timer, clickTrackURL, 2000, 2000),
      new AudioClip(this.timer, clickTrackURL, 4000, 2000),
      new AudioClip(this.timer, clickTrackURL, 6000, 2000),
    ]
  },
};
</script>
<style scoped>

.scrubber {
  width: 80%;
}

</style>
