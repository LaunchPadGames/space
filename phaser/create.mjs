import LaserGroup from './LaserGroup.mjs'
import {getTimerDisplay} from './displays.mjs'

export default function create (){
  this.asteroidArray = []
  this.ship = null
  this.shipContainer = null
  this.otherPlayers = {}
  this.scoreText = this.add.text(5, 5, 'Your Score: 0')
  this.scoreTextOther = this.add.text(5, 20, 'Opponent Score: 0')

  this.score = 0;
  this.scoreOther = 0;
  this.lastFired = 100;
  this.rateOfFire = 200;
  this.spray = false;
  this.angles = [-0.4, -0.2, 0.2, 0.4]
  this.speed = 100
  this.powerupHash = {}
  this.canvasWidth = 1000
  this.canvasHeight = 800

  // Timer
  this.timerDisplay = this.add.text(500, 15, getTimerDisplay(0))
  this.timerDisplay.setOrigin(0.5)

  this.hiddenTimeStamp = 0;
  this.events.on('hidden', () => {
    this.hiddenTimeStamp = performance.now();
  });

  this.events.on('visible', () => {
    let elapsedTime = Math.floor((performance.now() - this.hiddenTimeStamp)/1000); //seconds
    this.initialTime -= elapsedTime;
  })

  this.hasGameStarted = false
  this.selectorYPos1 = 583
  this.selectorYPos2 = 653;
  this.hasJoined = false
  this.hasGameStarted = false
  this.startBkgd = this.add.image(500, 400, 'space')
  this.title = this.add.image(500, 200, 'title')
  this.onePlayerOption = this.add.text(150, 570, 'Start 1 Player Game'.toUpperCase(), { fontSize: '32px' });
  this.twoPlayerOption = this.add.text(150, 640, 'Start/Join 2 Player Game'.toUpperCase(), { fontSize: '32px' });
  this.selector = this.add.sprite(110, this.selectorYPos1, 'ship').setScale(0.65)
  this.startScreen = [this.startBkgd, this.title, this.onePlayerOption, this.twoPlayerOption, this.selector]

  // Lasers
  this.laserGroup = new LaserGroup(this);

  this.cursors = this.input.keyboard.createCursorKeys();
}