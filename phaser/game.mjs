import preload from './preload.mjs'
import create from './create.mjs'
import update from './update.mjs'

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


// // let setAsteroids;
// // let asteroids;
// // let score = 0;
// // let scoreOther = 0;
// // let gameOver = false;
// // let scoreText;
// // let scoreTextOther;
// // let cursors;
// // let lastFired = 100;
// // let socket;
// // let physics;
// // let startScreen;
// // let hasJoined = false;
// // let hasGameStarted = false;
// // let selector;
// // let selectorYPos1 = 583;
// // let selectorYPos2 = 653;
// // let rateOfFire = 200;
// // let scene = null;
// // let spray = false;
// // const angles = [-0.4, -0.2, 0.2, 0.4]
// // let speed = 100
// // let timerDisplay;
// // let timedEvent;
// // let isTimerRunning = false;
// // let waitingText;
// // let roomTagInstructionsText;
// // let roomTagText;
// // let powerupHash = {}

let game = new Phaser.Game(config)