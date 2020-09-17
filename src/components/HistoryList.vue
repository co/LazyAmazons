<template>
  <div class="moveList">
    <div class="moveListNumberColumn">
      <div
        v-for="index in (Array.from(Array(Math.max(Math.ceil(this.moves.length/2),1)).keys()))"
        :key="index"
        class="moveListNumber"
      >{{(index+1).toString()}}</div>
    </div>
    <div class="moveListMoves">
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
</template>
<script lang="ts">
import { ActionTypes, MutationTypes, useStore } from "@/store";
import { defineComponent } from "vue";
import { Move } from "./Move";
const HistoryList = defineComponent({
  props: {},
  data() {
    return {
      store: useStore(),
      hover: -1
    };
  },
  methods: {
    handleHistoryMoveItemClicked(ev: Event, index: number) {
      this.store.dispatch(ActionTypes.JUMP_TO_MOVE_NUMBER, index);
    },
  },
  computed: {
    moves(): Move[] {
      return this.store.getters.moves;
    },
  },
});
export default HistoryList;
</script>