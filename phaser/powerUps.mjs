function rateOfFirePowerup(self, powerup) {
  if(powerup){
    console.log('rateOfFirePowerup emitter')
    self.socket.emit('destroyPowerup', powerup.id, 'silver_powerup')
    powerup.destroy()
  }
}

function sprayPowerup(self, powerup) {
  if(powerup){
    console.log('sprayPowerup emitter')
    self.socket.emit('destroyPowerup', powerup.id, 'gold_powerup')
    powerup.destroy()
  }
}

function shieldPowerup(self, powerup) {
  if(powerup){
    console.log('shieldPowerup emitter')
    self.socket.emit('destroyPowerup', powerup.id, 'shield_powerup')
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

function speedPowerup(self, powerup) {
  if(powerup){
    console.log('speed emitter')
    self.socket.emit('destroyPowerup', powerup.id, 'star_powerup')
    powerup.destroy()
  }
}

export {rateOfFirePowerup, sprayPowerup, shieldPowerup, updateShieldPowerUp, speedPowerup}