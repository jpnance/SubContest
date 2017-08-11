<?= $this->html->link($this->team->name($team), 'games/unpick/' . $game->_id, array('id' => $team->abbreviation, 'class' => 'picked')); ?>
<?= $this->html->link($this->team->name($team), 'games/pick/' . $game->_id . '/' . $team->abbreviation, array('id' => $team->abbreviation, 'class' => 'not-picked')); ?>
