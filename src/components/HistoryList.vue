<template>
  <button v-for="(move, index) in this.moves" :key="index + move.toString()" :class="'moveListItem ' + (index == this.store.getters.currentMoveNumber ? 'blackOnGreen' : (index % 2 == 0 ? 'blackOnWhite' : 'whiteOnBlack'))" v-on:click="handleHistoryMoveItemClicked($event, index)">{{index +": " + move.toString()}}</button>
</template>
<script lang="ts">
import { MutationTypes, useStore } from '@/store';
import { defineComponent } from "vue";
import { Move } from './Move';
const HistoryList = defineComponent({
  props: {
  },
  data() {
    return {
      store: useStore(),
    };
  },
  methods: {
    handleHistoryMoveItemClicked(ev: Event, index: number) {
      this.store.commit(MutationTypes.SET_CURRENT_MOVE_NUMBER, index)
    },
  },
  computed: {
    moves(): Move[]{
      return this.store.getters.moves
    }
  }
  })
export default HistoryList;
</script>