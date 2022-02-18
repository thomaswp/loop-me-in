<template>
  <div>
      <h2>Clip</h2>
      <p>Duration: {{ duration }}</p>
  </div>
</template>

<script lang="ts">
import { AudioClip } from '../audio/AudioClip'

export default {
  name: "Clip",
  props: {
    clip: AudioClip,
  },
  data() {
    console.log(this.clip);
    return {
      position: 0 as Number,
      playing: false as boolean,
    };
  },
  computed: {
    duration() : Number {
      return this.clip.duration;
    },
    // size() : Number {
    //     // console.log(this.chunks[0]);
    //     return this.chunks.reduce((a, b) => a + b.size, 0);
    // },
    // source() : String {
    //   const blob = new Blob(this.chunks, { 'type' : 'audio/ogg; codecs=opus' });
    //   const audioURL = window.URL.createObjectURL(blob);
    //   return audioURL;
    // }
  },
  methods: {
    play() {
      
    },

    pause() {
      
    },
  },
  mounted() {
    
  },
};
</script>
