<template>
  <div class="clip-row">
    <template 
      v-for="i in [0, 1]"
      :key="i"
    >
      <div class="clip-block" v-if="i == 1 || doubled" :class="'part' + i">
        <div :class="clip.filteredData ? 'viz' : 'viz hidden'">
          <!-- <div class="blip hidden" />
          <div class="blip"
            v-for="i in 70"
            :key="i"
            :style="'height: ' + (clip.filteredData[i] * 100) + '%'"
          >
          </div> -->
          <canvas class="viz-canvas" ref="canvas" />
        </div>
        <div class="ui" v-if="clip.loaded">
          <input class="volume" type="range" v-model="clip.volume" max="100" min="0" :disabled="clip.muted">
          <button class="mute" @click="clip.toggleMuted">
            {{ clip.muted ? '🔈' : '🔊' }}
          </button>
          <button class="delete" @click="$emit('deleted', clip)">
            ❌
          </button>
        </div>
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
      return (this.clip.offset / this.clip.partDuration * 100) + '%';
    },

    leftDouble() : string {
      return (this.clip.offset / this.clip.partDuration * 100 - 100) + '%';
    },

    width() : string {
      return ((this.clip.duration) / this.clip.partDuration * 100) + '%';
    },

    background() {
      return this.playing ? '#efc94d' : '#444';
    },

    doubled() {
      // console.log(this.clip.end > this.clip.partDuration, this.clip.offset);
      return this.clip.end > this.clip.partDuration;
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

    /**
     * A utility function for drawing our line segments
     * @param {CanvasRenderingContext2D} ctx the audio context 
     * @param {number} x  the x coordinate of the beginning of the line segment
     * @param {number} height the desired height of the line segment
     * @param {number} width the desired width of the line segment
     * @param {boolean} isEven whether or not the segmented is even-numbered
     */
    drawLineSegment(ctx: CanvasRenderingContext2D, x: number, height: number, width: number, isEven: boolean) {
      ctx.lineWidth = 2; // how thick the line is
      ctx.strokeStyle = "#fff"; // what color our line is
      ctx.beginPath();
      height = isEven ? height : -height;
      ctx.moveTo(x, 0);
      if (Math.abs(height) > width / 2) {
        ctx.lineTo(x, height);
        ctx.arc(x + width / 2, height, width / 2, Math.PI, 0, isEven);
        ctx.lineTo(x + width, 0);
      } else {
        ctx.lineTo(x + width + 0.5, 0);
      }
      ctx.stroke();
    },

    renderCanvas(canvas: HTMLCanvasElement) {
      // console.log(arguments);
      const normalizedData = this.clip.filteredData;
      const dpr = window.devicePixelRatio || 1;
      const padding = 4;
      // console.log(canvas, canvas.offsetWidth, canvas.offsetHeight);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = (canvas.offsetHeight + padding * 2) * dpr;
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      ctx.translate(0, canvas.offsetHeight / 2 + padding); // set Y = 0 to be in the middle of the canvas

      // draw the line segments
      const width = canvas.offsetWidth / normalizedData.length;
      for (let i = 0; i < normalizedData.length; i++) {
        const x = width * i;
        let height = Math.abs(normalizedData[i]) * (canvas.offsetHeight - padding);
        // console.log(height, normalizedData[i]);
        if (height < 0) {
            height = 0;
        } else if (height > canvas.offsetHeight / 2) {
            height = canvas.offsetHeight / 2;
        }
        this.drawLineSegment(ctx, x, height, width, (i + 1) % 2);
      }
    },
  },
  mounted() {
    this.clip.onPlayingChanged.add(
      (playing: boolean) => this.playing = playing
    );
    const canvas = this.$refs['canvas'][0] as HTMLCanvasElement;
    if (this.clip.filteredData) {
      this.renderCanvas(canvas);
    } else {
      this.clip.onDataFiltered.add(() => {
        this.renderCanvas(canvas);
        this.$forceUpdate()
      });
    }
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
  transition: background-color 0.5s;
  opacity: 0.95;
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

.viz {
  position: absolute;
  left: 5px;
  right: 5px;
  top: 5px;
  bottom: 5px;
  /* background: #eee; */
  text-align: left;
  vertical-align: bottom;
}

.blip {
  position: static;
  /* height: 100%; */
  width: 2px;
  margin: 1px;
  background-color: #666;
  display: inline-block;
}

.blip.hidden {
  height: 90%;
  background: none;
}

.ui {
  z-index: 1;
  /* opacity: 0.95; */
  background-color: rgba(240, 240, 240, 0.85);
  padding: 5px;
  border-radius: 3px;
  /* margin-left: auto;
  margin-right: auto; */
  margin-left: 8px;
}

.viz-canvas {
  width: 100%;
  height: 100%;
}

.hidden {
  /* display: none; */
}

</style>
