<div id="season-navigation">
	<?php if ($season > 2012): ?>
		<?= $this->html->link($season - 1, '/standings/' . ($season - 1), array('class' => 'previous season')); ?>
	<?php endif; ?>

	<span class="current season"><?= $season; ?></span>

	<?php if ($season < $this->date->getSeason()): ?>
		<?= $this->html->link($season + 1, '/standings/' . ($season + 1), array('class' => 'next season')); ?>
	<?php endif; ?>
</div>
