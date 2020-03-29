# Changelog #

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] ##

### Added ###

- Support for Bitbucket Server as a file source for Builder. Includes:
  - `impt auth bitbucket-server` command
  - `impt test bitbucket-server` command
  - using Bitbucket Server credentials from a file or environment variables during test deployment creation
  - using Bitbucket Server credentials from auth file or environment variables during deployment creation
- VSCode clickable links in the output with compilation errors for the following commands:
  - `impt build run`
  - `impt build deploy`
- `--log` option with optional values (`full`, `min-ts`, `epoch-ts`, `delta-ts`, `no-ts`) to specify a format of timestamps in logs, for the following commands:
  - `impt build run`
  - `impt device restart`
  - `impt dg restart`
  - `impt log stream`
  - `impt log get`

### Changed ###

- NodeJS version 10+ is required
- "global-agent" NodeJS module is used for logs streaming over proxy
- "yargs" NodeJS module version 10.0.3 is required for processing entity IDs which start with "-"
- Logs are colorized (similar to impCentral IDE) in the default and "debug" output modes
- If logs are streamed from one device only, Device Id is not displayed in logs in the default and "minimal" output modes 
- `--device` (`-d`) option may be repeated several times to specify multiple devices in the following commands:
  - `impt device assign`
  - `impt device unassign`
  - `impt device remove`
  - `impt device restart`

### Fixed ###

- Many various issues to make all tests passed

## [Released] ##
