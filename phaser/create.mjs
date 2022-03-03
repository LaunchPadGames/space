export default function create (){
  let self = this;
  scene = this;
  self.asteroidArray = []
  self.ship = null
  self.shipContainer = null
  self.otherPlayers = {}
  scoreText = self.add.text(5, 5, 'Your Score: 0')
  scoreTextOther = self.add.text(5, 20, 'Opponent Score: 0')

  // Timer
  timerDisplay = self.add.text(500, 15, getTimerDisplay(0))
  timerDisplay.setOrigin(0.5)

  self.hiddenTimeStamp = 0;
  game.events.on('hidden', () => {
    self.hiddenTimeStamp = performance.now();
  });

  game.events.on('visible', () => {
    let elapsedTime = Math.floor((performance.now() - self.hiddenTimeStamp)/1000); //seconds
    self.initialTime -= elapsedTime;
  })

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