<div class="game started <?= $game->isPickedBy($username) ? 'picked' : ''; ?>">
	<div class="status">
		<?= date('l', $game->kickoff->sec); ?> at <?= date('g:ia', $game->kickoff->sec); ?> ET
	</div>
	<div class="teams">
		<div class="team <?= $this->team->className($game->awayTeam()); ?> <?= $game->isPickedBy($username) && $game->picks[$username] == $game->awayTeam->abbreviation ? 'pick' : ''; ?>"><?= $this->team->name($game->awayTeam()); ?></div>
		<div class="team <?= $this->team->className($game->homeTeam()); ?> <?= $game->isPickedBy($username) && $game->picks[$username] == $game->homeTeam->abbreviation ? 'pick' : ''; ?>"><?= $this->team->name($game->homeTeam()); ?> <span class="line"><?= $this->game->line($game->line); ?></span></div>
	</div>
	<?= $this->view()->render(array('element' => 'games/picks'), compact('game')); ?>
</div>
