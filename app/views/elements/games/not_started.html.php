<div id="<?= $game->_id; ?>" class="game not-started <?= ($game->isPickedBy($username) ? 'picked ' . ($game->picks[$username] == $game->awayTeam->abbreviation ? 'away-team' : 'home-team') : 'not-picked'); ?>">
	<div class="kickoff">
		<?= date('l', $game->kickoff->sec); ?> at <?= date('g:ia', $game->kickoff->sec); ?> ET
	</div>
	<div class="teams">
		<?php if (isset($username)): ?>
			<div class="team away-team <?= $this->team->className($game->awayTeam()); ?>"><?= $this->view()->render(array('element' => 'teams/pick_link'), array('game' => $game, 'team' => $game->awayTeam(), 'username' => $username)); ?></div>
			<div class="team home-team <?= $this->team->className($game->homeTeam()); ?>"><?= $this->view()->render(array('element' => 'teams/pick_link'), array('game' => $game, 'team' => $game->homeTeam(), 'username' => $username)); ?> <span class="line"><?= $this->game->line($game->line); ?></span></div>
		<?php else: ?>
			<div class="team <?= $this->team->className($game->awayTeam()); ?>"><?= $this->team->name($game->awayTeam()); ?></div>
			<div class="team <?= $this->team->className($game->homeTeam()); ?>"><?= $this->team->name($game->homeTeam()); ?> <span class="line"><?= $this->game->line($game->line); ?></span></div>
		<?php endif; ?>
	</div>
</div>
