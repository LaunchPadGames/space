module.exports = function() {
  asteroidArray = []
  asteroidHash = {}
  for(let i = 0; i < 12; i++){
    asteroidArray.push({
      x: Math.floor(Math.random() * 800),
      y: Math.floor(Math.random() * 600),
      index: i,
      scale: Math.random() * (3 - 0.5) + 0.5,
      xVel: Math.ceil(Math.random() * 50) * (Math.round(Math.random()) ? 1 : -1),
      yVel: Math.ceil(Math.random() * 50) * (Math.round(Math.random()) ? 1 : -1)
    })
    asteroidHash[i] = true
  }

  return { asteroidArray: asteroidArray, asteroidHash: asteroidHash }
}