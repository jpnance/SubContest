<?php $this->title('Edit User'); ?>
<h2>Editing <?= $user->firstName; ?> <?= $user->lastName; ?></h2>
<?= $this->form->create($user); ?>
	<?= $this->form->field('_id', array('type' => 'hidden')); ?>
	<?php if ($this->user->isAdmin()): ?>
		<?= $this->form->field('nickname', ['label' => 'Change Nickname', 'type' => 'text']); ?>
	<?php endif; ?>
	<?= $this->form->field('password', array('type' => 'password')); ?>
	<?= $this->form->field('password1', array('label' => 'Change Password', 'type' => 'password')); ?>
	<?= $this->form->field('password2', array('label' => 'Confirm Password', 'type' => 'password')); ?>
	<?php if ($this->user->isAdmin()): ?>
		<?= $this->form->field('eligible', [
			'label' => 'Eligible for the ' . $this->date->getSeason() . ' season?',
			'checked' => $user->isEligibleFor($this->date->getSeason()),
			'type' => 'checkbox'
		]); ?>
	<?php endif; ?>
	<?= $this->form->submit('Edit me'); ?>
<?= $this->form->end(); ?>
