export default function endGame(self) {
  self.hasGameStarted = false
  self.ship.destroy()
  Object.values(self.otherPlayers).forEach((player) => player.destroy())
  self.timerDisplay.destroy()
  let gameOverText = self.add.text(500, 300, 'Times Up:'.toUpperCase(), { fontSize: '32px' })
  let outcomeText = self.add.text(500, 340, getOutcome(self).toUpperCase(), { fontSize: '32px' })
  self.gameOverText.setOrigin(0.5)
  self.outcomeText.setOrigin(0.5)
  self.scoreText.setOrigin(0.5)
  self.scoreText.setPosition(500, 400)
  self.scoreTextOther.setOrigin(0.5)
  self.scoreTextOther.setPosition(500, 420)
}