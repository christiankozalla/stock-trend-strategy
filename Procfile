# For Development only
# Used with [Hivemind](https://evilmartians.com/opensource/hivemind)
# Install Hivemind and run from the project root to start development

docker: cd app && docker compose up
frontend: cd frontend && npm run dev
api: cd app/server && poetry run uvicorn main:app --reload
caddy: caddy run --config app/Caddyfile
