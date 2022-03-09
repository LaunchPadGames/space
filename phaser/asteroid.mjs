import { resetPlayer } from './players.mjs'

function crash(player, asteroid){
  asteroid.destroy()
  let socket = this.socket
  socket.emit('destroyAsteroid', {asteroidIndex: asteroid.index, laser: false})
  if (player.shieldLevel === 0) {
    player.disableBody(true, true);
    socket.emit('disablePlayer', socket.id)
    resetPlayer(player, this)
  } else {
    player.shieldLevel -= 1;
    let texture = player.shieldLevel === 0 ? 'ship' : 'ship_shield2'
    player.setTexture(texture)
    socket.emit('shieldUpdate', {socketId: player.playerId, shieldLevel: player.shieldLevel})
  }
}

function pauseCollider(player, self) {
  setTimeout(() => {
    let overlap = self.physics.add.overlap(player, self.asteroids, crash, null, self)
    overlap.name = self.socket.id
  }, 2000)
  const collider = self.physics.world.colliders.getActive().find(function(collider){
    return collider.name === self.socket.id
  })
  collider.destroy()
}


function destroyAsteroid(laser, asteroid, self) {
  asteroid.disableBody(true, true);
  if (laser.texture.key === 'laserGreen') {
    this.socket.emit('destroyAsteroid', {asteroidIndex: asteroid.index, laser: true, x: asteroid.x, y: asteroid.y})
  }
  laser.destroy()
}

export {crash, pauseCollider, destroyAsteroid}