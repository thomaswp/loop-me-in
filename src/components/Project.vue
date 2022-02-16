<template>
  <h1>Record</h1>
  <input class="scrubber" type="range" ref="scrubber" min="0" :max="this.partDuration" :value="time" />
  <br />
  <button @click="togglePlay" :disabled="recording">{{ !playing ? "Play" : "Pause"}}</button>
  <p>
    Clips: {{ clips.length }}
  </p>
  <clip :clip='clickTrackClip' />
  <clip
    v-for="clip in clips"
    :key="clip"
    :clip="clip"
  />
  <button @click="startClip" :disabled="recording">Record</button>
  <button @click="stopClip" :disabled="!recording">Stop</button>
</template>

<script lang="ts">

import { AudioClip } from '../audio/AudioClip'
import { AudioRecorder } from '../audio/AudioRecorder'
import Clip from './Clip.vue';
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
    return {
      clips: [] as AudioClip[],
      audioRecorder: null as AudioRecorder,
      barDurationMS: 2000,
      barCount: 8,
      playing: false,
      time: 0,
      playStartTime: 0,
      playStartDate: null as Date,
    };
  },
  computed: {
    recording() {
      return this.audioRecorder != null;
    },
    clickTrackClip() {
      return new AudioClip(clickTrackURL, 2000);
    },
    partDuration() {
      return this.barDurationMS * this.barCount;
    },
  },
  methods: {
    startClip() {
      if (this.recording) return;
      this.audioRecorder = new AudioRecorder();
      this.audioRecorder.start();
    },

    stopClip() {
      if (!this.recording) return;
      this.audioRecorder.stop((audioURL) => {
        console.log("stopping:", audioURL, this.clips);
        this.clips.push(audioURL);
        this.audioRecorder = null;
      });
    },

    togglePlay() {
      if (!this.playing) this.play();
      else this.pause();
    },

    play() {
      if (this.playing) return;
      console.log("play");
      this.playing = true;
      this.playStartTime = this.time;
      this.playStartDate = new Date();
    },

    pause() {
      if (!this.playing) return;
      this.playing = false;
      this.updateTime();
      this.playStartDate = null;
      this.playStartTime = undefined;
    },

    updateTime() {
      if (!this.playing) return;
      let time = new Date().getTime() - this.playStartDate.getTime() + this.playStartTime;
      time %= this.partDuration;
      this.time = time;
    }
  },
  mounted() {
    AudioRecorder.initializeMedia();
    setInterval(() => {
      this.updateTime();
    }, 50);
  },
};
</script>
<style scoped>

.scrubber {
  width: 80%;
}

</style>
