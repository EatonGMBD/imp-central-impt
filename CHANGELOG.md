# Changelog #

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] ##

### Fixed ###

- Updated to an unreleased version of a impUnit fork that contains the following:
  - assertDeepEqual now supports a default equality function that can be provided in this.assertDeepEqual

## [v3.2.0-etn] - 2020-02-15

### Added ###

- a `postDeviceBuild` step (similar to `preBuild`) for post processing the built
  device code (used in tests also).

### Fixed ###

- Updated to an unreleased version of impUnit that contains the following:
  - assertDeepEqual now works with blobs
  - fixed a bug in the path that assertDeepEqual displays when there's a failure

## [v3.1.0-etn] - 2020-09-01

### Added ###

- `--save-artifacts` and `--use-artifacts` options in:
  - `impt build deploy`
  - `impt build run`
  - `impt build generate`

## [v3.0.1-etn] - 2020-08-13

### Fixed ###

- Update Builder dependency to [EI-hosted v4.0.1](https://github.com/electricimp/Builder/releases/tag/4.0.1)

## [v3.0.0-etn] - 2020-08-10

### Added ###

- Update Builder dependency to [EI-hosted v4.0.0](https://github.com/electricimp/Builder/releases/tag/4.0.0)
- `impt build generate` command to output reproducible artifacts to a build folder
- Setting of User-defined Environment Variables in `impt dg create` and `impt dg update` commands
- Support for ADO Repos as a file source for Builder. Includes:
  - `impt auth azure-repos` command
  - `impt test azure-repos` command
  - using ADO Repos credentials from a file during test deployment creation
  - using ADO Repos credentials from auth file or environment variables during deployment creation

## [v2.5.0-etn] - 2020-04-06

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

[v3.2.0-etn]: https://github.com/EatonGMBD/imp-central-impt/releases/tag/v3.2.0-etn
[v3.1.0-etn]: https://github.com/EatonGMBD/imp-central-impt/releases/tag/v3.1.0-etn
[v3.0.1-etn]: https://github.com/EatonGMBD/imp-central-impt/releases/tag/v3.0.1-etn
[v3.0.0-etn]: https://github.com/EatonGMBD/imp-central-impt/releases/tag/v3.0.0-etn
[v2.5.0-etn]: https://github.com/EatonGMBD/imp-central-impt/releases/tag/v2.5.0-etn
