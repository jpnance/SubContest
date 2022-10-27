ci:
	docker run --rm -v $(PWD):/app node:14-alpine sh -c "cd /app && npm ci"

lines:
	docker exec -it subcontest-cron sh -c "node /app/bin/lines.js update"

seed:
	@echo "Use something like:"
	@echo "docker exec -i subcontest-mongo sh -c \"mongorestore --drop --archive\" < ~/backups/subcontest/subcontest.dump"
