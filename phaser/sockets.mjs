import {addPlayer, addOtherPlayers} from './players.mjs'
import endGame from './endGame.mjs'
import Laser from './laser.mjs'

export default function startSocketActions(self, allowedPlayersCount) {
  self.socket = io.connect('', { query: `allowedPlayersCount=${allowedPlayersCount}` });
  console.log('socket: ', self.socket)
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
  self.socket.on('waitingForPlayers', (gameData) => {
    displayWaitScreen(self, gameData)
  })
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
    asteroidArray.forEach((asteroid) => {
      let phaserAsteroid = self.asteroids.create(500, 500, `asteroid${asteroid.scale}`)
      phaserAsteroid.setScale(1.5)
      phaserAsteroid.index = asteroid.index
      phaserAsteroid.setPosition(asteroid.x, asteroid.y)
      phaserAsteroid.setVelocity(asteroid.xVel, asteroid.yVel)
    })
    // start game
    clearWaitScreen(self)
    self.hasGameStarted = true
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
  self.socket.on('updateScore', function({socketId, score: newScore}){
    if (socketId === self.ship.playerId) {
      score = newScore
    } else {
      scoreOther = newScore
    }
    updateScoreText(self)
  })
  self.socket.on('updateTimer', function(time){
    if (time <= 0) {
      endGame(self)
    } else {
      self.timerDisplay.setText(getTimerDisplay(time));
    }
  })
  self.socket.on('shieldUpdateOtherPlayers', function(data){
    let socketId = data['socketId']
    otherPlayer = self.otherPlayers[socketId]
    otherPlayer.shieldLevel = data['shieldLevel']
    updateShieldPowerUp(otherPlayer)
  })
  self.socket.on('updatePowerups', function(data){
    let powerup = physics.add.sprite(data['x'], data['y'], data['type'], 0);
    powerup.id = data['id']
    if(data['type'] === 'shield_powerup'){
      physics.add.overlap(self.ship, powerup, shieldPowerup);
    } else if(data['type'] === 'silver_powerup'){
      physics.add.overlap(self.ship, powerup, rateOfFirePowerup);
    } else if(data['type'] === 'gold_powerup'){
      physics.add.overlap(self.ship, powerup, sprayPowerup);
    } else {
      physics.add.overlap(self.ship, powerup, speedPowerup);
    }
    this.powerupHash[data['id']] = powerup
  })
  self.socket.on('shieldPowerUp', function(data){
    console.log('shieldPowerUp listener')
    let powerup = this.powerupHash[data['powerupId']]
    if(self.ship.playerId === data['playerId']){
      self.ship.shieldLevel = 2;
      self.ship.setTexture('ship_shield1')
    } else {
      powerup.destroy()
      otherPlayer = self.otherPlayers[data['playerId']]
      otherPlayer.shieldLevel = 2;
      otherPlayer.setTexture('ship_shield1')
    }
  })
  self.socket.on('silverPowerup', function(data){
    console.log('rateOfFire listener')
    let powerup = this.powerupHash[data['powerupId']]
    if(self.ship.playerId === data['playerId']){
      self.ship.rateOfFire = true
    } else {
      powerup.destroy();
      otherPlayer = self.otherPlayers[data['playerId']]
      otherPlayer.rateOfFire = true;
    }
  })
  self.socket.on('silverPowerupOff', function(data){
    if(self.ship.playerId === data['playerId']){
      self.ship.rateOfFire = false
    } else {
      otherPlayer = self.otherPlayers[data['playerId']]
      otherPlayer.rateOfFire = false;
    }
  })
  self.socket.on('goldPowerup', function(data){
    console.log('Spray listener')
    let powerup = this.powerupHash[data['powerupId']]
    if(self.ship.playerId === data['playerId']){
      self.ship.spray = true
    } else {
      powerup.destroy();
      otherPlayer = self.otherPlayers[data['playerId']]
      otherPlayer.spray = true;
    }
  })
  self.socket.on('goldPowerupOff', function(data){
    if(self.ship.playerId === data['playerId']){
      self.ship.spray = false
    } else {
      otherPlayer = self.otherPlayers[data['playerId']]
      otherPlayer.spray = false;
    }
  })
  self.socket.on('starPowerup', function(data){
    console.log('speed listener')
    let powerup = this.powerupHash[data['powerupId']]
    if(self.ship.playerId === data['playerId']){
      self.ship.speed += 600
    } else {
      powerup.destroy();
      otherPlayer = self.otherPlayers[data['playerId']]
      otherPlayer.speed += 600
    }
  })

  self.socket.on('starPowerupOff', function(data){
    let powerup = this.powerupHash[data['powerupId']]
    if(self.ship.playerId === data['playerId']){
      self.ship.speed -= 600
    } else {
      otherPlayer = self.otherPlayers[data['playerId']]
      otherPlayer.speed -= 600
    }
  })
}