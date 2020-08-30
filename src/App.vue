<template>
  <div id="app">
    <Amazons :size="size" />
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
  get size() {
    return 20;
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
*{background: #2e2f35;}
</style>
