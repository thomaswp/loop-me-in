<template>
  <button class="button" @click="togglePlayMode">{{ playModeName }}</button>
</template>

<script lang="ts">

import { PlayMode } from '../audio/AudioClip'

export default {
  name: "PlayModeButton",
  props: {
    playMode: Number as () => PlayMode,
  },
  data() {
      return {};
  },
  computed: {
    playModeName() : string {
      // console.log(PlayMode, this.playMode, PlayMode[this.playMode]);
      if (this.playMode == PlayMode.Echo) {
        return '1️⃣';
      } else if (this.playMode == PlayMode.Always) {
        return '🔁';
      } else if (this.playMode == PlayMode.EveryOther) {
        return '½';
      } else if (this.playMode == PlayMode.Once) {
        return '🎤';
      }
      return PlayMode[this.playMode];
    },
  },
  methods: {
    togglePlayMode() {
      const length = Object.keys(PlayMode).length / 2;
      const next = (this.playMode + 1) % length as PlayMode;
      // console.log(this.playMode, next);
      this.$emit('playModeChanged', next);
    },
  },
  mounted() {
  },
};
</script>
<style scoped>
.button {
  min-width: 40px;
}
</style>
