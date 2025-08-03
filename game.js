const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let bee, pipes, score, highScore = 0;
let gameOver = false;
let tutorialMode = false;
let ghostData = [];
let replayGhost = [];
let powerups = [];
let currentPower = null;
let powerTimer = 0;
let ghostMode = false;

const gravity = 0.5;
const jumpStrength = -8;
const pipeGap = 160;
const pipeWidth = 60;
const pipeSpacing = 200;
const pipeSpeed = 2.5;

let bgScroll = 0;

document.getElementById("ghostMode").addEventListener("change", (e) => {
  ghostMode = e.target.checked;
});

function startGame(tutorial) {
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("game-over").style.display = "none";
  tutorialMode = tutorial;

  bee = {
    x: 150,
    y: 300,
    velocity: 0,
    width: 40,
    height: 40,
    alive: true,
    score: 0,
    jumps: []
  };

  pipes = [];
  score = 0;
  ghostData = [];
  powerups = [];
  currentPower = null;
  powerTimer = 0;

  if (ghostMode && replayGhost.length > 0) {
    bee.ghost = JSON.parse(JSON.stringify(replayGhost));
  }

  spawnPipe();
  gameLoop();
}

function spawnPipe() {
  const topHeight = Math.random() * (canvas.height - pipeGap - 100) + 20;
  pipes.push({
    x: canvas.width,
    top: topHeight,
    bottom: topHeight + pipeGap,
    scored: false
  });
}

function applyPowerup(name) {
  currentPower = name;
  powerTimer = 300; // ~5 seconds

  if (name === "Boost") {
    bee.velocity = jumpStrength * 1.8;
  }
}

function drawBee() {
  const img = new Image();
  img.src = "assets/images/logo.png";
  ctx.drawImage(img, bee.x - bee.width / 2, bee.y - bee.height / 2, bee.width, bee.height);
}

function drawPipes() {
  ctx.fillStyle = "#6c4b23";
  pipes.forEach(pipe => {
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
    ctx.fillRect(pipe.x, pipe.bottom, pipeWidth, canvas.height - pipe.bottom);
  });
}

function drawPowerups() {
  if (currentPower) {
    ctx.fillStyle = "rgba(255,255,0,0.8)";
    ctx.font = "20px Arial";
    ctx.fillText(currentPower + "!", 20, 40);
  }
}

function drawGhost() {
  if (ghostMode && bee.ghost) {
    ctx.globalAlpha = 0.3;
    bee.ghost.forEach((pos, i) => {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = "#000";
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
}

function gameLoop() {
  if (gameOver) return;

  requestAnimationFrame(gameLoop);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#a6e1fa";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!tutorialMode) {
    bee.velocity += gravity;
    bee.y += bee.velocity;

    if (ghostMode) {
      ghostData.push({ x: bee.x, y: bee.y });
    }
  }

  drawPipes();
  drawGhost();
  drawBee();
  drawPowerups();

  pipes.forEach(pipe => {
    pipe.x -= (currentPower === "SlowMo" ? pipeSpeed / 2 : pipeSpeed);

    if (
      bee.x + bee.width / 2 > pipe.x && bee.x - bee.width / 2 < pipe.x + pipeWidth &&
      (bee.y < pipe.top || bee.y > pipe.bottom)
    ) {
      if (currentPower === "Shield") {
        currentPower = null;
      } else {
        return endGame();
      }
    }

    if (!pipe.scored && pipe.x + pipeWidth < bee.x) {
      pipe.scored = true;
      score += (currentPower === "Double" ? 2 : 1);
    }
  });

  pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);

  if (pipes[pipes.length - 1].x < canvas.width - pipeSpacing) {
    spawnPipe();
    if (Math.random() < 0.4) {
      const powerTypes = ["Shield", "SlowMo", "Double", "Boost"];
      applyPowerup(powerTypes[Math.floor(Math.random() * powerTypes.length)]);
    }
  }

  if (bee.y + bee.height / 2 > canvas.height) {
    return endGame();
  }

  if (powerTimer > 0) powerTimer--;
  if (powerTimer <= 0) currentPower = null;

  ctx.fillStyle = "#000";
  ctx.font = "28px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);
}

function flap() {
  if (tutorialMode) return;
  if (!bee.alive) return;
  bee.velocity = jumpStrength;
}

function endGame() {
  gameOver = true;
  document.getElementById("game-over").style.display = "flex";
  bee.alive = false;

  if (ghostMode) {
    replayGhost = ghostData;
  }
}

function resetGame() {
  gameOver = false;
  startGame(false);
}

document.addEventListener("keydown", e => {
  if (e.code === "Space") flap();
});
document.addEventListener("mousedown", flap);
