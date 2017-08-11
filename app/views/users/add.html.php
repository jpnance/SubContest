<?php $this->title('Add User'); ?>
<?php if ($user): ?>
<h2>Add user</h2>
<?= $this->form->create($user); ?>
	<?= $this->form->field('username'); ?>
	<?= $this->form->field('password', array('type' => 'password')); ?>
	<?= $this->form->field('firstName', array('label' => 'First Name')); ?>
	<?= $this->form->field('lastName', array('label' => 'Last Name')); ?>
	<?= $this->form->field('nickname'); ?>
	<?= $this->form->submit('Create me'); ?>
<?= $this->form->end(); ?>
<?php endif; ?>
