import {destroyAsteroid} from './asteroid.mjs'

export default class Laser extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, sprite = 'laserGreen') {
    super(scene, x, y, sprite);
  }

  fire(x, y, r, emit = true) {
    this.body.reset(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setAngle(r)
    this.setScale(0.5)
    this.scene.physics.add.overlap(this, this.scene.asteroids, destroyAsteroid);
    this.scene.physics.velocityFromRotation(r, 400, this.body.velocity);
    if (emit && this.scene.socket) this.scene.socket.emit('laserShot', { x: x, y: y, rotation: r })
  }
}