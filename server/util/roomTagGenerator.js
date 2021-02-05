require('dotenv').config()

module.exports = function(){
  let result = ''
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  for(let i = 0; i <= parseInt(process.env.ROOM_TAG_LENGTH); i++){
    result += chars[Math.floor(Math.random() * chars.length)]
  }

  return result
}