#!/usr/bin/env -S node --no-warnings=ExperimentalWarning

import chalk from "chalk";
import { Command, Option } from "commander";
import figlet from "figlet";
import package_json from "../package.json" assert {type: "json"};
import { join, dirname, resolve, basename, normalize } from "path";
import { fileURLToPath } from 'url';
import sea from "../lib/index.js";
import debug from 'debug';
import { is_directory_exists, is_file_exists } from "../lib/utils.js";
import { homedir, version } from "os";
import { existsSync, readdirSync, statSync } from "fs";
import Table from 'cli-table3';

const log = debug('app');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function get_current_platform() {
  switch (process.platform) {
    case "win32":
      return "windows";
    case "darwin":
      return "macos";
    case "linux":
      return "linux";
    default:
      return "unknown"
  }
}

async function listPrebuildNode(available) {
  // each version of platform binary is like node-linux-x64-v20.11.0-with-intl-full-icu, node-linux-x64-v20.11.0-with-intl-none, node-linux-x64-v20.11.0-with-intl-small-icu
  // we need to group by versions and print with-intl variations with size info.
  const table = new Table({
    head: ['version', 'with-intl-full-icu', 'with-intl-small-icu', 'with-intl-none'],
    colWidths: [10, 25, 25, 25]
  });
  let versions = {};
  if (available) {
    try {
      // get the remote prebuilt node binaries information
      const response = await fetch('https://api.github.com/repos/liudonghua123/node-sea/releases/tags/node');
      if (!response.ok) {
        throw new Error(`Failed to fetch prebuilt Node.js binaries: ${response.statusText}`);
      }
      const binaries = (await response.json()).assets;
      const platformFilteredBinaries = binaries.filter(binary => binary.name.includes(get_current_platform()));
      for (const binary of platformFilteredBinaries) {
        const match = binary.name.match(/-v(?<version>\d+\.\d+\.\d+)-with-intl-(?<intl>[-\w]+)/);
        const version = match ? match.groups.version : 'N/A';
        const intl = match ? match.groups.intl : 'N/A';
        if (!versions[version]) {
          versions[version] = {
            'with-intl-full-icu': '❌ Not Found',
            'with-intl-small-icu': '❌ Not Found',
            'with-intl-none': '❌ Not Found',
          };
        }
        versions[version][`with-intl-${intl}`] = `✔ ${(binary.size / 1024 / 1024).toFixed(2)} MB`;
      }
    } catch (error) {
      console.error('Error listing available binaries:', error.message);
      throw error;
    }
  } else {
    const NODE_SEA_CACHE_DIR = join(homedir(), '.node-sea');
    if (existsSync(NODE_SEA_CACHE_DIR)) {
      const binaries = readdirSync(NODE_SEA_CACHE_DIR);
      for (const name of binaries) {
        const match = name.match(/-v(?<version>\d+\.\d+\.\d+)-with-intl-(?<intl>[-\w]+)/);
        const version = match ? match.groups.version : 'N/A';
        const intl = match ? match.groups.intl : 'N/A';
        if (!versions[version]) {
          versions[version] = {
            'with-intl-full-icu': '❌ Not Cached',
            'with-intl-small-icu': '❌ Not Cached',
            'with-intl-none': '❌ Not Cached',
          };
        }
        const size = statSync(join(NODE_SEA_CACHE_DIR, name)).size;
        versions[version][`with-intl-${intl}`] = `✔ ${(size / 1024 / 1024).toFixed(2)} MB`;
      };
    }
  }
  if (!versions) {
    return console.log('No locally installed Node.js versions found.');
  }
  // shown the sorted version binaries
  for (const version of Object.keys(versions).sort()) {
    table.push([version, versions[version]['with-intl-full-icu'], versions[version]['with-intl-small-icu'], versions[version]['with-intl-none']]);
  }
  console.log(table.toString());
}

async function main() {
  // Print the banner
  console.log(chalk.blue(figlet.textSync("node-sea")));
  let options = {};
  // Parse the command line arguments
  const program = new Command();
  program
    .command('build', { isDefault: true })
    .version(package_json.version)
    .description("Create single executable application (SEA) from entry script")
    .option("-e, --entry <path>", "Path to the javascript entry script", join(__dirname, "../examples/hello.js"))
    .option("-o, --output <path>", "Path to the output executable, supports relative or absolute file/directory path, defaults to the same filename executable aside the entry script", '')
    .option("-d, --disable-experimental-sea-warning", "Disable experimental SEA warning", true)
    .option("--no-disable-experimental-sea-warning", "Disable experimental SEA warning")
    .option("-s, --use-snapshot", "Use snapshot", false)
    .option("-c, --use-code-cache", "Use code cache", false)
    .option("-n, --use-system-node", "Use system node", true)
    .option("--no-use-system-node", "Use system node")
    .option("-v, --node-version <version>", "Node version for create SEA", 'v20.11.0')
    .option("-a, --arch <arch>", "Node arch for create SEA", 'x64')
    .option("-i, --with-intl <intl>", "Node intl feature, accept values: none, small-icu, full-icu", 'small-icu')
    .action((_options) => {
      log('default command options', options);
      options = { build: _options };
    });

  // add a ls sub command, and with an optional `--available` option.
  program.command('ls')
    .description("List available prebuild intl customization node binaries")
    .option("-a, --available", "List available prebuild binaries in the remote repository", false)
    .action((_options) => {
      log('ls command options', options);
      options = { ...options, ls: { available: _options.available } }
    });

  program.parse();
  log('options', options);
  // Check if ls command is specified
  if (options.ls) {
    await listPrebuildNode(options.ls.available);
    process.exit(0);
  }
  // Normalize the entry path
  options.build.entry = resolve(process.cwd(), options.build.entry);
  // Check if entry file is specified and exists
  if (!(await is_file_exists(options.build.entry))) {
    console.error(chalk.red(`Entry path ${options.build.entry} does not exist`));
    process.exit(1);
  }
  // Check if entry is javascript file, ends with .js or .mjs
  if (!basename(options.build.entry).split('.').pop()?.endsWith('js')) {
    console.error(chalk.red(`Entry path ${options.build.entry} is not a javascript file`));
    process.exit(1);
  }
  // Config the default output path if not specified
  const filename = basename(options.build.entry);
  let output = options.build.output;
  if (!options.build.output) {
    output = join(dirname(options.build.entry), `${filename.substring(0, filename.lastIndexOf('.'))}${process.platform === "win32" ? ".exe" : ""}`);
    console.info(chalk.yellow(`Output path not specified, save single executable to ${output}`));
  }
  // Check if output is a directory and exists, if so, append the entry filename and executable extension
  if (await is_directory_exists(options.build.output)) {
    output = join(options.build.output, `${filename.substring(0, filename.lastIndexOf('.'))}${process.platform === "win32" ? ".exe" : ""}`);
    console.info(chalk.yellow(`Output path is a directory, save single executable to ${output}`));
  }
  options.build.output = resolve(process.cwd(), output);
  await sea(options.build.entry, options.build.output, {
    disableExperimentalSEAWarning: options.build.disableExperimentalSeaWarning,
    useSnapshot: options.build.useSnapshot,
    useCodeCache: options.build.useCodeCache,
    useSystemNode: options.build.useSystemNode,
    nodeVersion: options.build.nodeVersion,
    withIntl: options.build.withIntl,
    arch: options.build.arch,
  })
}

await main();