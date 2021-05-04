export default function destroyAsteroid(laser, asteroid) {
  asteroid.disableBody(true, true);
  if (laser.texture.key === 'laserGreen') {
    socket.emit('destroyAsteroid', {asteroidIndex: asteroid.index, laser: true, x: asteroid.x, y: asteroid.y})
  }
  laser.destroy()
}