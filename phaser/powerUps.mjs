function rateOfFirePowerup(ship, powerup) {
  if(powerup){
    console.log('rateOfFirePowerup emitter')
    socket.emit('destroyPowerup', powerup.id, 'silver_powerup')
    powerup.destroy()
  }
}

function sprayPowerup(ship, powerup) {
  if(powerup){
    console.log('sprayPowerup emitter')
    socket.emit('destroyPowerup', powerup.id, 'gold_powerup')
    powerup.destroy()
  }
}

function shieldPowerup(ship, powerup) {
  if(powerup){
    console.log('shieldPowerup emitter')
    socket.emit('destroyPowerup', powerup.id, 'shield_powerup')
    powerup.destroy()
  }
}

function updateShieldPowerUp(player){
  if(player.shieldLevel === 2){
    player.setTexture('ship_shield1')
  } else if(player.shieldLevel === 1){
    player.setTexture('ship_shield2')
  } else{
    player.setTexture('ship')
  }
}

function speedPowerup(ship, powerup) {
  if(powerup){
    console.log('speed emitter')
    socket.emit('destroyPowerup', powerup.id, 'star_powerup')
    powerup.destroy()
  }
}