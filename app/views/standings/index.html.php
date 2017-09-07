<?php $this->title('Standings'); ?>
<?= $this->view()->render(array('element' => 'season_navigation'), compact('season')); ?>
<table id="standings">
	<tr>
		<th>Player</th>
		<th class="score">Score</th>
		<?php if ($this->standings->showPicks($standings)): ?>
			<th class="week" colspan="5">Picks in Week <?= $week; ?></th>
		<?php endif; ?>
	</tr>
	<?php foreach ($standings as $username => $standing): ?>
		<tr>
			<td><?= $standing['name']; ?></td>
			<td class="score"><?= $this->standings->score($standing['score']); ?></td>
			<?php if ($this->standings->showPicks($standings)): ?>
				<?php foreach ($standing['currentPicks'] as $currentPick): ?>
					<td class="pick <?= $currentPick['result']; ?>"><?= $currentPick['pick']; ?></td>
				<?php endforeach; ?>
				<?php if ($standing['hiddenPicks'] > 0): ?>
					<?php foreach(range(1, $standing['hiddenPicks']) as $n): ?>
						<td class="pick hidden"></td>
					<?php endforeach; ?>
				<?php endif; ?>
			<?php endif; ?>
		</tr>
	<?php endforeach; ?>
</table>
