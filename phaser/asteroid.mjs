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

function pauseCollider(player) {
  setTimeout(() => {
    overlap = physics.add.overlap(player, asteroids, crash, null, this)
    overlap.name = socket.id
  }, 2000)
  const collider = physics.world.colliders.getActive().find(function(collider){
    return collider.name === socket.id
  })
  collider.destroy()
}


function destroyAsteroid(laser, asteroid) {
  asteroid.disableBody(true, true);
  if (laser.texture.key === 'laserGreen') {
    socket.emit('destroyAsteroid', {asteroidIndex: asteroid.index, laser: true, x: asteroid.x, y: asteroid.y})
  }
  laser.destroy()
}

export {crash, pauseCollider, destroyAsteroid}