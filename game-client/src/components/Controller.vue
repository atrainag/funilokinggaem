<template>
  <div>
    <button @click="movePaddle(-10)">Up</button>
    <button @click="movePaddle(10)">Down</button>
  </div>
</template>

<script>
import io from 'socket.io-client';

export default {
  data() {
    return {
      socket: null
    };
  },
  mounted() {
    this.socket = io('http://localhost:3000');
  },
  methods: {
    movePaddle(direction) {
      this.socket.emit('controllerInput', { side: 'left', movement: direction });
    }
  }
};
</script>
