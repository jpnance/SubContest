$(document).ready(function() {
	$('div.team a').click(pickGame);
	$('div.edit-game a.edit').click(showGameEdit);
	$('div.edit-game a.save').click(editGame);
	$('div.edit-game a.cancel').click(hideGameEdit);

	$('input[name=username]').focus();
});

function editGame(e) {
	var $this = $(this);
	var $game = $this.closest('.game');

	e.preventDefault();

	var newLine = $game.find('input.edit-line').val();

	if (isNaN(newLine)) {
		hideGameEdit(e);
	}

	$.getJSON($this.attr('href') + '.json', { line: newLine }, updateInterface);

	console.log($this.attr('href'), newLine);
}

function hideGameEdit(e) {
	var $game = $(e.target).closest('.game');

	e.preventDefault();

	$game.removeClass('edit');
}

function pickGame(e) {
	var $this = $(this);

	$.getJSON($this.attr('href') + '.json', updateInterface);

	return false;
}

function showGameEdit(e) {
	var $game = $(e.target).closest('.game');

	e.preventDefault();

	$game.addClass('edit');
}

function updateInterface(data) {
	if (data.success) {
		var gameId = data.game._id;
		var game = $('div#' + gameId);

		if (data.action == 'pick') {
			var pick = data.pick;

			game.addClass('picked');
			game.removeClass('not-picked');

			if (pick == data.game.awayTeam.abbreviation) {
				game.addClass('away-team');
				game.removeClass('home-team');
			}
			else if (pick == data.game.homeTeam.abbreviation) {
				game.addClass('home-team');
				game.removeClass('away-team');
			}
		}
		else if (data.action == 'unpick') {
			game.addClass('not-picked');
			game.removeClass('picked');
			game.removeClass('away-team');
			game.removeClass('home-team');
		}
		else if (data.action == 'edit') {
			var displayLine;

			if (!data.game.line) {
				displayLine = '--';
			}
			else if (data.game.line == 0) {
				displayLine = 'PK';
			}
			else {
				displayLine = parseFloat(data.game.line).toFixed(1);

				if (parseFloat(data.game.line) > 0) {
					displayLine = '+' + displayLine;
				}
			}

			game.find('span.line').text(displayLine);
			game.removeClass('edit');
		}
	}
	else {
		alert(data.error);
	}
}
