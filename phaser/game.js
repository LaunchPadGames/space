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
  this.asteroids = this.physics.add.group();
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
  // this.socket.on('setAsteroids', function(socketId){
  //   this.asteroids = this.physics.add.group();
  //   if(self.socket.id === socketId){
  //     for (let i = 0; i < 12; i++) {
  //       const xPos = Phaser.Math.Between(0, 800);
  //       const yPos = Phaser.Math.Between(0, 600);
  //       const xVel = Phaser.Math.Between(-80, 80);
  //       const yVel = Phaser.Math.Between(-80, 80);
  //       let asteroid = this.asteroids.create(xPos, yPos, 'asteroids', 6).setScale(Phaser.Math.FloatBetween(0.5, 3))
  //       asteroid.index = i
  //       this.asteroidArray.push(asteroid.setVelocity(xVel, yVel))
  //     }
  //   }
  // })

  // this.socket.on('asteroidPositions', function(asteroidArray){
  //   this.asteroids = this.physics.add.group();
  //   asteroidArray.forEach(function(asteroid, index){
  //     this.asteroids.create(xPos, yPos, 'asteroids', 6).setScale(Phaser.Math.FloatBetween(0.5, 3))
  //   })
  // })
  this.cursors = this.input.keyboard.createCursorKeys();
}

function update (){
  // console.log('this.asteroidArray[0] (x, y): ', `(${this.asteroidArray[0].x}, ${this.asteroidArray[0].y})`)
  // if(this.asteroidArray.length > 0){
  //   this.socket.emit('updateAsteroidPositions', this.asteroidArray.map(function(asteroid){
  //     return { index: asteroid.index, x: asteroid.x, y: asteroid.y }
  //   }))
  // }
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
  self.ship = ship
}

function addOtherPlayers(self, playerInfo){
  const otherPlayer = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'ship', 0);
  self.otherPlayers[playerInfo.playerId] = otherPlayer
}