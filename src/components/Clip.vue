<template>
  <div class="clip-row">
    <template 
      v-for="i in [0, 1]"
      :key="i"
    >
      <div class="clip-block" v-if="i == 1 || doubled" :class="'part' + i">
        <input class="volume" type="range" v-model="clip.volume" max="100" min="0" :disabled="clip.muted">
        <button class="mute" @click="clip.toggleMuted">
          {{ clip.muted ? '🔈' : '🔊' }}
        </button>
        <button class="delete" @click="$emit('deleted', clip)">
          ❌
        </button>
      </div>
    </template>
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
      playing: false as boolean,
    };
  },
  computed: {
    duration() : number {
      return this.clip.duration;
    },

    left() : string {
      return (this.clip.offset / this.clip.timer.loopDuration * 100) + '%';
    },

    leftDouble() : string {
      return (this.clip.offset / this.clip.timer.loopDuration * 100 - 100) + '%';
    },

    width() : string {
      return ((this.clip.duration) / this.clip.timer.loopDuration * 100) + '%';
    },

    background() {
      return this.playing ? '#ccc' : '#ddd';
    },

    doubled() {
      console.log(this.clip.end > this.clip.loopDuration, this.clip.offset);
      return this.clip.end > this.clip.loopDuration;
    }

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
    this.clip.onPlayingChanged.add(
      (playing: boolean) => this.playing = playing
    );
  },
};
</script>

<style scoped>
.clip-row {
  position: relative;
  width: 100%;
  padding-top: 3px;
  padding-bottom: 3px;
  overflow-x: hidden;
  height: 40px;
}


.clip-block {
  position: absolute;
  left: calc(v-bind(left) + 3px);
  width: calc(v-bind(width) - 6px);
  height: 40px;
  border: 1px solid black;
  border-radius: 4px;
  background-color: v-bind(background);
  vertical-align: middle;
  text-align: center;
  /* display: inline-block; */
  display: flex;
  align-items: center;
}

.part0.clip-block {
  left: calc(v-bind(leftDouble) + 3px);
  float: left;
}

.mute {
  width: 60px;
}

.volume {
  width: 100px;
  margin-right: 10px;
}

</style>
