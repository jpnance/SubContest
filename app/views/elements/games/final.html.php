<div class="game final <?= $game->wasWonBy($username) ? 'picked won' : ($game->wasPushedBy($username) ? 'picked pushed' : ($game->wasLostBy($username) ? 'picked lost' : '')); ?>">
	<div class="final">Final</div>
	<div class="scores">
		<div class="score"><?= $game->awayTeam->score; ?></div>
		<div class="score"><?= $game->homeTeam->score; ?></div>
	</div>
	<div class="teams">
		<div class="team <?= $game->isPickedBy($username) && $game->picks[$username] == $game->awayTeam->abbreviation ? 'pick' : ''; ?> <?= $this->team->className($game->awayTeam()); ?>"><?= $this->team->name($game->awayTeam()); ?></div>
		<div class="team <?= $game->isPickedBy($username) && $game->picks[$username] == $game->homeTeam->abbreviation ? 'pick' : ''; ?> <?= $this->team->className($game->homeTeam()); ?>"><?= $this->team->name($game->homeTeam()); ?> <span class="line"><?= $this->game->line($game->line); ?></div>
	</div>
	<?= $this->view()->render(array('element' => 'games/picks'), compact('game')); ?>
</div>
