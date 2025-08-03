(() => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // UI Elements
  const baseHealthDisplay = document.getElementById('base-health');
  const moneyDisplay = document.getElementById('money');
  const waveInfoDisplay = document.getElementById('wave-info');
  const towerInfoDiv = document.getElementById('tower-details');
  const upgradeButtonsDiv = document.getElementById('upgrade-buttons');
  const messageDiv = document.getElementById('message');
  const towerOptions = document.querySelectorAll('.tower-option');
  const tooltip = document.getElementById('tooltip');
  const challengePopup = document.getElementById('challenge-popup');
  const challengeText = document.getElementById('challenge-text');
  const challengeCloseBtn = document.getElementById('challenge-close-btn');

  // Game constants
  const TILE_SIZE = 50;
  const MAP_ROWS = 10;
  const MAP_COLS = 18;
  const BASE_HEALTH_START = 10;
  const INITIAL_MONEY = 100;

  // Path for enemies (simple zig-zag)
  const path = [
    { x: 0, y: 4 },
    { x: 8, y: 4 },
    { x: 8, y: 7 },
    { x: 17, y: 7 }
  ];

  // Obstacles (blocked tiles)
  const obstacles = [
    { x: 4, y: 2 },
    { x: 5, y: 2 },
    { x: 12, y: 5 },
    { x: 13, y: 5 },
    { x: 10, y: 1 },
    { x: 11, y: 1 },
  ];

  // Tower types with stats and upgrade info
  const towerTypes = {
    basic: {
      name: "Basic Tower",
      baseCost: 50,
      range: 120,
      damage: 10,
      fireRate: 1000, // ms cooldown
      upgrades: [
        { cost: 40, damage: 15, range: 140, fireRate: 900 },
        { cost: 80, damage: 20, range: 160, fireRate: 800 },
        { cost: 120, damage: 25, range: 180, fireRate: 700 }
      ]
    },
    rapid: {
      name: "Rapid Fire",
      baseCost: 80,
      range: 110,
      damage: 6,
      fireRate: 400,
      upgrades: [
        { cost: 50, damage: 8, range: 120, fireRate: 350 },
        { cost: 90, damage: 10, range: 130, fireRate: 300 },
        { cost: 130, damage: 12, range: 150, fireRate: 250 }
      ]
    },
    slow: {
      name: "Slowdown",
      baseCost: 70,
      range: 130,
      damage: 4,
      fireRate: 1500,
      upgrades: [
        { cost: 60, damage: 6, range: 140, fireRate: 1300 },
        { cost: 100, damage: 8, range: 150, fireRate: 1100 },
        { cost: 150, damage: 10, range: 160, fireRate: 1000 }
      ],
      slowEffect: 0.5,
      slowDuration: 2000
    }
  };

  // Enemy types
  const enemyTypes = {
    scout: {
      name: "Bee Scout",
      maxHealth: 30,
      speed: 1.8,
      reward: 8,
      color: "#ffdd57"
    },
    tank: {
      name: "Bee Tank",
      maxHealth: 120,
      speed: 0.8,
      reward: 20,
      color: "#b88723"
    },
    bomber: {
      name: "Bee Bomber",
      maxHealth: 50,
      speed: 1.3,
      reward: 15,
      color: "#de354c"
    },
    worker: {
      name: "Bee Worker",
      maxHealth: 70,
      speed: 1.2,
      reward: 12,
      color: "#34a853"
    }
  };

  // Challenge Modifiers, apply effects per wave
  const challengeModifiers = [
    {
      name: "Swarm Speed Up",
      description: "Enemies move 25% faster this wave!",
      apply: () => { enemySpeedMultiplier = 1.25; },
      reset: () => { enemySpeedMultiplier = 1; }
    },
    {
      name: "Tower Tax",
      description: "All tower upgrades cost 50% more this wave!",
      apply: () => { upgradeCostMultiplier = 1.5; },
      reset: () => { upgradeCostMultiplier = 1; }
    },
    {
      name: "Bumper Crop",
      description: "You earn 25% more money from kills this wave!",
      apply: () => { moneyRewardMultiplier = 1.25; },
      reset: () => { moneyRewardMultiplier = 1; }
    },
    {
      name: "Fatigue",
      description: "Base health regeneration disabled this wave!",
      apply: () => { baseRegenEnabled = false; },
      reset: () => { baseRegenEnabled = true; }
    },
    {
      name: "Stingy Bees",
      description: "Money earned reduced by 30% this wave!",
      apply: () => { moneyRewardMultiplier = 0.7; },
      reset: () => { moneyRewardMultiplier = 1; }
    },
    {
      name: "Double Trouble",
      description: "Twice as many enemies spawn this wave!",
      apply: () => { enemyCountMultiplier = 2; },
      reset: () => { enemyCountMultiplier = 1; }
    },
    {
      name: "Berserker Buzz",
      description: "Enemies have 30% more health this wave!",
      apply: () => { enemyHealthMultiplier = 1.3; },
      reset: () => { enemyHealthMultiplier = 1; }
    },
    {
      name: "Fragile Hive",
      description: "Base health starts 2 lower this wave!",
      apply: () => { baseHealthModifier = -2; },
      reset: () => { baseHealthModifier = 0; }
    }
  ];

  // Game state
  let baseHealth = BASE_HEALTH_START;
  let baseHealthModifier = 0; // for challenges
  let money = INITIAL_MONEY;
  let waveNumber = 0;
  let enemies = [];
  let towers = [];
  let projectiles = [];
  let selectedTowerType = null;
  let selectedTower = null;
  let placingTower = false;
  let gameOver = false;
  let lastEnemySpawn = 0;
  let enemiesToSpawn = 0;
  let enemySpawnInterval = 1000;
  let lastFrameTime = 0;
  let currentChallenge = null;

  // Multipliers for challenges
  let enemySpeedMultiplier = 1;
  let upgradeCostMultiplier = 1;
  let moneyRewardMultiplier = 1;
  let enemyCountMultiplier = 1;
  let enemyHealthMultiplier = 1;
  let baseRegenEnabled = true;

  // Tower placement grid, to check for blocking
  let towerGrid = new Array(MAP_ROWS).fill(null).map(() => new Array(MAP_COLS).fill(false));

  // Helper functions
  function pointDistance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  // Tooltip handling for tower options
  towerOptions.forEach(option => {
    option.addEventListener('mouseenter', e => {
      const type = e.currentTarget.dataset.type;
      const ttText = generateTowerTooltip(type);
      tooltip.textContent = ttText;
      const rect = e.currentTarget.getBoundingClientRect();
      tooltip.style.left = rect.left + rect.width/2 + 'px';
      tooltip.style.top = rect.top - 35 + 'px';
      tooltip.style.opacity = '1';
    });
    option.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });

    option.addEventListener('click', e => {
      if(gameOver) return;
      towerOptions.forEach(opt => opt.classList.remove('selected'));
      e.currentTarget.classList.add('selected');
      selectedTowerType = e.currentTarget.dataset.type;
      selectedTower = null;
      updateTowerInfo(null);
      placingTower = true;
      messageDiv.textContent = "Click on the map to place your " + towerTypes[selectedTowerType].name;
    });
  });

  function generateTowerTooltip(type) {
    const t = towerTypes[type];
    return `${t.name}\nDamage: ${t.damage}\nRange: ${t.range}\nFire Rate: ${(t.fireRate/1000).toFixed(2)}s\nCost: $${t.baseCost}`;
  }

  // Tower info UI update
  function updateTowerInfo(tower) {
    if(!tower) {
      towerInfoDiv.textContent = 'Select a tower to see details';
      upgradeButtonsDiv.innerHTML = '';
      return;
    }
    const typeData = towerTypes[tower.type];
    let html = `
      <p><strong>${typeData.name}</strong> (Level ${tower.level + 1})</p>
      <p>Damage: ${tower.damage}</p>
      <p>Range: ${tower.range}</p>
      <p>Fire Rate: ${(tower.fireRate/1000).toFixed(2)}s</p>
    `;
    upgradeButtonsDiv.innerHTML = '';
    const nextUpgrade = typeData.upgrades[tower.level];
    if(nextUpgrade) {
      const btn = document.createElement('button');
      btn.className = 'upgrade-btn';
      // Upgrade cost multiplied by challenge modifier
      const cost = Math.ceil(nextUpgrade.cost * upgradeCostMultiplier);
      btn.textContent = `Upgrade ($${cost})`;
      btn.disabled = money < cost;
      btn.onclick = () => {
        if(money >= cost) {
          money -= cost;
          tower.level++;
          tower.damage = nextUpgrade.damage;
          tower.range = nextUpgrade.range;
          tower.fireRate = nextUpgrade.fireRate;
          updateTowerInfo(tower);
          messageDiv.textContent = `${typeData.name} upgraded!`;
          updateUI();
        } else {
          messageDiv.textContent = 'Not enough money to upgrade!';
        }
      };
      upgradeButtonsDiv.appendChild(btn);
    } else {
      upgradeButtonsDiv.textContent = 'Max level reached.';
    }
    towerInfoDiv.innerHTML = html;
  }

  // Check if tower can be placed on given tile (not obstacle, no tower, not path)
  function canPlaceTower(col, row) {
    if(col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return false;
    if(towerGrid[row][col]) return false;
    for(const ob of obstacles) {
      if(ob.x === col && ob.y === row) return false;
    }
    // Check if tile is on path
    for(const p of path) {
      if(p.x === col && p.y === row) return false;
    }
    return true;
  }

  // Tower class
  class Tower {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      this.type = type;
      const data = towerTypes[type];
      this.damage = data.damage;
      this.range = data.range;
      this.fireRate = data.fireRate;
      this.level = 0;
      this.lastShot = 0;
      this.slowEffect = data.slowEffect || 0;
      this.slowDuration = data.slowDuration || 0;
    }
  }

  // Enemy class
  class Enemy {
    constructor(type) {
      this.type = type;
      const data = enemyTypes[type];
      this.maxHealth = data.maxHealth * enemyHealthMultiplier;
      this.health = this.maxHealth;
      this.speed = data.speed * enemySpeedMultiplier;
      this.reward = Math.floor(data.reward * moneyRewardMultiplier);
      this.color = data.color;
      this.x = path[0].x * TILE_SIZE + TILE_SIZE/2;
      this.y = path[0].y * TILE_SIZE + TILE_SIZE/2;
      this.currentPathIndex = 0;
      this.slowedUntil = 0;
    }

    update(dt, currentTime) {
      if(this.health <= 0) return false;

      // Apply slow effect
      let currentSpeed = this.speed;
      if(currentTime < this.slowedUntil) {
        currentSpeed *= 0.5;
      }

      const targetIndex = this.currentPathIndex + 1;
      if(targetIndex >= path.length) return true; // reached base

      const targetX = path[targetIndex].x * TILE_SIZE + TILE_SIZE/2;
      const targetY = path[targetIndex].y * TILE_SIZE + TILE_SIZE/2;
      const dx = targetX - this.x;
      const dy = targetY - this.y;
      const dist = Math.hypot(dx, dy);
      if(dist < currentSpeed * dt) {
        this.x = targetX;
        this.y = targetY;
        this.currentPathIndex++;
        if(this.currentPathIndex >= path.length - 1) {
          return true; // reached base
        }
      } else {
        this.x += (dx / dist) * currentSpeed * dt;
        this.y += (dy / dist) * currentSpeed * dt;
      }
      return false;
    }

    draw(ctx) {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, 16, 12, 0, 0, Math.PI*2);
      ctx.fill();

      // Health bar
      const healthBarWidth = 30;
      const healthBarHeight = 5;
      const healthPercent = this.health / this.maxHealth;
      ctx.fillStyle = 'black';
      ctx.fillRect(this.x - healthBarWidth/2, this.y - 22, healthBarWidth, healthBarHeight);
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(this.x - healthBarWidth/2, this.y - 22, healthBarWidth * healthPercent, healthBarHeight);
    }
  }

  // Projectile class
  class Projectile {
    constructor(x, y, target, damage, slowEffect = 0, slowDuration = 0) {
      this.x = x;
      this.y = y;
      this.target = target;
      this.speed = 400;
      this.damage = damage;
      this.radius = 5;
      this.slowEffect = slowEffect;
      this.slowDuration = slowDuration;
      this.active = true;
    }

    update(dt) {
      if(!this.active || !this.target) return false;

      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.hypot(dx, dy);
      if(dist < this.speed * dt) {
        // Hit target
        this.target.health -= this.damage;
        if(this.slowEffect > 0) {
          this.target.slowedUntil = Date.now() + this.slowDuration;
        }
        this.active = false;
        return true;
      } else {
        this.x += (dx / dist) * this.speed * dt;
        this.y += (dy / dist) * this.speed * dt;
        return false;
      }
    }

    draw(ctx) {
      if(!this.active) return;
      ctx.fillStyle = this.slowEffect > 0 ? '#3498db' : '#f1c40f';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw grid, obstacles, path
  function drawMap() {
    // Grid
    ctx.strokeStyle = '#b0d6a5';
    for(let r=0; r<MAP_ROWS; r++) {
      for(let c=0; c<MAP_COLS; c++) {
        ctx.strokeRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    // Obstacles
    obstacles.forEach(o => {
      ctx.fillStyle = '#7c6651';
      ctx.fillRect(o.x * TILE_SIZE, o.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    });

    // Path
    ctx.strokeStyle = '#f9d71c';
    ctx.lineWidth = 8;
    ctx.beginPath();
    for(let i=0; i<path.length; i++) {
      const p = path[i];
      const px = p.x * TILE_SIZE + TILE_SIZE/2;
      const py = p.y * TILE_SIZE + TILE_SIZE/2;
      if(i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  // Draw towers
  function drawTowers() {
    towers.forEach(t => {
      // Tower base
      ctx.fillStyle = '#3a5b35';
      ctx.beginPath();
      ctx.arc(t.x, t.y, 20, 0, Math.PI * 2);
      ctx.fill();

      // Tower range circle (light green, transparent)
      ctx.fillStyle = 'rgba(58, 91, 53, 0.15)';
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
      ctx.fill();

      // Tower center detail - bee icon style circle
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(t.x, t.y, 10, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Draw projectiles
  function drawProjectiles() {
    projectiles.forEach(p => p.draw(ctx));
  }

  // Draw enemies
  function drawEnemies() {
    enemies.forEach(e => e.draw(ctx));
  }

  // Update UI
  function updateUI() {
    baseHealthDisplay.textContent = `Base Health: ${baseHealth + baseHealthModifier}`;
    moneyDisplay.textContent = `Money: ${money}`;
    waveInfoDisplay.textContent = `Wave: ${waveNumber}`;
  }

  // Game Over display
  function displayGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#e74c3c';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', width/2, height/2);
    ctx.font = '24px Arial';
    ctx.fillText('Refresh to play again', width/2, height/2 + 40);
  }

  // Spawn wave enemies count and type
  function spawnWave() {
    waveNumber++;
    messageDiv.textContent = `Starting wave ${waveNumber}...`;

    // Reset multipliers and apply challenge modifier for this wave
    resetModifiers();
    currentChallenge = challengeModifiers[Math.floor(Math.random() * challengeModifiers.length)];
    currentChallenge.apply();

    showChallengePopup(currentChallenge);

    // Calculate enemies to spawn
    enemiesToSpawn = Math.floor(5 + waveNumber * 2 * enemyCountMultiplier);

    // Spawn enemies of random types weighted by wave number
    // (Simple: increase tougher enemies chance over time)
    // We'll spawn mostly scout early waves, then more tanks/bombers/workers later

    // Reset path, towers etc? No, keep as is.
  }

  // Show challenge popup
  function showChallengePopup(challenge) {
    challengeText.textContent = challenge.description;
    challengePopup.style.display = 'block';
  }
  challengeCloseBtn.addEventListener('click', () => {
    challengePopup.style.display = 'none';
    // Apply base health modifier after popup closed
    baseHealth += baseHealthModifier;
    updateUI();
  });

  // Reset multipliers before next wave
  function resetModifiers() {
    if(currentChallenge) currentChallenge.reset();
    enemySpeedMultiplier = 1;
    upgradeCostMultiplier = 1;
    moneyRewardMultiplier = 1;
    enemyCountMultiplier = 1;
    enemyHealthMultiplier = 1;
    baseHealthModifier = 0;
    baseRegenEnabled = true;
  }

  // Get random enemy type based on wave
  function getRandomEnemyType() {
    // Weighted by wave to introduce tougher enemies
    const rand = Math.random();
    if(waveNumber < 3) return 'scout';
    if(waveNumber < 6) {
      if(rand < 0.6) return 'scout';
      if(rand < 0.85) return 'worker';
      return 'bomber';
    }
    // wave 6+
    if(rand < 0.4) return 'scout';
    if(rand < 0.7) return 'worker';
    if(rand < 0.85) return 'bomber';
    return 'tank';
  }

  // Main update loop
  function update(time = 0) {
    if(!lastFrameTime) lastFrameTime = time;
    const dt = (time - lastFrameTime) / 1000;
    lastFrameTime = time;
    if(gameOver) {
      displayGameOver();
      return;
    }

    ctx.clearRect(0, 0, width, height);
    drawMap();

    // Spawn enemies
    if(enemiesToSpawn > 0 && time - lastEnemySpawn > enemySpawnInterval) {
      const enemyType = getRandomEnemyType();
      enemies.push(new Enemy(enemyType));
      enemiesToSpawn--;
      lastEnemySpawn = time;
    }

    // Update enemies
    for(let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      const reachedBase = enemy.update(dt, time);
      if(enemy.health <= 0) {
        money += enemy.reward;
        messageDiv.textContent = `Killed ${enemyTypes[enemy.type].name}, +$${enemy.reward}`;
        enemies.splice(i, 1);
        updateUI();
        continue;
      }
      if(reachedBase) {
        baseHealth--;
        enemies.splice(i, 1);
        updateUI();
        messageDiv.textContent = `An enemy reached your base! -1 health`;
        if(baseHealth <= 0) {
          gameOver = true;
          messageDiv.textContent = 'Game Over!';
        }
      }
    }

    // Base health regeneration if enabled (small regen per second)
    if(baseRegenEnabled && baseHealth < BASE_HEALTH_START + baseHealthModifier) {
      baseHealth += 0.01;
      if(baseHealth > BASE_HEALTH_START + baseHealthModifier) baseHealth = BASE_HEALTH_START + baseHealthModifier;
      updateUI();
    }

    // Update towers (target and shoot)
    towers.forEach(tower => {
      if(time - tower.lastShot > tower.fireRate) {
        // Find target in range
        let target = null;
        let closestDist = 9999;
        for(let enemy of enemies) {
          const dist = pointDistance(tower.x, tower.y, enemy.x, enemy.y);
          if(dist <= tower.range && dist < closestDist) {
            closestDist = dist;
            target = enemy;
          }
        }
        if(target) {
          projectiles.push(new Projectile(tower.x, tower.y, target, tower.damage, tower.slowEffect, tower.slowDuration));
          tower.lastShot = time;
        }
      }
    });

    // Update projectiles
    for(let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      const hit = p.update(dt);
      if(!p.active) {
        projectiles.splice(i, 1);
      }
    }

    drawTowers();
    drawEnemies();
    drawProjectiles();

    requestAnimationFrame(update);
  }

  // Handle mouse clicks on canvas to place/select towers
  canvas.addEventListener('click', (e) => {
    if(gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const col = Math.floor(mouseX / TILE_SIZE);
    const row = Math.floor(mouseY / TILE_SIZE);

    if(placingTower && selectedTowerType) {
      if(canPlaceTower(col, row)) {
        // Place tower centered in tile
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;

        // Check cost
        const cost = towerTypes[selectedTowerType].baseCost;
        if(money >= cost) {
          money -= cost;
          const newTower = new Tower(x, y, selectedTowerType);
          towers.push(newTower);
          towerGrid[row][col] = true;
          messageDiv.textContent = `${towerTypes[selectedTowerType].name} placed!`;
          updateUI();
          placingTower = false;
          selectedTowerType = null;
          towerOptions.forEach(opt => opt.classList.remove('selected'));
          updateTowerInfo(null);
        } else {
          messageDiv.textContent = 'Not enough money to place tower!';
        }
      } else {
        messageDiv.textContent = 'Cannot place tower here!';
      }
    } else {
      // Select tower if clicked on one
      let foundTower = null;
      for(let t of towers) {
        const dist = Math.hypot(mouseX - t.x, mouseY - t.y);
        if(dist < 20) {
          foundTower = t;
          break;
        }
      }
      if(foundTower) {
        selectedTower = foundTower;
        updateTowerInfo(foundTower);
        messageDiv.textContent = `${towerTypes[foundTower.type].name} selected. Upgrade or place new towers.`;
      } else {
        selectedTower = null;
        updateTowerInfo(null);
        messageDiv.textContent = '';
      }
    }
  });

  // Wave progression: new wave starts automatically after all enemies dead
  function checkWaveProgress() {
    if(!gameOver && enemies.length === 0 && enemiesToSpawn === 0 && challengePopup.style.display === 'none') {
      messageDiv.textContent = `Wave ${waveNumber} complete! Next wave in 3 seconds.`;
      setTimeout(() => {
        if(!gameOver) {
          spawnWave();
        }
      }, 3000);
    }
  }
  setInterval(checkWaveProgress, 1000);

  // Start first wave and initialize UI
  function startGame() {
    baseHealth = BASE_HEALTH_START;
    money = INITIAL_MONEY;
    waveNumber = 0;
    enemies = [];
    towers = [];
    projectiles = [];
    gameOver = false;
    towerGrid = new Array(MAP_ROWS).fill(null).map(() => new Array(MAP_COLS).fill(false));
    selectedTowerType = null;
    selectedTower = null;
    placingTower = false;
    messageDiv.textContent = 'Select a tower to place.';
    updateUI();
    spawnWave();
    requestAnimationFrame(update);
  }

  startGame();
})();
