<div id="week-navigation">
	<?php if ($week == 17): ?>
		<?= $this->html->link('Week 15', '/weeks/view/15', array('class' => 'previous week')); ?>
	<?php endif; ?>

	<?php if ($week > 1): ?>
		<?= $this->html->link('Week ' . ($week - 1), '/weeks/view/' . ($week - 1), array('class' => 'previous week')); ?>
	<?php endif; ?>

	<span class="current week">Week <?= $week; ?></span>

	<?php if ($week < 17): ?>
		<?= $this->html->link('Week ' . ($week + 1), '/weeks/view/' . ($week + 1), array('class' => 'next week')); ?>
	<?php endif; ?>

	<?php if ($week == 1): ?>
		<?= $this->html->link('Week 3', '/weeks/view/3', array('class' => 'previous week')); ?>
	<?php endif; ?>
</div>
