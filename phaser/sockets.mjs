import {addPlayer, addOtherPlayers} from './players.mjs'
import endGame from './endGame.mjs'
import Laser from './laser.mjs'
import {clearWaitScreen, getTimerDisplay, updateScoreText, displayWaitScreen, clearStartScreen} from './displays.mjs'
import {rateOfFirePowerup, sprayPowerup, shieldPowerup, updateShieldPowerUp, speedPowerup} from './powerUps.mjs'
import {destroyAsteroid} from './asteroid.mjs'

export default function startSocketActions(self, allowedPlayersCount) {
  self.socket = io.connect('', { query: `allowedPlayersCount=${allowedPlayersCount}` });
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
    let otherPlayer = self.otherPlayers[playerInfo.playerId]
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
    laser_instance.fire(laser.x, laser.y, laser.rotation, self, false);
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
    let otherPlayer = self.otherPlayers[socketId]
    otherPlayer.enableBody(true, otherPlayer.body.x, otherPlayer.body.y, true, true)
  })
  self.socket.on('updateScore', function({socketId, score: newScore}){
    if (socketId === self.ship.playerId) {
      self.score = newScore
    } else {
      self.scoreOther = newScore
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
    let otherPlayer = self.otherPlayers[socketId]
    otherPlayer.shieldLevel = data['shieldLevel']
    updateShieldPowerUp(otherPlayer)
  })
  self.socket.on('updatePowerups', function(data){
    let powerup = self.physics.add.sprite(data['x'], data['y'], data['type'], 0);
    powerup.id = data['id']
    if(data['type'] === 'shield_powerup'){
      self.physics.add.overlap(self.ship, powerup, shieldPowerup, null, self);
    } else if(data['type'] === 'silver_powerup'){
      self.physics.add.overlap(self.ship, powerup, rateOfFirePowerup, null, self);
    } else if(data['type'] === 'gold_powerup'){
      self.physics.add.overlap(self.ship, powerup, sprayPowerup, null, self);
    } else {
      self.physics.add.overlap(self.ship, powerup, speedPowerup, null, self);
    }
    self.powerupHash[data['id']] = powerup
  })
  self.socket.on('shieldPowerUp', function(data){
    let powerup = self.powerupHash[data['powerupId']]
    console.log('shield powerup listener: ', powerup)
    console.log("data['playerId']: ", data['playerId'])
    console.log("self.ship.playerId : ", self.ship.playerId )
    if(self.ship.playerId === data['playerId']){
      self.ship.shieldLevel = 2;
      self.ship.setTexture('ship_shield1')
    } else {
      powerup.destroy()
      self.otherPlayer = self.otherPlayers[data['playerId']]
      self.otherPlayer.shieldLevel = 2;
      self.otherPlayer.setTexture('ship_shield1')
    }
  })
  self.socket.on('silverPowerup', function(data){
    let powerup = self.powerupHash[data['powerupId']]
    if(self.ship.playerId === data['playerId']){
      self.ship.rateOfFire = true
    } else {
      powerup.destroy();
      self.otherPlayer = self.otherPlayers[data['playerId']]
      self.otherPlayer.rateOfFire = true;
    }
  })
  self.socket.on('silverPowerupOff', function(data){
    if(self.ship.playerId === data['playerId']){
      self.ship.rateOfFire = false
    } else {
      self.otherPlayer = self.otherPlayers[data['playerId']]
      self.otherPlayer.rateOfFire = false;
    }
  })
  self.socket.on('goldPowerup', function(data){
    let powerup = self.powerupHash[data['powerupId']]
    if(self.ship.playerId === data['playerId']){
      self.ship.spray = true
    } else {
      powerup.destroy();
      self.otherPlayer = self.otherPlayers[data['playerId']]
      self.otherPlayer.spray = true;
    }
  })
  self.socket.on('goldPowerupOff', function(data){
    if(self.ship.playerId === data['playerId']){
      self.ship.spray = false
    } else {
      self.otherPlayer = self.otherPlayers[data['playerId']]
      self.otherPlayer.spray = false;
    }
  })
  self.socket.on('starPowerup', function(data){
    let powerup = self.powerupHash[data['powerupId']]
    if(self.ship.playerId === data['playerId']){
      self.ship.speed += 600
    } else {
      powerup.destroy();
      self.otherPlayer = self.otherPlayers[data['playerId']]
      self.otherPlayer.speed += 600
    }
  })

  self.socket.on('starPowerupOff', function(data){
    let powerup = self.powerupHash[data['powerupId']]
    if(self.ship.playerId === data['playerId']){
      self.ship.speed -= 600
    } else {
      self.otherPlayer = self.otherPlayers[data['playerId']]
      self.otherPlayer.speed -= 600
    }
  })
}