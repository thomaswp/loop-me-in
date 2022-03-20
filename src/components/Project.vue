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
  <br />
  <play-mode-button @playModeChanged="updatePlayMode" :playMode="defaultPlayMode"/>
  
  <part-component 
    v-for="part in parts"
    :key="part"
    :part="part"
  />
</template>

<script lang="ts">

import { AudioClip, PlayMode } from '../audio/AudioClip'
import { AudioRecorder } from '../audio/AudioRecorder'
import PartComponent from './PartComponent.vue';
import PlayModeButton from './PlayModeButton.vue';
import { Timer } from '../audio/Timer'
import clickTrackURL from '../assets/audio/click.mp3'
// import clickTrackURL from '../assets/audio/click60.mp3'
import click4TrackURL from '../assets/audio/click4.mp3'
import { Part } from '../audio/Part';
import { Store, StoreObject } from '../store/Store'
import { StoreClient } from '../store/StoreClient'

export default {
  name: "Project",
  components: {
    PartComponent,
    PlayModeButton,
  },
  props: {
  },
  data() {
    let timer = new Timer(2000);
    let parts = [
      new Part('A Part', timer, 4, 1),
      new Part('B Part', timer, 4, 1),
      // new Part('B Part', timer, 4, 2),
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
      defaultPlayMode: PlayMode.Always,
      store: null as Store,
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
      this.audioRecorder.start(this.defaultPlayMode);
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
      // console.log("pause");
      this.timer.pause();
      this.wasPlaying = true;
      this.updateTime();
    },

    scrub() {
      if (this.recording) return;
      // console.log("scrub");
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
    },

    updatePlayMode(playMode) {
      this.defaultPlayMode = playMode;
    },
  },
  mounted() {

    const urlParams = new URLSearchParams(window.location.search);
    this.store = new Store(urlParams.get('sessionID'));
    const isNew = !urlParams.has('sessionID');
    if (isNew) {
      window.history.replaceState('', '', window.location + '?sessionID=' + this.store.sessionID);
    }
    console.log(this.store);
    const base = location.protocol + "//" + location.hostname + ':3000/api/';
    const client = new StoreClient(this.store, base);
    setInterval(() => {
      client.sync(true);
      console.log(this.store);
    }, 2000);

    AudioRecorder.initializeMedia(() => {
      // TODO
    });
    setInterval(() => {
      // console.log(this.scrubberValue, this.timer.time);
      if (this.timer.playing) {
        this.scrubberValue = this.timer.time;
      }
    }, 10);

    this.timer.onPartStarted.add((place) => {
      // console.log('part started', place);
      if (!this.recording) return;
      this.stopClip();
      this.startClip();
    });

    if (isNew) {
      this.parts.forEach(p => {
        const duration = this.timer.barDuration;
        // p.clips.push(new AudioClip(p, 0, this.defaultPlayMode).initialize(click4TrackURL, duration * 4));
        for (let x = 0; x < p.bars; x++) {
          const clip = new AudioClip(p, duration * x, this.defaultPlayMode).initialize(clickTrackURL, duration);
          clip.hidden = true;
          p.clips.push(clip);
        }
      });
    }
    
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
