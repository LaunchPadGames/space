import {pauseCollider, crash} from './asteroid.mjs'

function addPlayer(self, playerInfo){
  const ship = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'ship', 0);
  ship.primary = playerInfo.primary
  ship.playerId = playerInfo.playerId
  ship.shieldLevel = 0
  ship.spray = false
  ship.rateOfFire = 200
  ship.speed = 100
  self.asteroids = self.physics.add.group();
  self.overlap = self.physics.add.overlap(ship, self.asteroids, crash, null, self)
  self.overlap.name = self.socket.id
  ship.setMaxVelocity(150, 150)
  self.ship = ship
}

function addOtherPlayers(self, playerInfo){
  const otherPlayer = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'ship', 0);
  otherPlayer.shieldLevel = 0
  otherPlayer.setMaxVelocity(150, 150)
  self.otherPlayers[playerInfo.playerId] = otherPlayer
}

function resetPlayer(player) {
  setTimeout(() => {
    player.enableBody(true, player.body.x, player.body.y, true, true)
    player.setTexture('ship')
    socket.emit('enablePlayer', socket.id)
    pauseCollider(player)
  }, 500)
}

export {addPlayer, addOtherPlayers, resetPlayer}