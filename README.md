# LUOS SDK TS

## Development

### Requirements

1. [NodeJS](https://nodejs.org/) version LTS 14+
2. [Yarn](https://yarnpkg.com/) version 1.22+

### Installation

Install the dependancies with the command : `yarn install`.

### Run

### Developement

Execute the command : `yarn dev`.
The command is underlaying multiple actions :

- Executing the typescript runtime `tsc` in watch mode.
- Executing the plugin runtime `tsc-alias` in watch mode to convert absolute paths into relative ones.
- Executing the `rollup` packager in watch mode to create :
  - UMD bundle for browser usage on the frontend : `index.umd.js`
  - ESModule bundle for the backend usage like our CLI : `index.esm.js`

## Contribute

### Workflow

You can use [ACT](https://github.com/nektos/act#installation-through-package-managers) to validate the workflows locally :

1. Install ACT (See link for other systems):

```sh
brew install act
```

2. Setup secrets variables in the `.act/.secrets` file :

```yml
NPM_TOKEN=
GITHUB_TOKEN=
```
