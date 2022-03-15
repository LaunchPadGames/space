class PowerupQueue {
  contructor(){
    this.queue = []
    this.size = 0
  }

  enqueue(powerup_id) {
    this.queue[this.size]= powerup_id
    this.size++
  }

  dequeue() {
    let id = first()
    this.queue = this.queue.slice(1, array.length)
    this.size--

    return id
  }

  first(){
    return this.queue[0]
  }
}

module.exports = {
  PowerupQueue
}