module.exports = function(socket) {
  return Object.keys(socket.adapter.rooms)[1]
}