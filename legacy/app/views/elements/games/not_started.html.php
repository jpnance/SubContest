<div id="<?= $game->_id; ?>" class="game not-started <?= ($game->isPickedBy($username) ? 'picked ' . ($game->picks[$username] == $game->awayTeam->abbreviation ? 'away-team' : 'home-team') : 'not-picked'); ?>">
	<div class="kickoff">
		<?= date('l', $game->kickoffTime()); ?> at <?= date('g:ia', $game->kickoffTime()); ?> ET
	</div>
	<div class="teams">
		<?php if (isset($username)): ?>
			<div class="team away-team <?= $this->team->className($game->awayTeam()); ?>">
				<?= $this->view()->render(array('element' => 'teams/pick_link'), array('game' => $game, 'team' => $game->awayTeam(), 'username' => $username)); ?>
			</div>
			<div class="team home-team <?= $this->team->className($game->homeTeam()); ?>">
				<?= $this->view()->render(array('element' => 'teams/pick_link'), array('game' => $game, 'team' => $game->homeTeam(), 'username' => $username)); ?>
				<span class="line"><?= $this->game->line($game->line); ?></span>
				<?php if ($this->user->isAdmin()): ?>
					<?= $this->form->text('line', ['class' => 'edit-line', 'value' => $game->line]); ?>
				<?php endif; ?>
			</div>
		<?php else: ?>
			<div class="team <?= $this->team->className($game->awayTeam()); ?>"><?= $this->team->name($game->awayTeam()); ?></div>
			<div class="team <?= $this->team->className($game->homeTeam()); ?>"><?= $this->team->name($game->homeTeam()); ?> <span class="line"><?= $this->game->line($game->line); ?></span></div>
		<?php endif; ?>
	</div>
	<?php if ($this->user->isAdmin()): ?>
		<div class="edit-game">
			<a href="#" class="edit">Edit Game</a>
			<?= $this->html->link('Save', '/games/edit/' . $game->_id, ['class' => 'save']); ?>
			<a href="#" class="cancel">Cancel</a>
		</div>
	<?php endif; ?>
</div>
