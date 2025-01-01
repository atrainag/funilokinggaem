const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// Game State
let gameState = {
  paddles: { left: 50, right: 50 }, // Paddle positions as percentages of canvas height
  ball: { x: 50, y: 50, dx: 0.5, dy: 0.5 }, // Ball position and direction
  score: { left: 0, right: 0 }
};

let roles = {
  host: null,
  controllers: []
};
let readyStatus = { left: false, right: false };

// Handle connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle role selection
  socket.on('selectRole', (role) => {
    if (role === 'host' && !roles.host) {
      roles.host = socket.id;
      socket.emit('roleAssigned', 'host');
    } else if (role === 'controller' && roles.controllers.length < 2) {
      const side = roles.controllers.length === 0 ? 'left' : 'right';
      roles.controllers.push({ id: socket.id, side });
      socket.emit('roleAssigned', `controller:${side}`);
    } else {
      socket.emit('roleDenied', 'Role unavailable');
    }
  });

  // Handle ready status
  socket.on('ready', (side) => {
    readyStatus[side] = true;

    // Check if both controllers are ready
    if (readyStatus.left && readyStatus.right) {
      io.emit('gameStart');
    }
  });

  // Handle paddle movement
  socket.on('controllerInput', (data) => {
    const paddleSpeed = 5; // Percentage of canvas height
    if (data.side === 'left') {
      gameState.paddles.left = Math.max(
        0,
        Math.min(100, gameState.paddles.left + data.movement * paddleSpeed)
      );
    }
    if (data.side === 'right') {
      gameState.paddles.right = Math.max(
        0,
        Math.min(100, gameState.paddles.right + data.movement * paddleSpeed)
      );
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    if (roles.host === socket.id) roles.host = null;
    roles.controllers = roles.controllers.filter((c) => c.id !== socket.id);
  });
});

// Game update loop
setInterval(() => {
  updateGameState();
  if (roles.host) io.to(roles.host).emit('updateGameState', gameState);
}, 16); // Approx. 60fps

function updateGameState() {
  // Update ball position
  gameState.ball.x += gameState.ball.dx;
  gameState.ball.y += gameState.ball.dy;

  // Ball collision with top and bottom walls
  if (gameState.ball.y <= 0 || gameState.ball.y >= 100) {
    gameState.ball.dy *= -1; // Reverse vertical direction
  }

  // Ball collision with paddles
  const paddleWidth = 5; // Approximate paddle width in canvas percentage
  const paddleHeight = 20; // Approximate paddle height in canvas percentage
  if (
    gameState.ball.x <= paddleWidth &&
    gameState.ball.y >= gameState.paddles.left &&
    gameState.ball.y <= gameState.paddles.left + paddleHeight
  ) {
    gameState.ball.dx *= -1; // Reverse horizontal direction
  }
  if (
    gameState.ball.x >= 100 - paddleWidth &&
    gameState.ball.y >= gameState.paddles.right &&
    gameState.ball.y <= gameState.paddles.right + paddleHeight
  ) {
    gameState.ball.dx *= -1; // Reverse horizontal direction
  }

  // Ball misses a paddle
  if (gameState.ball.x < 0) {
    gameState.score.right += 1;
    resetBall();
  }
  if (gameState.ball.x > 100) {
    gameState.score.left += 1;
    resetBall();
  }
}

function resetBall() {
  gameState.ball = { x: 50, y: 50, dx: Math.random() > 0.5 ? 0.5 : -0.5, dy: 0.5 };
}

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
