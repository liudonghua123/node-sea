#!/usr/bin/env node --no-warnings=ExperimentalWarning

import chalk from "chalk";
import { Command } from "commander";
import figlet from "figlet";
import package_json from "../package.json" assert {type: "json"};
import { join, dirname, resolve, basename, normalize } from "path";
import { fileURLToPath } from 'url';
import sea from "../lib/index.js";
import debug from 'debug';
import { is_directory_exists, is_file_exists } from "../lib/utils.js";

const log = debug('app');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  // Print the banner
  console.log(chalk.blue(figlet.textSync("node-sea")));
  // Parse the command line arguments
  const program = new Command();
  program
    .version(package_json.version)
    .description("Create single executable application (SEA) from entry script")
    .option("-e, --entry <path>", "Path to the javascript entry script", join(__dirname, "../examples/hello.js"))
    .option("-o, --output <path>", "Path to the output executable, supports relative or absolute file/directory path, defaults to the same filename executable aside the entry script", '')
    .option("--disable-experimental-sea-warning", "Disable experimental SEA warning", true)
    .option("--use-snapshot", "Use snapshot", false)
    .option("--use-code-cache", "Use code cache", false)
    .parse(process.argv);
  const options = program.opts();
  // Normalize the entry path
  options.entry = resolve(process.cwd(), options.entry);
  // Check if entry file is specified and exists
  if (!(await is_file_exists(options.entry))) {
    console.error(chalk.red(`Entry path ${options.entry} does not exist`));
    process.exit(1);
  }
  // Check if entry is javascript file, ends with .js or .mjs
  if (!basename(options.entry).split('.').pop()?.endsWith('js')) {
    console.error(chalk.red(`Entry path ${options.entry} is not a javascript file`));
    process.exit(1);
  }
  // Config the default output path if not specified
  const filename = basename(options.entry);
  let output = options.output;
  if (!options.output) {
    output = join(dirname(options.entry), `${filename.substring(0, filename.lastIndexOf('.'))}${process.platform === "win32" ? ".exe" : ""}`);
    console.info(chalk.yellow(`Output path not specified, save single executable to ${output}`));
  }
  // Check if output is a directory and exists, if so, append the entry filename and executable extension
  if (await is_directory_exists(options.output)) {
    output = join(options.output, `${filename.substring(0, filename.lastIndexOf('.'))}${process.platform === "win32" ? ".exe" : ""}`);
    console.info(chalk.yellow(`Output path is a directory, save single executable to ${output}`));
  }
  options.output = resolve(process.cwd(), output);
  await sea(options.entry, options.output, {
    disableExperimentalSEAWarning: options.disableExperimentalSeaWarning,
    useSnapshot: options.useSnapshot,
    useCodeCache: options.useCodeCache
  })
}

await main();