import {clearStartScreen} from './displays.mjs'
import startSocketActions from './sockets.mjs'

export default function update(time) {
  if (!this.hasJoined) {
    if (this.cursors.up.isDown) {
      this.selector.y = this.selectorYPos1
    }
    if (this.cursors.down.isDown) {
      this.selector.y = this.selectorYPos2
    }
    if (this.cursors.space.isDown) {
      this.hasJoined = true
      clearStartScreen(this)
      const allowedPlayersCount = this.selector.y === this.selectorYPos1 ? 1 : 2
      startSocketActions(this, allowedPlayersCount)
    }
  } 
  else if (this.hasGameStarted) {
    if (this.ship) {
      if (this.cursors.up.isDown) {
        this.physics.velocityFromRotation(this.ship.rotation, 100, this.ship.body.acceleration);
      }
      else if (this.cursors.down.isDown) {
        this.physics.velocityFromRotation(this.ship.rotation, -100, this.ship.body.acceleration);
      }
      else {
        this.ship.setAcceleration(0);
      }

      if (this.cursors.left.isDown) {
        this.ship.setAngularVelocity(-300);
      }
      else if (this.cursors.right.isDown) {
        this.ship.setAngularVelocity(300);
      }
      else {
        this.ship.setAngularVelocity(0);
      }

      if (this.cursors.space.isDown && time > this.lastFired + 200 && this.ship.body.enable) {
        this.laserGroup.fireLaser(this.ship.x, this.ship.y, this.ship.rotation, this);
        this.lastFired = time;
      }

      if (this.ship.x < 0) this.ship.x = this.canvasWidth
      if (this.ship.x > this.canvasWidth) this.ship.x = 0
      if (this.ship.y < 0) this.ship.y = this.canvasHeight
      if (this.ship.y > this.canvasHeight) this.ship.y = 0

      let x = this.ship.x
      let y = this.ship.y
      let r = this.ship.rotation

      if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)) {
        this.socket.emit('playerMovement', { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation })
      }

      this.ship.oldPosition = {
        x: this.ship.x,
        y: this.ship.y,
        rotation: this.ship.rotation
      }
    }
  }

  if(this.asteroids){
    this.asteroids.children.entries.forEach((asteroid) => {
      if (asteroid.x < 0) asteroid.x = this.canvasWidth
      if (asteroid.x > this.canvasWidth) asteroid.x = 0
      if (asteroid.y < 0) asteroid.y = this.canvasHeight
      if (asteroid.y > this.canvasHeight) asteroid.y = 0
    })
  }
}