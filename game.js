// game.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const moneyDisplay = document.getElementById('money-display');
const waveDisplay = document.getElementById('wave-display');
const towerInfo = document.getElementById('tower-info');
const towerName = document.getElementById('tower-name');
const towerIcon = document.getElementById('tower-icon');
const towerDesc = document.getElementById('tower-desc');
const upgradeBtn = document.getElementById('upgrade-btn');
const upgradeCostDisplay = document.getElementById('upgrade-cost');
const messagePopup = document.getElementById('message-popup');

// New modifiers container
const gameContainer = document.getElementById('game-container');
const modifiersPanel = document.createElement('div');
modifiersPanel.style.position = 'absolute';
modifiersPanel.style.bottom = '10px';
modifiersPanel.style.right = '10px';
modifiersPanel.style.background = 'rgba(255 255 255 / 0.9)';
modifiersPanel.style.padding = '10px 14px';
modifiersPanel.style.borderRadius = '12px';
modifiersPanel.style.color = '#4a3e1d';
modifiersPanel.style.fontWeight = '700';
modifiersPanel.style.maxWidth = '250px';
modifiersPanel.style.fontSize = '14px';
modifiersPanel.style.boxShadow = 'inset 0 0 10px #c9a200cc';
modifiersPanel.style.userSelect = 'none';
modifiersPanel.style.zIndex = '30';
gameContainer.appendChild(modifiersPanel);

let money = 100;
let wave = 0;
let enemies = [];
let towers = [];
let projectiles = [];
let selectedTower = null;
let path = [
  // Path points (simple path)
  { x: 50, y: 550 },
  { x: 50, y: 300 },
  { x: 200, y: 300 },
  { x: 200, y: 150 },
  { x: 400, y: 150 },
  { x: 400, y: 450 },
  { x: 700, y: 450 },
  { x: 850, y: 300 },
  { x: 850, y: 100 },
];
const TILE_SIZE = 40;

// Challenge Modifiers data
const challengeModifiers = [
  {
    name: "Swarm Rush",
    description: "Enemies spawn 50% faster",
    apply: () => { modifiers.spawnSpeedMultiplier *= 0.66; },
  },
  {
    name: "Iron Hide",
    description: "Enemies have 30% more HP",
    apply: () => { modifiers.enemyHpMultiplier *= 1.3; },
  },
  {
    name: "Bee Venom",
    description: "Enemies deal double damage to towers",
    apply: () => { modifiers.enemyDamageMultiplier *= 2; },
  },
  {
    name: "Honey Sludge",
    description: "Towers shoot 20% slower",
    apply: () => { modifiers.towerFireRateMultiplier *= 1.2; },
  },
  {
    name: "Stingy Bees",
    description: "Money gained reduced by 30%",
    apply: () => { modifiers.moneyGainMultiplier *= 0.7; },
  },
];

let modifiers = {
  spawnSpeedMultiplier: 1,
  enemyHpMultiplier: 1,
  enemyDamageMultiplier: 1,
  towerFireRateMultiplier: 1,
  moneyGainMultiplier: 1,
  activeModifiers: [],
};

let lastSpawnTime = 0;
let spawnInterval = 1500; // base spawn interval ms

let enemiesPerWave = 10;
let enemiesSpawnedThisWave = 0;
let enemiesKilledThisWave = 0;

let messageTimeout = null;

// Tower types definition
const TOWER_TYPES = {
  basic: {
    name: "Basic Bee Shooter",
    desc: "Shoots slow but steady honey blobs.",
    icon: "assets/images/tower_basic.png",
    cost: 50,
    baseDamage: 10,
    baseRange: 120,
    baseFireRate: 1000, // ms between shots
    upgradeCost: 40,
    upgradeDamageMultiplier: 1.3,
    upgradeRangeMultiplier: 1.1,
    upgradeFireRateMultiplier: 0.9,
    maxLevel: 5,
  },
  rapid: {
    name: "Rapid Stinger",
    desc: "Fast firing but weaker shots.",
    icon: "assets/images/tower_rapid.png",
    cost: 70,
    baseDamage: 6,
    baseRange: 110,
    baseFireRate: 400,
    upgradeCost: 55,
    upgradeDamageMultiplier: 1.15,
    upgradeRangeMultiplier: 1.05,
    upgradeFireRateMultiplier: 0.85,
    maxLevel: 5,
  },
  splash: {
    name: "Honey Splash",
    desc: "Shoots honey that slows enemies.",
    icon: "assets/images/tower_splash.png",
    cost: 90,
    baseDamage: 8,
    baseRange: 100,
    baseFireRate: 1500,
    upgradeCost: 70,
    upgradeDamageMultiplier: 1.2,
    upgradeRangeMultiplier: 1.1,
    upgradeFireRateMultiplier: 0.95,
    maxLevel: 4,
  },
  sniper: {
    name: "Sniper Bee",
    desc: "Long range high damage single shots.",
    icon: "assets/images/tower_sniper.png",
    cost: 120,
    baseDamage: 30,
    baseRange: 250,
    baseFireRate: 2200,
    upgradeCost: 100,
    upgradeDamageMultiplier: 1.5,
    upgradeRangeMultiplier: 1.2,
    upgradeFireRateMultiplier: 0.85,
    maxLevel: 3,
  },
};

// Enemy types definition
const ENEMY_TYPES = {
  basic: {
    name: "Drone",
    color: "#a67c00",
    maxHp: 50,
    speed: 0.8,
    damage: 10,
    reward: 15,
  },
  fast: {
    name: "Worker Bee",
    color: "#d6b700",
    maxHp: 35,
    speed: 1.6,
    damage: 5,
    reward: 10,
  },
  tank: {
    name: "Queen's Guard",
    color: "#8c6000",
    maxHp: 120,
    speed: 0.5,
    damage: 20,
    reward: 35,
  },
  stinger: {
    name: "Stinger",
    color: "#ffbb00",
    maxHp: 40,
    speed: 1.1,
    damage: 15,
    reward: 18,
  },
};

// --- Classes ---

class Enemy {
  constructor(type) {
    this.type = type;
    this.color = ENEMY_TYPES[type].color;
    this.maxHp = ENEMY_TYPES[type].maxHp * modifiers.enemyHpMultiplier;
    this.hp = this.maxHp;
    this.speed = ENEMY_TYPES[type].speed * 1.7; // Speed buffed
    this.damage = ENEMY_TYPES[type].damage * modifiers.enemyDamageMultiplier;
    this.reward = ENEMY_TYPES[type].reward * modifiers.moneyGainMultiplier;
    this.x = path[0].x;
    this.y = path[0].y;
    this.pathIndex = 0;
    this.radius = 15;
    this.isDead = false;
    this.slowTimer = 0;
    this.slowFactor = 1;
  }

  update(delta) {
    if (this.isDead) return;
    // Slow effect decay
    if (this.slowTimer > 0) {
      this.slowTimer -= delta;
      if (this.slowTimer <= 0) {
        this.slowFactor = 1;
      }
    }

    let target = path[this.pathIndex + 1];
    if (!target) {
      // Reached end
      this.isDead = true;
      // Damage to base logic here (not implemented, just money penalty for example)
      money -= this.damage;
      if (money < 0) money = 0;
      showMessage(`Enemy reached the base! Lost $${Math.floor(this.damage)}`);
      updateUI();
      return;
    }
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const moveDist = (this.speed * this.slowFactor) * delta / 16;
    if (dist < moveDist) {
      this.x = target.x;
      this.y = target.y;
      this.pathIndex++;
    } else {
      this.x += (dx / dist) * moveDist;
      this.y += (dy / dist) * moveDist;
    }
  }

  draw(ctx) {
    if (this.isDead) return;
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, this.radius * 1.2, this.radius, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Draw "wings" (bee themed)
    ctx.fillStyle = '#fff9ccaa';
    ctx.beginPath();
    ctx.ellipse(this.x - this.radius / 2, this.y - this.radius / 2, this.radius / 2, this.radius / 3, 0, 0, 2 * Math.PI);
    ctx.ellipse(this.x + this.radius / 2, this.y - this.radius / 2, this.radius / 2, this.radius / 3, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Draw health bar above enemy
    ctx.fillStyle = '#ccc';
    ctx.fillRect(this.x - this.radius, this.y - this.radius - 10, this.radius * 2, 6);
    const healthRatio = this.hp / this.maxHp;
    ctx.fillStyle = healthRatio > 0.5 ? '#4caf50' : healthRatio > 0.2 ? '#ff9800' : '#d32f2f';
    ctx.fillRect(this.x - this.radius, this.y - this.radius - 10, this.radius * 2 * healthRatio, 6);

    ctx.restore();
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.isDead = true;
      enemiesKilledThisWave++;
      money += this.reward;
      updateUI();
    }
  }

  applySlow(duration, slowFactor) {
    this.slowTimer = Math.max(this.slowTimer, duration);
    this.slowFactor = Math.min(this.slowFactor, slowFactor);
  }
}

class Tower {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.level = 1;
    this.name = TOWER_TYPES[type].name;
    this.desc = TOWER_TYPES[type].desc;
    this.icon = TOWER_TYPES[type].icon;
    this.cost = TOWER_TYPES[type].cost;
    this.baseDamage = TOWER_TYPES[type].baseDamage;
    this.baseRange = TOWER_TYPES[type].baseRange;
    this.baseFireRate = TOWER_TYPES[type].baseFireRate;
    this.upgradeCost = TOWER_TYPES[type].upgradeCost;
    this.upgradeDamageMultiplier = TOWER_TYPES[type].upgradeDamageMultiplier;
    this.upgradeRangeMultiplier = TOWER_TYPES[type].upgradeRangeMultiplier;
    this.upgradeFireRateMultiplier = TOWER_TYPES[type].upgradeFireRateMultiplier;
    this.maxLevel = TOWER_TYPES[type].maxLevel;
    this.lastShotTime = 0;
  }

  get damage() {
    return this.baseDamage * Math.pow(this.upgradeDamageMultiplier, this.level - 1);
  }

  get range() {
    return this.baseRange * Math.pow(this.upgradeRangeMultiplier, this.level - 1);
  }

  get fireRate() {
    // Adjust fire rate by global modifier too
    return this.baseFireRate * Math.pow(this.upgradeFireRateMultiplier, this.level - 1) * modifiers.towerFireRateMultiplier;
  }

  upgrade() {
    if (this.level >= this.maxLevel) return false;
    if (money < this.upgradeCost) return false;
    money -= this.upgradeCost;
    this.level++;
    this.upgradeCost = Math.floor(this.upgradeCost * 1.7);
    updateUI();
    return true;
  }

  canShoot(time) {
    return time - this.lastShotTime >= this.fireRate;
  }

  shoot(target) {
    this.lastShotTime = Date.now();
    let projectile = new Projectile(this, target);
    projectiles.push(projectile);
  }

  draw(ctx, isSelected) {
    ctx.save();

    // Draw tower base circle
    ctx.fillStyle = '#ffd633';
    ctx.shadowColor = '#d9b500';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Draw tower "body"
    let img = new Image();
    img.src = this.icon;
    ctx.drawImage(img, this.x - 20, this.y - 20, 40, 40);

    // Draw range if selected
    if (isSelected) {
      ctx.strokeStyle = 'rgba(255, 219, 54, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw level text
    ctx.fillStyle = '#4a3e1d';
    ctx.font = 'bold 14px Fredoka One';
    ctx.textAlign = 'center';
    ctx.fillText(`Lv.${this.level}`, this.x, this.y + 35);

    ctx.restore();
  }

  isPointInside(px, py) {
    const dx = this.x - px;
    const dy = this.y - py;
    return dx * dx + dy * dy <= 400; // radius 20 squared
  }
}

class Projectile {
  constructor(tower, target) {
    this.tower = tower;
    this.target = target;
    this.x = tower.x;
    this.y = tower.y;
    this.speed = 8;
    this.radius = 6;
    this.damage = tower.damage;
    this.type = tower.type;
    this.isDead = false;
    this.slowEffect = tower.type === "splash" ? { duration: 1200, factor: 0.5 } : null;
  }

  update(delta) {
    if (this.isDead || this.target.isDead) {
      this.isDead = true;
      return;
    }
    let dx = this.target.x - this.x;
    let dy = this.target.y - this.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < this.speed) {
      // Hit target
      this.target.takeDamage(this.damage);
      if (this.slowEffect) {
        this.target.applySlow(this.slowEffect.duration, this.slowEffect.factor);
      }
      this.isDead = true;
      return;
    }
    this.x += (dx / dist) * this.speed;
    this.y += (dy / dist) * this.speed;
  }

  draw(ctx) {
    if (this.isDead) return;
    ctx.save();
    ctx.fillStyle = this.type === "splash" ? "#a08c00" : "#ffb700";
    ctx.shadowColor = "#ffb700";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// --- Game functions ---

function updateUI() {
  moneyDisplay.textContent = `Money: ${Math.floor(money)}`;
  waveDisplay.textContent = `Wave: ${wave}`;
  updateTowerInfo();
  updateModifiersPanel();
}

function updateTowerInfo() {
  if (!selectedTower) {
    towerName.textContent = "Select a tower";
    towerIcon.hidden = true;
    towerDesc.textContent = "Click a tower to see details and upgrades";
    upgradeBtn.disabled = true;
    upgradeBtn.setAttribute('aria-disabled', 'true');
    upgradeCostDisplay.textContent = '';
    return;
  }
  towerName.textContent = selectedTower.name;
  towerIcon.src = selectedTower.icon;
  towerIcon.alt = selectedTower.name;
  towerIcon.hidden = false;
  towerDesc.textContent = selectedTower.desc + `\nDamage: ${Math.floor(selectedTower.damage)}\nRange: ${Math.floor(selectedTower.range)}\nFire Rate: ${(selectedTower.fireRate / 1000).toFixed(2)}s\nLevel: ${selectedTower.level}/${selectedTower.maxLevel}`;

  if (selectedTower.level >= selectedTower.maxLevel) {
    upgradeBtn.disabled = true;
    upgradeBtn.textContent = "Max Level";
    upgradeBtn.setAttribute('aria-disabled', 'true');
    upgradeCostDisplay.textContent = '';
  } else if (money < selectedTower.upgradeCost) {
    upgradeBtn.disabled = true;
    upgradeBtn.textContent = "Upgrade";
    upgradeBtn.setAttribute('aria-disabled', 'true');
    upgradeCostDisplay.textContent = `Cost: $${selectedTower.upgradeCost}`;
  } else {
    upgradeBtn.disabled = false;
    upgradeBtn.textContent = "Upgrade";
    upgradeBtn.setAttribute('aria-disabled', 'false');
    upgradeCostDisplay.textContent = `Cost: $${selectedTower.upgradeCost}`;
  }
}

function updateModifiersPanel() {
  if (modifiers.activeModifiers.length === 0) {
    modifiersPanel.style.display = 'none';
    return;
  }
  modifiersPanel.style.display = 'block';
  modifiersPanel.innerHTML = '<strong>Active Challenge Modifiers:</strong><ul style="margin:6px 0 0 18px; padding:0;">' +
    modifiers.activeModifiers.map(m => `<li title="${m.description}">🐝 ${m.name}</li>`).join('') +
    '</ul>';
}

function showMessage(text, duration = 2500) {
  messagePopup.textContent = text;
  messagePopup.classList.add('show');
  if (messageTimeout) clearTimeout(messageTimeout);
  messageTimeout = setTimeout(() => {
    messagePopup.classList.remove('show');
  }, duration);
}

function placeTower(type, x, y) {
  if (money < TOWER_TYPES[type].cost) {
    showMessage("Not enough money to build this tower!");
    return false;
  }
  towers.push(new Tower(type, x, y));
  money -= TOWER_TYPES[type].cost;
  updateUI();
  return true;
}

function spawnEnemy() {
  // Random enemy type weighted by wave number (more hard types as wave grows)
  let enemyType;
  const rnd = Math.random();
  if (wave < 3) {
    enemyType = 'basic';
  } else if (wave < 6) {
    enemyType = rnd < 0.6 ? 'basic' : 'fast';
  } else if (wave < 10) {
    enemyType = rnd < 0.5 ? 'fast' : 'tank';
  } else {
    if (rnd < 0.4) enemyType = 'fast';
    else if (rnd < 0.8) enemyType = 'tank';
    else enemyType = 'stinger';
  }
  let e = new Enemy(enemyType);
  enemies.push(e);
  enemiesSpawnedThisWave++;
}

function nextWave() {
  wave++;
  enemiesPerWave = Math.floor(10 + wave * 2);
  enemiesSpawnedThisWave = 0;
  enemiesKilledThisWave = 0;

  // Reset modifiers and randomly add 1-3 new modifiers (stacking possible)
  modifiers = {
    spawnSpeedMultiplier: 1,
    enemyHpMultiplier: 1,
    enemyDamageMultiplier: 1,
    towerFireRateMultiplier: 1,
    moneyGainMultiplier: 1,
    activeModifiers: [],
  };
  const modsCount = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < modsCount; i++) {
    // 50% chance to add a modifier; allow duplicates for stacking
    if (Math.random() < 0.5) {
      const mod = challengeModifiers[Math.floor(Math.random() * challengeModifiers.length)];
      modifiers.activeModifiers.push(mod);
      mod.apply();
    }
  }

  spawnInterval = 1500 * modifiers.spawnSpeedMultiplier;

  showMessage(`Wave ${wave} started!`);

  updateUI();
}

function update(delta) {
  // Spawn enemies
  if (enemiesSpawnedThisWave < enemiesPerWave && Date.now() - lastSpawnTime > spawnInterval) {
    spawnEnemy();
    lastSpawnTime = Date.now();
  }

  // Update enemies
  enemies.forEach(e => e.update(delta));

  // Remove dead enemies from array
  enemies = enemies.filter(e => !e.isDead);

  // Update towers
  const now = Date.now();
  towers.forEach(tower => {
    // Find closest enemy in range
    let target = null;
    let closestDist = 9999;
    enemies.forEach(enemy => {
      if (enemy.isDead) return;
      let dx = enemy.x - tower.x;
      let dy = enemy.y - tower.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= tower.range && dist < closestDist) {
        closestDist = dist;
        target = enemy;
      }
    });
    if (target && tower.canShoot(now)) {
      tower.shoot(target);
    }
  });

  // Update projectiles
  projectiles.forEach(p => p.update(delta));
  projectiles = projectiles.filter(p => !p.isDead);

  // If wave finished
  if (enemiesKilledThisWave >= enemiesPerWave && enemies.length === 0) {
    showMessage("Wave cleared! Prepare for next wave.");
    nextWave();
  }

  updateUI();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw path (honey trail)
  ctx.save();
  ctx.strokeStyle = "#d9b500cc";
  ctx.lineWidth = 24;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.stroke();

  // Draw path highlight
  ctx.strokeStyle = "#fadb36cc";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.stroke();

  ctx.restore();

  // Draw towers
  towers.forEach(t => {
    t.draw(ctx, t === selectedTower);
  });

  // Draw enemies
  enemies.forEach(e => {
    e.draw(ctx);
  });

  // Draw projectiles
  projectiles.forEach(p => {
    p.draw(ctx);
  });
}

let lastTime = 0;
function gameLoop(timestamp = 0) {
  let delta = timestamp - lastTime;
  lastTime = timestamp;

  update(delta);
  draw();

  requestAnimationFrame(gameLoop);
}

// --- Input handling ---
canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  // Check if clicked on tower
  let clickedTower = null;
  for (let tower of towers) {
    if (tower.isPointInside(mx, my)) {
      clickedTower = tower;
      break;
    }
  }

  if (clickedTower) {
    selectedTower = clickedTower;
    updateTowerInfo();
    return;
  }

  // Else place tower at clicked location (grid snapped)
  const snappedX = Math.round(mx / TILE_SIZE) * TILE_SIZE;
  const snappedY = Math.round(my / TILE_SIZE) * TILE_SIZE;

  // Disallow placing on path (check distance to path points < 30)
  for (let i = 0; i < path.length; i++) {
    let dx = snappedX - path[i].x;
    let dy = snappedY - path[i].y;
    if (Math.sqrt(dx * dx + dy * dy) < 40) {
      showMessage("Can't build on the path!");
      return;
    }
  }

  // Place a basic tower for now (could add UI later to select type)
  if (placeTower('basic', snappedX, snappedY)) {
    selectedTower = towers[towers.length - 1];
    updateTowerInfo();
  }
});

upgradeBtn.addEventListener('click', () => {
  if (!selectedTower) return;
  if (selectedTower.upgrade()) {
    showMessage(`Upgraded ${selectedTower.name} to level ${selectedTower.level}`);
    updateTowerInfo();
  } else {
    showMessage("Cannot upgrade!");
  }
});

// Start first wave on load
nextWave();
gameLoop();
