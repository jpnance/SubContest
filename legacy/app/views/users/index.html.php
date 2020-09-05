<?php $this->title('All Users'); ?>
<ul id="user-list">
<?php foreach ($users as $user): ?>
	<li><?= $this->html->link($user->firstName . ' ' . $user->lastName, '/users/edit/' . $user->username); ?></li>
<?php endforeach; ?>
</ul>
