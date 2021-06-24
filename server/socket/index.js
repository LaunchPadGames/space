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
    let playerData = await createGameAndPlayers(roomTag, allowedPlayersCount, socket)
    let currentPlayersCount = playerData['currentPlayersCount']
    let playerLimit = playerData['playerLimit']
    
    if (currentPlayersCount > playerLimit) {
      socket.emit('inProgress');
    } else {
      // Method 2
      console.log('a user connected');
      const room = currentRoom(io, socket)
      console.log('ROOM!!!!!!!!!!!!!!!!!!!!!!!: ', room)
      let redisGame = await redisGetter(roomTag)
      redisGame['players'][socket.id] = createPlayer(socket, currentPlayersCount)
      await redisSetter(roomTag, redisGame)
      
      // send the players object to the new player
      socket.emit('currentPlayers', redisGame['players']);

      // update all other players of the new player
      socket.to(room).broadcast.emit('newPlayer', redisGame['players'][socket.id]);
      
      if (currentPlayersCount !== playerLimit) {
        let base_url = process.env.BASE_URL || 'http://localhost:3000'
        
        socket.emit('waitingForPlayers', { roomTag: roomTag, time: redisGame['time'], baseUrl: base_url });
      } else {
        const asteroidData = createAsteroids()
        redisGame = await redisGetter(roomTag)
        redisGame['asteroids'] = asteroidData['asteroidHash']
        let intervalId = setInterval(async function(){
          let redisGame = await redisGetter(roomTag)
          if(redisGame['time'] === 0) clearInterval(redisGame['intervalId'])
          redisGame['time'] = redisGame['time'] - 1
          redisSetter(roomTag, redisGame)
          io.sockets.in(room).emit('updateTimer', redisGame['time']);
        }, 1000)
        redisGame['intervalId'] = intervalId[Symbol.toPrimitive]()
        redisSetter(roomTag, redisGame)
        io.sockets.in(room).emit('createAsteroids', asteroidData['asteroidArray'])
      }
      socket.on('disconnect', async function () {
        console.log('user disconnected');
        // remove this player from our players object
        redisGame = await redisGetter(roomTag)
        delete redisGame['players'][socket.id]
        redisSetter(roomTag, redisGame)
        // emit a message to all players to remove this player
        io.sockets.in(room).emit('disconnect', socket.id);
      });
      require('./players')(socket, room, roomTag)

      require('./lasers')(socket, room, roomTag)
      require('./asteroids')(io, socket, room, roomTag)

      require('./powerUps')(io, socket, room, roomTag)
      // Method 2
    }
  })
};