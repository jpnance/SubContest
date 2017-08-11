<?php $this->title('Edit User'); ?>
<h2>Editing <?= $user->firstName; ?> <?= $user->lastName; ?></h2>
<?= $this->form->create($user); ?>
	<?= $this->form->field('_id', array('type' => 'hidden')); ?>
	<?= $this->form->field('password', array('type' => 'password')); ?>
	<?= $this->form->field('password1', array('label' => 'Change Password', 'type' => 'password')); ?>
	<?= $this->form->field('password2', array('label' => 'Confirm Password', 'type' => 'password')); ?>
	<?= $this->form->submit('Edit me'); ?>
<?= $this->form->end(); ?>
