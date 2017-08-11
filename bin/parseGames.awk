#!/usr/bin/awk -f

# awk -f parseGames.awk ../data/games.txt > ../data/games.js 

BEGIN {
	FS="	"
}

{
	printf "db.games.save({ \"awayTeam\": { \"abbreviation\": \"" $2 "\" }, \"homeTeam\": { \"abbreviation\": \"" $1 "\" }, \"kickoff\": ISODate(\"" $5 "\"), "

	if ($8 != "\N")
		printf "\"line\": " $8 ", "

	printf "\"season\": " $3 ", \"week\": " $4 " });\n"
}
