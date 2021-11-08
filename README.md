# Cluebot
A bot host for a collaborative question game about remote work

Used by [cluebot](https://github.com/balena-io-playground/cluebot), which interacts with Flowdock.

# Development

- Node version: 14
- PostgreSQL version: 13

```
npm install
npm run dev
```

`npm install` will generate `.env` files for each environment among development, test, and production in the `postinstall` script. To modify env vars as needed, edit the generated and `.gitignore`-d `.env*` file in project root for your development environment. To modify generated env vars permanently, edit `scripts/postinstall.ts`. Note that secrets added to scripts/dev.ts are not `.gitignore`-d.

By default, a `database.sqlite3` file will be created in project root and used during development and testing. To develop with Postgres locally, run `DB=pg npm run dev` and update development `.env` file with your local Postgres username, password, host, and database as needed. The default host is `localhost`, and the default database is `cluebot`.

To develop the server locally without starting up webpack-dev-server for the client, run `CLIENT=0 npm run dev`.

In production, Heroku's Postgres service supplies DATABASE_URL as an env var, so no need to specify it explicitly.

See `scripts/dev.ts` for detailed usage instructions for `npm run dev`.

# Deployment
cluebot-server may be deployed in one of two places:
## Heroku

Include these commands for the first deploy:
```bash
heroku stack:set heroku-20
heroku buildpacks:add heroku/nodejs
# Google Sheets integration
heroku buildpacks:add https://github.com/gerywahyunugraha/heroku-google-application-credentials-buildpack
# PostgreSQL free tier production database
heroku addons:create heroku-postgresql:hobby-dev
```

To deploy with working Google Sheets integration, project root must include `google-credentials.json` with the relevant info. See [docs on GitHub](https://github.com/gerywahyunugraha/heroku-google-application-credentials-buildpack) for more info.

```
git push heroku master
```

## balenaCloud
```
balena push YOUR_FLEET_NAME
```

# Contributing
Looking for ways to improve cluebot? Here are some discussed features from Hack Week:

- ✅ Google Sheets integration for crowd-sourced questions
- ✅ Move to PostgreSQL in production for persistent Heroku database
- ❌ Add some more Easter Eggs
- 🔨 Polish Cluebot UI
- ❌ Reject invalid handles when trying to submit

Think of another cool feature to gamify work at balena? Open an [issue](https://github.com/balena-io-playground/cluebot-server/issues)

## Thanks to the `teamgame` October 2021 Hack Week squad:
- @cywang117
- @jmakivic
- @stathismor
- @mehalter
- @rhampt
- @gogonimago
- @Jazzagi
