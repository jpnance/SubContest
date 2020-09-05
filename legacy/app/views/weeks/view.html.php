<?php $this->title('Week ' . $week); ?>
<?= $this->view()->render(array('element' => 'week_navigation'), compact('week')); ?>
<?php foreach ($games as $game): ?>
	<?php if ($game->isFinal()): ?>
		<?= $this->view()->render(array('element' => 'games/final'), compact('game', 'username')); ?>
	<?php elseif ($game->hasStarted()): ?>
		<?= $this->view()->render(array('element' => 'games/started'), compact('game', 'username')); ?>
	<?php else: ?>
		<?= $this->view()->render(array('element' => 'games/not_started'), compact('game', 'username')); ?>
	<?php endif; ?>
<?php endforeach; ?>
