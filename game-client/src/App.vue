<template>
  <div>
    <div v-if="!role">
      <h2>Select Role</h2>
      <button @click="selectRole('host')">Host</button>
      <button @click="selectRole('controller')">Controller</button>
    </div>

    <div v-else-if="role === 'host'">
      <h2>Game Host Screen</h2>
      <h3>Score: {{ gameState?.score.left }} - {{ gameState?.score.right }}</h3>
      <canvas ref="gameCanvas" width="800" height="400" style="border: 1px solid black;"></canvas>
    </div>

    <div v-else-if="role.startsWith('controller')">
      <div v-if="!ready">
        <h2>You are the {{ role.split(':')[1] }} paddle</h2>
        <button @click="setReady">Ready</button>
      </div>
      <div v-else>
        <h2>Game Started!</h2>
        <button @click="movePaddle(-1)">Up</button>
        <button @click="movePaddle(1)">Down</button>
      </div>
    </div>
  </div>
</template>

<script>
import io from 'socket.io-client';

export default {
  data() {
    return {
      socket: null,
      role: null,
      ready: false,
      gameState: null
    };
  },
  mounted() {
    this.socket = io('http://localhost:3000');

    // Handle role assignment
    this.socket.on('roleAssigned', (role) => {
      this.role = role;

      if (role === 'host') {
        this.socket.on('updateGameState', (state) => {
          this.gameState = state;
          this.drawGame();
        });
      }
    });

    // Handle game start
    this.socket.on('gameStart', () => {
      this.ready = true;
    });
  },
  methods: {
    selectRole(role) {
      this.socket.emit('selectRole', role);
    },
    setReady() {
      const side = this.role.split(':')[1];
      this.socket.emit('ready', side);
    },
    movePaddle(direction) {
      const side = this.role.split(':')[1];
      this.socket.emit('controllerInput', { side, movement: direction });
    },
drawGame() {

    const canvas = this.$refs.gameCanvas;
    const ctx = canvas.getContext('2d');

    // Check if the canvas is initialized
    if (!canvas || !ctx) {
      console.error('Canvas is not initialized or unavailable.');
      return;
    }

    // Clear the canvas completely
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set a white background explicitly
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw paddles
    ctx.fillStyle = 'blue';
    const paddleHeight = 80; // Height of paddles in pixels
    const paddleWidth = 10; // Width of paddles in pixels
    ctx.fillRect(50, this.gameState.paddles.left * 4, paddleWidth, paddleHeight); // Left paddle
    ctx.fillRect(740, this.gameState.paddles.right * 4, paddleWidth, paddleHeight); // Right paddle

    // Draw ball
    ctx.fillStyle = 'red';
    const ballRadius = 10; // Radius of the ball
    ctx.beginPath();
    ctx.arc(this.gameState.ball.x * 8, this.gameState.ball.y * 4, ballRadius, 0, Math.PI * 2);
    ctx.fill();
}
  }
};
</script>

