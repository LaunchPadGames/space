function clearStartScreen(self) {
  self.startScreen.forEach((pageElement) => pageElement.destroy())
}

function updateScoreText(self) {
  self.scoreText.setText('Your Score: ' + self.score);
  self.scoreTextOther.setText('Opponent Score: ' + self.scoreOther);
}

function getTimerDisplay(time) {
  let minutes = Math.floor(time / 60)
  let remainingSeconds = time % 60
  let seconds = (remainingSeconds < 10) ? '0' + remainingSeconds : remainingSeconds
  return minutes + ':' + seconds
}

function displayWaitScreen(self, gameData) {
  self.timerDisplay.setText(getTimerDisplay(gameData['time']));
  self.waitingText = self.add.text(500, 300, 'Waiting for other player to join...'.toUpperCase(), { fontSize: '32px' })
  self.roomTagInstructionsText = self.add.text(500, 420, 'Send the other player this url:', { fontSize: '28px' })
  self.waitingText.setOrigin(0.5)
  self.roomTagInstructionsText.setOrigin(0.5)
  self.roomTagText = document.createElement("P")
  self.roomTagText.innerText = gameData['baseUrl'] + '?room_tag=' + gameData['roomTag']
  self.roomTagText.classList.add("room-tag")
  self.canvas = document.getElementsByTagName('canvas')[0]
  document.body.appendChild(self.roomTagText)
}

function clearWaitScreen(self) {
  if (self.waitingText) {
    self.waitingText.destroy()
    self.roomTagInstructionsText.destroy()
    self.roomTagText.parentNode.removeChild(self.roomTagText)
    self.roomTagText.destroy()
  }
}

function getOutcome() {
  if (self.score > self.scoreOther) return 'You Win!'
  if (self.score === self.scoreOther) return 'You Tied!'
  return 'You Lose!'
}

export {clearStartScreen, updateScoreText, getTimerDisplay, displayWaitScreen, clearWaitScreen, getOutcome}
