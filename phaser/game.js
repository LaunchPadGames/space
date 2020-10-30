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
  this.socket = io();
  asteroids = this.physics.add.group();
  player1 = this.physics.add.sprite(400, 300, 'ship', 0);
  cursors = this.input.keyboard.createCursorKeys();
  for (let i = 0; i < 12; i++) {
    const xPos = Phaser.Math.Between(0, 800);
    const yPos = Phaser.Math.Between(0, 600);
    const xVel = Phaser.Math.Between(-80, 80);
    const yVel = Phaser.Math.Between(-80, 80);
    let asteroid = asteroids.create(xPos, yPos, 'asteroids', 6).setScale(Phaser.Math.FloatBetween(0.5, 3))
    asteroid.setVelocity(xVel, yVel);
  }
}

function update (){
  if (cursors.up.isDown)
  {
    this.physics.velocityFromRotation(player1.rotation, 200, player1.body.acceleration);
  }
  else if (cursors.down.isDown)
  {
    this.physics.velocityFromRotation(player1.rotation, -200, player1.body.acceleration);
  }
  else
  {
    player1.setAcceleration(0);
  }

  if (cursors.left.isDown)
  {
    player1.setAngularVelocity(-300);
  }
  else if (cursors.right.isDown)
  {
    player1.setAngularVelocity(300);
  }
  else
  {
    player1.setAngularVelocity(0);
  }
}