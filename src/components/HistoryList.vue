<template>
  <div class="movePanel" id="movePanel">
    <div class="moveList" id="moveList" :style="moveListStyle">
      <div class="moveListNumberColumn">
        <div
          v-for="index in (Array.from(Array(Math.max(Math.ceil(this.moves.length/2),1)).keys()))"
          :key="index"
          class="moveListNumber"
        >{{(index+1).toString()}}</div>
      </div>
      <div class="moveListMoves" id="moveListAllMoves">
        <div
          v-for="(move, index) in this.moves"
          @mouseover="hover = index"
          @mouseleave="hover = -1"
          :key="index + move.toString()"
          :class="'moveListItem ' + (index == this.store.getters.currentMoveNumber ? 'selectedMove' : index == hover ? 'mouseOverMove' : 'whiteOnGrey' )"
          v-on:click="handleHistoryMoveItemClicked($event, index)"
        >{{move.toString()}}</div>
      </div>
    </div>
  <div class="moveButtonPanel" id="moveButtonPanel">
    <button class="ghost-button" @click="stepToPreviousMove">prev</button>
    <button class="ghost-button" @click="loadGameFromClipboard">load</button>
    <button class="ghost-button" @click="stepToNextMove">next</button>
  </div>
  </div>
</template>
<script lang="ts">
import { ActionTypes, MutationTypes, useStore } from "@/store";
import { defineComponent } from "vue";
import { AmazonsEngine } from './AmazonsEngine';
import { Move } from "./Move";

const HistoryList = defineComponent({
  props: {},
  data() {
    return {
      store: useStore(),
      hover: -1,
      game: new AmazonsEngine(useStore())
    };
  },
  methods: {
    handleHistoryMoveItemClicked(ev: Event, index: number) {
      this.store.dispatch(ActionTypes.JUMP_TO_MOVE_NUMBER, index);
    },
    stepToPreviousMove() {
      this.game.backMove();
    },

    stepToNextMove() {
      this.game.nextMove();
    },

    loadGameFromClipboard() {
      navigator.clipboard.readText().then((text) => {
        this.game.playGameFromString(text);
      });
    },
  },
  computed: {
    moves(): Move[] {
      return this.store.getters.moves;
    },
    moveListStyle(): object {
      return {
        "max-height": this.store.getters.boardLength -50 + "px",
      };
    },
  },
});
export default HistoryList;
</script>