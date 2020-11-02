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

var player1;
var player2;
var asteroids;
var score = 0;
var gameOver = false;
var scoreText;
var cursors;

var game = new Phaser.Game(config);

function preload (){
  this.load.spritesheet('asteroids', 'assets/asteroids.png', { frameWidth: 70, frameHeight: 65 })
  this.load.spritesheet('ship', 'assets/ship.png', { frameWidth: 90, frameHeight: 90 })
}

function create (){
  var self = this
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
  // player1 = this.physics.add.sprite(400, 300, 'ship', 0);
  // asteroids = this.physics.add.group();
  // for (let i = 0; i < 12; i++) {
  //   const xPos = Phaser.Math.Between(0, 800);
  //   const yPos = Phaser.Math.Between(0, 600);
  //   const xVel = Phaser.Math.Between(-80, 80);
  //   const yVel = Phaser.Math.Between(-80, 80);
  //   let asteroid = asteroids.create(xPos, yPos, 'asteroids', 6).setScale(Phaser.Math.FloatBetween(0.5, 3))
  //   asteroid.setVelocity(xVel, yVel);
  // }
  this.cursors = this.input.keyboard.createCursorKeys();
}

function update (){
  if (!this.ship) return
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
}

function addPlayer(self, playerInfo){
  const ship = self.physics.add.sprite(400, 300, 'ship', 0);
  self.ship = ship
}

function addOtherPlayers(self, playerInfo){
  const otherPlayer = self.physics.add.sprite(500, 200, 'ship', 0);
  self.otherPlayers[playerInfo.playerId] = otherPlayer
}