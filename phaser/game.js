var config = {
  type: Phaser.AUTO,
  width: 1000,
  height: 800,
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
let gameOver = false;
let scoreText;
let cursors;
let socket = null

let game = new Phaser.Game(config);

function preload (){
  this.load.spritesheet('asteroids', 'assets/asteroids.png', { frameWidth: 70, frameHeight: 65 })
  this.load.spritesheet('ship', 'assets/ship.png', { frameWidth: 90, frameHeight: 90 })
}

function create (){
  let self = this
  self.asteroidArray = []
  self.ship = null
  self.otherPlayers = {}
  this.socket = io();
  socket = this.socket
  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        addOtherPlayers(self, players[id])
      }
    });
  });
  this.socket.on('newPlayer', function(playerInfo){
    addOtherPlayers(self, playerInfo)
  });
  this.socket.on('disconnect', function(playerId){
    self.otherPlayers[playerId].destroy()
  })
  this.socket.on('playerMoved', function(playerInfo){
    otherPlayer = self.otherPlayers[playerInfo.playerId]
    otherPlayer.setRotation(playerInfo.rotation)
    otherPlayer.setPosition(playerInfo.x, playerInfo.y)
  })
   this.socket.on('createAsteroids', function(asteroidArray){
     asteroidArray.forEach((asteroid) => {
      let phaserAsteroid = self.asteroids.create(500, 500, 'asteroids', 6)
      phaserAsteroid.setScale(asteroid.scale)
      phaserAsteroid.index = asteroid.index
      phaserAsteroid.setPosition(asteroid.x, asteroid.y)
      phaserAsteroid.setVelocity(asteroid.xVel, asteroid.yVel)
     })
  })
  this.socket.on('broadcastDestoryAsteroid', function(asteroidIndex){
    self.asteroids.children.entries.forEach((asteroid) => {
      if (asteroid.index === asteroidIndex) asteroid.destroy()
    })
  })
  this.cursors = this.input.keyboard.createCursorKeys();
}

function update (){
  if(this.ship){
    if (this.cursors.up.isDown)
    {
      this.physics.velocityFromRotation(this.ship.rotation, 200, this.ship.body.acceleration);
    }
    else if (this.cursors.down.isDown)
    {
      this.physics.velocityFromRotation(this.ship.rotation, -200, this.ship.body.acceleration);
    }
    else
    {
      this.ship.setAcceleration(0);
    }

    if (this.cursors.left.isDown)
    {
      this.ship.setAngularVelocity(-300);
    }
    else if (this.cursors.right.isDown)
    {
      this.ship.setAngularVelocity(300);
    }
    else
    {
      this.ship.setAngularVelocity(0);
    }

    let x = this.ship.x
    let y = this.ship.y
    let r = this.ship.rotation

    if( this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)){
      this.socket.emit('playerMovement', {x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation})
    }

    this.ship.oldPosition = {
      x: this.ship.x,
      y: this.ship.y,
      rotation: this.ship.rotation
    }
  }
}

function addPlayer(self, playerInfo){
  const ship = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'ship', 0);
  ship.setCollideWorldBounds(true);
  self.asteroids = self.physics.add.group();
  console.log('asteroids addPlayer', self.asteroids)
  self.physics.add.overlap(ship, self.asteroids, crash, null, this)
  self.ship = ship
}

function addOtherPlayers(self, playerInfo){
  const otherPlayer = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'ship', 0);
  self.otherPlayers[playerInfo.playerId] = otherPlayer
}

function crash(player, asteroid){
  console.log(asteroid)
  socket.emit('destroyAsteroid', asteroid.index)

  asteroid.destroy()

  player.disableBody(true, true);
  resetPlayer(player)
}

function resetPlayer(player) {
  setTimeout(() => {
    player.enableBody(true, player.body.x, player.body.y, true, true)
  }, 2000)
}
