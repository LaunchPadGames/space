class PowerupQueue {
  constructor(){
    this.queue = []
    this.size = 0
  }

  enqueue(powerup_id) {
    this.queue[this.size]= powerup_id
    this.size++
  }

  dequeue() {
    if(this.size > 0){
      let id = this.first()
      this.queue = this.queue.slice(1, this.queue.length)
      this.size--
  
      return id
    } else {
      return null
    }
  }

  first(){
    return this.queue[0]
  }
}

module.exports = {
  PowerupQueue
}