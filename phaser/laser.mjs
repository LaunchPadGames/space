import {destroyAsteroid} from './asteroid.mjs'

class LaserGroup extends Phaser.Physics.Arcade.Group
{
  constructor(scene) {
    super(scene.physics.world, scene);
    this.createMultiple({
      classType: Laser,
      frameQuantity: 30, // 30 instances of Laser
      active: false,
      visible: false,
      key: 'laserGreen'
    })
  }

  fireLaser(x, y, r) {
    const laser = this.getFirstDead(true, x, y, 'laserGreen');
    let ship = this.scene.ship
    if (laser) {
      laser.fire(x, y, r);
      if (ship.spray) {
        for(let i = 0; i <= 3; i++) {
          const laser = this.getFirstDead(true, x, y, 'laserGreen');
          laser.fire(x, y, r + angles[i]);
        }
      }
    }
  }
}

class Laser extends Phaser.Physics.Arcade.Sprite {
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

export {LaserGroup, Laser}