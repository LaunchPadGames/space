module.exports = function(socket, currentPlayersCount) {
  return {
    rotation: 0,
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    playerId: socket.id,
    primary: currentPlayersCount === 1,
    score: 0,
  }
}