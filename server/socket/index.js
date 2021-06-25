const { 
  createPlayer, 
  createAsteroids, 
  tagGenerator,
  roomTagParser,
  currentRoom,
  redisSetter,
  redisGetter,
} = require('../util');
const { CreateGame, CreatePlayer } = require('../services')

module.exports = io => {
  io.on('connection', async function (socket) {
    console.log('a user connected');
    const roomTag = roomTagParser(socket) || tagGenerator()
    const allowedPlayersCount = parseInt(socket.handshake.query.allowedPlayersCount)
    console.log('CreateGame: ', CreateGame)
    let createGame = new CreateGame(roomTag, allowedPlayersCount)
    let game = await createGame.run()
    let createPlayer = new CreatePlayer(roomTag, game, socket)
    await createPlayer.run()
    const currentPlayersCount = await createPlayer.playersCount()

    const room = currentRoom(io, socket)
    socket.join(room)
    require('./players')(socket, room, roomTag)

    require('./lasers')(socket, room, roomTag)
    require('./asteroids')(io, socket, room, roomTag)

    require('./powerUps')(io, socket, room, roomTag)
    
    if (currentPlayersCount > game.dataValues.playerLimit) {
      socket.emit('inProgress');
    } else {
      // Method 2
      await setupUserGameEnvironment(io, socket, roomTag, room)
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
      // Method 2
    }
  })
};