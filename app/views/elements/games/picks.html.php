<table class="picks">
	<tr class="away-picks">
		<th class="<?= isset($game->push) ? 'push' : (isset($game->winner) ? (($game->winner == $game->awayTeam->abbreviation) ? 'winner' : 'loser') : ''); ?>"><?= $game->awayTeam->abbreviation; ?></th>
		<td>
			<?php foreach ($game->awayTeam->picks as $name): ?>
				<span class="name"><?= $name; ?></span>
			<?php endforeach; ?>
		</td>
	</tr>
	<tr class="home-picks">
		<th class="<?= isset($game->push) ? 'push' : (isset($game->winner) ? (($game->winner == $game->homeTeam->abbreviation) ? 'winner' : 'loser') : ''); ?>"><?= $game->homeTeam->abbreviation; ?></th>
		<td>
			<?php foreach ($game->homeTeam->picks as $name): ?>
				<span class="name"><?= $name; ?></span>
			<?php endforeach; ?>
		</td>
	</tr>
</table>
