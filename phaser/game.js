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
let lastFired = 100;

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
     self.asteroids = self.physics.add.group();
     asteroidArray.forEach((asteroid) => {
      let phaserAsteroid = self.asteroids.create(500, 500, 'asteroids', 6)
      phaserAsteroid.setScale(asteroid.scale)
      phaserAsteroid.index = asteroid.index
      phaserAsteroid.setPosition(asteroid.x, asteroid.y)
      phaserAsteroid.setVelocity(asteroid.xVel, asteroid.yVel)
     })
  })
  this.cursors = this.input.keyboard.createCursorKeys();

  // Lasers
  this.laserGroup = new LaserGroup(this);
}

function update (time){
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

    if (this.cursors.space.isDown && time > lastFired + 50) {
      this.laserGroup.fireLaser(this.ship.x, this.ship.y, this.ship.rotation);
      lastFired = time;
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
  self.ship = ship
}

function addOtherPlayers(self, playerInfo){
  const otherPlayer = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'ship', 0);
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
      key: 'laser'
    })
  }

  fireLaser(x, y, r) {
    const laser = this.getFirstDead(true);
    if (laser) {
      laser.fire(x, y, r);
    }
  }
}

class Laser extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'laser');
  }

  fire(x, y, r) {
    this.body.reset(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setAngle(r)
    this.scene.physics.velocityFromRotation(r, 400, this.body.velocity);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (this.y <= 0) {
      this.setActive(false);
      this.setVisible(false);
    }
  }
}