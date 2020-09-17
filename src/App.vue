<template>
  <div id="app">
    <Amazons />
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import Amazons from "./components/Amazons.vue";

@Options({
  components: {
    Amazons,
  },
})
export default class App extends Vue {
}
</script>

<style>
@import "./assets/amazons.css";
</style>
