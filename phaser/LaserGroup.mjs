import Laser from './laser.mjs'

export default class LaserGroup extends Phaser.Physics.Arcade.Group
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

  fireLaser(x, y, r, self) {
    const laser = this.getFirstDead(true, x, y, 'laserGreen');
    let ship = this.scene.ship
    if (laser) {
      laser.fire(x, y, r, self);
      if (ship.spray) {
        for(let i = 0; i <= 3; i++) {
          const laser = this.getFirstDead(true, x, y, 'laserGreen');
          laser.fire(x, y, r + self.angles[i], self);
        }
      }
    }
  }
}