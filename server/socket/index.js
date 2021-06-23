const { 
  createPlayer, 
  createAsteroids, 
  tagGenerator,
  roomTagParser,
  currentRoom,
  redisSetter,
  redisGetter,
  createGameAndPlayers
} = require('../util');

module.exports = io => {
  io.on('connection', async function (socket) {
    const roomTag = roomTagParser(socket) || tagGenerator()
    const allowedPlayersCount = parseInt(socket.handshake.query.allowedPlayersCount)
    let currentPlayersCount, playerLimit = createGameAndPlayers(roomTag, allowedPlayersCount, socket)
    
    if (currentPlayersCount > playerLimit) {
      socket.emit('inProgress');
    } else {
      // Method 2
      console.log('a user connected');
      const room = currentRoom(io, socket)
      let redisGame = await redisGetter(room)
      redisGame['players'][socket.id] = createPlayer(socket, currentPlayersCount)
      console.log('player: ', redisGame['players'])
      await redisSetter(room, redisGame)
      
      // send the players object to the new player
      socket.emit('currentPlayers', redisGame['players']);

      // update all other players of the new player
      socket.to(room).broadcast.emit('newPlayer', redisGame['players'][socket.id]);
      if (currentPlayersCount !== playerLimit) {
        let base_url = process.env.BASE_URL || 'http://localhost:3000'
        
        socket.emit('waitingForPlayers', { roomTag: roomTag, time: redisGame['time'], baseUrl: base_url });
      } else {
        const asteroidData = createAsteroids()
        redisGame = await redisGetter(room)
        redisGame['asteroids'] = asteroidData['asteroidHash']
        let intervalId = setInterval(async function(){
          let redisGame = await redisGetter(room)
          if(redisGame['time'] === 0) clearInterval(redisGame['intervalId'])
          redisGame['time'] = redisGame['time'] - 1
          redisSetter(room, redisGame)
          io.sockets.in(room).emit('updateTimer', redisGame['time']);
        }, 1000)
        redisGame['intervalId'] = intervalId[Symbol.toPrimitive]()
        redisSetter(room, redisGame)
        io.sockets.in(room).emit('createAsteroids', asteroidData['asteroidArray'])
      }
      socket.on('disconnect', async function () {
        console.log('user disconnected');
        // remove this player from our players object
        redisGame = await redisGetter(room)
        delete redisGame['players'][socket.id]
        redisSetter(room, redisGame)
        // emit a message to all players to remove this player
        io.sockets.in(room).emit('disconnect', socket.id);
      });
      require('./players')(socket, room)

      require('./lasers')(socket, room)
      require('./asteroids')(io, socket, room)

      require('./powerUps')(io, socket, room)
      // Method 2
    }
  })
};