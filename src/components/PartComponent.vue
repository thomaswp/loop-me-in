<template>
  <h3>{{ part.name }} ({{clips.length}} clips) </h3>
  <div class="clip-container">
    <template
      v-for="clip in clips"
      :key="clip"
    >
      <clip-component
        v-if="!clip.hidden"
        :clip="clip"
        @deleted="deleteClip"
      />
    </template>
  </div>
</template>

<script lang="ts">

import { AudioClip } from '../audio/AudioClip'
import ClipComponent from './ClipComponent.vue';
import { Part } from '../audio/Part';

export default {
  name: "PartComponent",
  components: {
    ClipComponent,
  },
  props: {
    part: Part
  },
  data() {
    return {
      visible: true,
      localTime: 0,
    };
  },
  computed: {
    clips() {
      return this.part.clips;
    },
    timePerc() {
      return this.localTime / this.part.duration;
    },
    b1() {
      return (this.timePerc * 100 - 0.5) + '%';
    },
    b2() {
      return (this.timePerc * 100) + '%';
    },
    b3() {
      return (this.timePerc * 100 + 0.5) + '%';
    },
  },
  methods: {

    deleteClip(clip: AudioClip) {
      clip.delete();
      let index = this.clips.indexOf(clip);
      if (index >= 0) {  
        this.clips.splice(index, 1);
      }
    },

    updateTime() {
      
    }
  },
  mounted() {
    setInterval(() => {
      // console.log(this.scrubberValue, this.timer.time);
      const timer = this.part.timer;
      const place = timer.getPlace();
      if (place.part != this.part) this.localTime = -500;
      else this.localTime = timer.getPlace().localTime;
    }, 15);
  },
};
</script>
<style scoped>

.clip-container {
  width: 80%;
  border: 2px black solid;
  background-color: #eee;
  margin-left: auto;
  margin-right: auto;
  text-align: left;

  background: rgb(188,193,237);
  background: linear-gradient(90deg, rgba(188,193,237,1) v-bind(b1), rgba(9,9,121,1) v-bind(b2), rgba(245,245,245,1) v-bind(b3));
}

</style>
