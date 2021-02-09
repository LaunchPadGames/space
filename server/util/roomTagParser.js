module.exports = function(socket){
  const url = new URL(socket.handshake.headers.referer)
  const params = url.searchParams

  return params.get('room_tag') || null
}