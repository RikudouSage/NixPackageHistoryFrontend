# Nix package version search

> See the backend for this project at [RikudouSage/NixPackageHistoryBackend](https://github.com/RikudouSage/NixPackageHistoryBackend).

This is a frontend for the above linked backend that allows searching historical versions of Nix packages.

> Tip: If you're using nix, you can get all dependencies using `nix-shell` with the `shell.nix` from this repo

Before you can build the app, you need to install dependencies using `yarn install` (or `npm install` or whatever you use).

## Running locally

Just run the command `yarn start` and open http://localhost:4200. You can also change the api url in [environment.development.ts](src/environments/environment.development.ts).

## Running in production

Change the url of the api in [environment.ts](src/environments/environment.ts) if you wish to.

Run `yarn build` to compile the production version. Afterwards, copy the contents of `dist/nix-package-history-frontend` to any webserver capable of serving html.

> Note: I've pretty much copied the design from https://search.nixos.org because I'm on designer. If you wish to create a custom modern design, feel free to!
