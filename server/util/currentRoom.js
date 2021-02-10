module.exports = function(io, socket) {
  return Object.keys(io.sockets.adapter.sids[socket.id])[1]
}