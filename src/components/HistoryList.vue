<template>
<a v-for="move in moveHistory" v-bind:key="move.id">{{move.toString}} </a>
</template>
<script>
import { defineComponent } from "vue";
const HistoryList = defineComponent({
  props: {
  }})
export default HistoryList;
</script>