<template>
  <div id="app">
    <Amazons />
    <HistoryList />
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import Amazons from "./components/Amazons.vue";
import HistoryList from "./components/HistoryList.vue";

@Options({
  components: {
    Amazons,
    HistoryList,
  },
})
export default class App extends Vue {
}
</script>

<style>
@import "./assets/amazons.css";
</style>
