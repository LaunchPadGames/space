module.exports = function(io, room, listener, data){
  return function(){
    io.sockets.in(room).emit(listener, data)
  }
}