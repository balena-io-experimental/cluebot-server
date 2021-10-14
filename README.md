# Cluebot
A bot host for a collaborative question game about remote work

Used by [cluebot](https://github.com/balena-io-playground/cluebot), which interacts with Flowdock.

# Development

- Node version: 14

```
npm install
npm run dev
```
# Deployment
cluebot-server may be deployed in one of two places:
## Heroku
```
heroku stack:set container
git push heroku master
```

## balenaCloud
```
balena push YOUR_FLEET_NAME
```

# Contributing
Looking for ways to improve cluebot? Here are some discussed features from Hack Week:

- 🔨 Google Sheets integration for crowd-sourced questions
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
