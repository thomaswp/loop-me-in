<template>
  <h1>Record!</h1>
  <p>{{ server }}</p>
  <input 
    class="scrubber" type="range" ref="scrubber" min="0" 
    :max="this.timer.loopDuration" 
    :value="scrubberValue"
    :disabled="recording"
    @input="pause"
    @change="scrub"
  />
  <br />
  <button @click="timer.togglePlay" :disabled="recording">{{ !timer.playing ? "Play" : "Pause"}}</button>
  <br />
  <button @click="toggleRecord">{{ !recording ? "Record" : "Stop"}}</button>
  
  <part-component 
    v-for="part in parts"
    :key="part"
    :part="part"
  />
</template>

<script lang="ts">

import { AudioClip } from '../audio/AudioClip'
import { AudioRecorder } from '../audio/AudioRecorder'
import PartComponent from './PartComponent.vue';
import { Timer } from '../audio/Timer'
import clickTrackURL from '../assets/audio/click4.mp3'
import { Part } from '../audio/Part';

export default {
  name: "Project",
  components: {
    PartComponent,
  },
  props: {
  },
  data() {
    let barCount = 4;
    let timer = new Timer(2000);
    let parts = [
      new Part('A Part', timer, barCount, 2),
      new Part('B Part', timer, barCount, 2),
    ];
    parts.forEach(p => timer.addPart(p));
    return {
      parts: parts,
      audioRecorder: null as AudioRecorder,
      timer: timer,
      recordOffset: 60,
      scrubberValue: 0,
      wasPlaying: false,
      server: '',
    };
  },
  computed: {
    recording() {
      return this.audioRecorder != null;
    },
  },
  methods: {
    toggleRecord() {
      if (this.recording) this.stopClip();
      else this.startClip();
    },

    startClip() {
      if (!this.playing) this.timer.play();
      if (this.recording) return;
      const place = this.timer.getPlace();
      this.audioRecorder = new AudioRecorder(
        place.part,
        // We offset the start time to account for mic delays
        place.localTime - this.recordOffset);
      this.audioRecorder.start();
    },

    stopClip() {
      if (!this.recording) return;
      // TODO: find part
      this.audioRecorder.stop();
      this.audioRecorder = null;
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
    this.parts.forEach(p => p.clips.push(...[
      new AudioClip(p, 0).initialize(clickTrackURL, 8000),
      // new AudioClip(p, clickTrackURL, 2000, 2000),
      // new AudioClip(p, clickTrackURL, 4000, 2000),
      // new AudioClip(p, clickTrackURL, 6000, 2000),
    ]));
    this.timer.onPartStarted.add((place) => {
      // console.log('part started', place);
      if (!this.recording) return;
      this.stopClip();
      this.startClip();
    });
    
    let x = location.protocol + "//" + location.hostname + ':3000/api/hello';
    // let x = 'https://www.google.com'
    // console.log(x);
    fetch(x)
      .then(response => response.json())
      .then(data => this.server = data.hello);
      // .then(response => response.text())
      // .then(data => console.log(data));

  },
};
</script>
<style scoped>

.scrubber {
  width: 80%;
}

</style>
