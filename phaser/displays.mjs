function clearStartScreen() {
  startScreen.forEach((pageElement) => pageElement.destroy())
}

function updateScoreText() {
  scoreText.setText('Your Score: ' + score);
  scoreTextOther.setText('Opponent Score: ' + scoreOther);
}

function getTimerDisplay(time) {
  let minutes = Math.floor(time / 60)
  let remainingSeconds = time % 60
  let seconds = (remainingSeconds < 10) ? '0' + remainingSeconds : remainingSeconds
  return minutes + ':' + seconds
}

function displayWaitScreen(self, gameData) {
  timerDisplay.setText(getTimerDisplay(gameData['time']));
  waitingText = self.add.text(500, 300, 'Waiting for other player to join...'.toUpperCase(), { fontSize: '32px' })
  roomTagInstructionsText = self.add.text(500, 420, 'Send the other player this url:', { fontSize: '28px' })
  waitingText.setOrigin(0.5)
  roomTagInstructionsText.setOrigin(0.5)
  roomTagText = document.createElement("P")
  roomTagText.innerText = gameData['baseUrl'] + '?room_tag=' + gameData['roomTag']
  roomTagText.classList.add("room-tag")
  let canvas = document.getElementsByTagName('canvas')[0]
  document.body.appendChild(roomTagText)
}

function clearWaitScreen() {
  if (waitingText) {
    waitingText.destroy()
    roomTagInstructionsText.destroy()
    roomTagText.parentNode.removeChild(roomTagText)
    // roomTagText.destroy()
  }
}

function getOutcome() {
  if (score > scoreOther) return 'You Win!'
  if (score === scoreOther) return 'You Tied!'
  return 'You Lose!'
}
