$(document).ready(function() {
	$('div.team a').click(pickGame);

	$('input[name=username]').focus();
});

function pickGame(e) {
	var $this = $(this);

	$.getJSON($this.attr('href') + '.json', updateInterface);

	return false;
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
	}
	else {
		alert(data.error);
	}
}
