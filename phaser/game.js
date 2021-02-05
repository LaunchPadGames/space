let canvasWidth = 1000;
let canvasHeight = 800;

var config = {
  type: Phaser.AUTO,
  width: canvasWidth,
  height: canvasHeight,
  physics: {
      default: 'arcade',
      arcade: {
          gravity: { y: 0 },
          debug: false
      }
  },
  scene: {
      preload: preload,
      create: create,
      update: update
  }
};


let setAsteroids;
let asteroids;
let score = 0;
let scoreOther = 0;
let gameOver = false;
let scoreText;
let scoreTextOther;
let cursors;
let lastFired = 100;
let socket;
let physics;
let startScreen;
let hasJoined = false;
let hasGameStarted = false;
let selector;
let selectorYPos1 = 583;
let selectorYPos2 = 653;
let timerDisplay;
let timedEvent;
let isTimerRunning = false;

let game = new Phaser.Game(config);

function preload (){
  this.load.image('space', 'assets/start_bkgd.jpg')
  this.load.image('title', 'assets/start_title.png')
  this.load.spritesheet('asteroids', 'assets/asteroids.png', { frameWidth: 70, frameHeight: 65 })
  this.load.spritesheet('ship', 'assets/ship.png', { frameWidth: 90, frameHeight: 90 })
  this.load.image('laserGreen', 'assets/laserGreenR.png')
  this.load.image('laserBlue', 'assets/laserBlueR.png')
}

function create (){
  let self = this;
  self.initialTime = 300 // in seconds
  self.asteroidArray = []
  self.ship = null
  self.otherPlayers = {}
  scoreText = self.add.text(5, 5, 'Your Score: 0')
  scoreTextOther = self.add.text(5, 20, 'Opponent Score: 0')

  // Timer
  timerDisplay = self.add.text(500, 15, getTimerDisplay(self.initialTime))
  timerDisplay.setOrigin(0.5)

  self.hiddenTimeStamp = 0;
  game.events.on('hidden', () => {
    self.hiddenTimeStamp = performance.now();
  });

  game.events.on('visible', () => {
    let elapsedTime = Math.floor((performance.now() - self.hiddenTimeStamp)/1000); //seconds
    self.initialTime -= elapsedTime;
  })

  // this.socket = io();
  // socket = this.socket
  physics = self.physics

  startBkgd = self.add.image(500, 400, 'space')
  title = self.add.image(500, 200, 'title')
  onePlayerOption = self.add.text(150, 570, 'Start 1 Player Game'.toUpperCase(), { fontSize: '32px' });
  twoPlayerOption = self.add.text(150, 640, 'Start/Join 2 Player Game'.toUpperCase(), { fontSize: '32px' });
  selector = self.add.sprite(110, selectorYPos1, 'ship').setScale(0.65)
  startScreen = [startBkgd, title, onePlayerOption, twoPlayerOption, selector]

  // Lasers
  self.laserGroup = new LaserGroup(self);

  self.cursors = self.input.keyboard.createCursorKeys();
}

function update(time) {
  if (!hasJoined) {
    if (this.cursors.up.isDown) {
      selector.y = selectorYPos1
    }
    if (this.cursors.down.isDown) {
      selector.y = selectorYPos2
    }
    if (this.cursors.space.isDown) {
      hasJoined = true
      clearStartScreen()
      const allowedPlayersCount = selector.y === selectorYPos1 ? 1 : 2
      startSocketActions(this, allowedPlayersCount)
    }
  } else if (hasGameStarted) {
    if (!isTimerRunning) {
      // Each 1000 ms call updateTimer
      timedEvent = this.time.addEvent({ delay: 1000, callback: updateTimer, callbackScope: this, loop: true });
      isTimerRunning = true
    }

    if (this.ship) {
      if (this.cursors.up.isDown) {
        this.physics.velocityFromRotation(this.ship.rotation, 100, this.ship.body.acceleration);
      }
      else if (this.cursors.down.isDown) {
        this.physics.velocityFromRotation(this.ship.rotation, -100, this.ship.body.acceleration);
      }
      else {
        this.ship.setAcceleration(0);
      }

      if (this.cursors.left.isDown) {
        this.ship.setAngularVelocity(-300);
      }
      else if (this.cursors.right.isDown) {
        this.ship.setAngularVelocity(300);
      }
      else {
        this.ship.setAngularVelocity(0);
      }

      if (this.cursors.space.isDown && time > lastFired + 200 && this.ship.body.enable) {
        this.laserGroup.fireLaser(this.ship.x, this.ship.y, this.ship.rotation);
        lastFired = time;
      }

      if (this.ship.x < 0) this.ship.x = canvasWidth
      if (this.ship.x > canvasWidth) this.ship.x = 0
      if (this.ship.y < 0) this.ship.y = canvasHeight
      if (this.ship.y > canvasHeight) this.ship.y = 0

      let x = this.ship.x
      let y = this.ship.y
      let r = this.ship.rotation

      if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)) {
        this.socket.emit('playerMovement', { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation })
      }

      this.ship.oldPosition = {
        x: this.ship.x,
        y: this.ship.y,
        rotation: this.ship.rotation
      }
    }
  }

  if(this.asteroids){
    this.asteroids.children.entries.forEach((asteroid) => {
      if (asteroid.x < 0) asteroid.x = canvasWidth
      if (asteroid.x > canvasWidth) asteroid.x = 0
      if (asteroid.y < 0) asteroid.y = canvasHeight
      if (asteroid.y > canvasHeight) asteroid.y = 0
    })
  }
}

function addPlayer(self, playerInfo){
  const ship = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'ship', 0);
  self.asteroids = self.physics.add.group();
  asteroids = self.asteroids
  overlap = self.physics.add.overlap(ship, self.asteroids, crash, null, this)
  console.log(overlap)
  overlap.name = self.socket.id
  ship.setMaxVelocity(150, 150)
  self.ship = ship
}

function addOtherPlayers(self, playerInfo){
  const otherPlayer = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'ship', 0);
  otherPlayer.setMaxVelocity(150, 150)
  self.otherPlayers[playerInfo.playerId] = otherPlayer
}

class LaserGroup extends Phaser.Physics.Arcade.Group
{
  constructor(scene) {
    super(scene.physics.world, scene);

    this.createMultiple({
      classType: Laser,
      frameQuantity: 30, // 30 instances of Laser
      active: false,
      visible: false,
      key: 'laserGreen'
    })
  }

  fireLaser(x, y, r) {
    const laser = this.getFirstDead(true, x, y, 'laserGreen');
    if (laser) {
      laser.fire(x, y, r);
    }
  }
}

class Laser extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, sprite = 'laserGreen') {
    super(scene, x, y, sprite);
  }

  fire(x, y, r, emit = true) {
    this.body.reset(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setAngle(r)
    this.setScale(0.5)
    this.scene.physics.add.overlap(this, this.scene.asteroids, destroyAsteroid);
    this.scene.physics.velocityFromRotation(r, 400, this.body.velocity);
    if (emit && this.scene.socket) this.scene.socket.emit('laserShot', { x: x, y: y, rotation: r })
  }
}

function crash(player, asteroid){
  console.log('in crash')
  console.log(socket)
  console.log(this.socket)
  asteroid.destroy()
  socket.emit('destroyAsteroid', asteroid.index)
  player.disableBody(true, true);
  socket.emit('disablePlayer', socket.id)
  resetPlayer(player)
}

function resetPlayer(player) {
  setTimeout(() => {
    player.enableBody(true, player.body.x, player.body.y, true, true)
    socket.emit('enablePlayer', socket.id)
    pauseCollider(player)
  }, 500)
}

function pauseCollider(player) {
  setTimeout(() => {
    overlap = physics.add.overlap(player, asteroids, crash, null, this)
    overlap.name = socket.id
  }, 2000)
  const collider = physics.world.colliders.getActive().find(function(collider){
    return collider.name === socket.id
  })
  collider.destroy()
}


function destroyAsteroid(laser, asteroid) {
  asteroid.disableBody(true, true);
  laser.destroy();
  if (laser.texture.key === 'laserGreen') {
    score += 10;
  } else {
    scoreOther += 10;
  }
  updateText();
}

function clearStartScreen() {
  startScreen.forEach((pageElement) => pageElement.destroy())
}

function startSocketActions(self, allowedPlayersCount) {
  self.socket = io.connect('', { query: `allowedPlayersCount=${allowedPlayersCount}` });
  socket = self.socket;
  self.socket.on('inProgress', function () {
    clearStartScreen()
    self.add.text(225, 400, 'Game In Progress. Go Away.'.toUpperCase(), { fontSize: '32px' })
  })
  self.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        addOtherPlayers(self, players[id])
      }
    });
  });
  self.socket.on('newPlayer', function(playerInfo){
    addOtherPlayers(self, playerInfo)
  });
  self.socket.on('disconnect', function(playerId){
    self.otherPlayers[playerId].destroy()
  })
  self.socket.on('playerMoved', function(playerInfo){
    otherPlayer = self.otherPlayers[playerInfo.playerId]
    otherPlayer.setRotation(playerInfo.rotation)
    otherPlayer.setPosition(playerInfo.x, playerInfo.y)
  })
  self.socket.on('createAsteroids', function (asteroidArray) {
    // self.asteroids = self.physics.add.group();
    asteroidArray.forEach((asteroid) => {
      let phaserAsteroid = self.asteroids.create(500, 500, 'asteroids', 6)
      phaserAsteroid.setScale(asteroid.scale)
      phaserAsteroid.index = asteroid.index
      phaserAsteroid.setPosition(asteroid.x, asteroid.y)
      phaserAsteroid.setVelocity(asteroid.xVel, asteroid.yVel)
    })
    // start game
    hasGameStarted = true
  })
  self.socket.on('laserUpdate', function(laser, owner) {
    let laser_instance = new Laser(self, laser.x, laser.y, 'laserBlue');
    self.add.existing(laser_instance);
    self.physics.add.existing(laser_instance);
    laser_instance.fire(laser.x, laser.y, laser.rotation, false);
    self.physics.add.overlap(laser_instance, self.asteroids, destroyAsteroid);
  });
  self.socket.on('broadcastDestoryAsteroid', function(asteroidIndex){
    self.asteroids.children.entries.forEach(function(asteroid) {
      if (asteroid.index === asteroidIndex) asteroid.destroy()
    })
  })
  self.socket.on('disableOtherPlayer', function(socketId){
    self.otherPlayers[socketId].disableBody(true, true);
  })
  self.socket.on('enableOtherPlayer', function(socketId){
    otherPlayer = self.otherPlayers[socketId]
    otherPlayer.enableBody(true, otherPlayer.body.x, otherPlayer.body.y, true, true)
  })
}

function updateText() {
  scoreText.setText('Your Score: ' + score);
  scoreTextOther.setText('Opponent Score: ' + scoreOther);
}

function getTimerDisplay(time) {
  let minutes = Math.floor(time / 60)
  let remainingSeconds = time % 60
  let seconds = (remainingSeconds < 10) ? '0' + remainingSeconds : remainingSeconds
  return minutes + ':' + seconds
}

function updateTimer() {
  this.initialTime -= 1 // One second
  if (this.initialTime <= 0) {
    endBkgd = this.add.image(500, 400, 'space')
    gameOverText = this.add.text(500, 400, 'Game Over'.toUpperCase(), { fontSize: '32px' })
    gameOverText.setOrigin(0.5)
  } else {
    timerDisplay.setText(getTimerDisplay(this.initialTime));
  }
}
