import chalk from "chalk";
import { Command } from "commander";
import figlet from "figlet";
import { stat } from "fs/promises";
import package_json from "../package.json" assert {type: "json"};
import { join, dirname } from "path";
import { fileURLToPath } from 'url';
import sea from "./index.js";
import debug from 'debug';

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
    .option("-e, --entry <path>", "Path to the entry script", join(__dirname, "../examples/hello.js"))
    .option("-o, --output <path>", "Path to the output executable", join(__dirname, `../dist/hello${process.platform === "win32" ? ".exe" : ""}`))
    .option("--disable-experimental-sea-warning", "Disable experimental SEA warning", true)
    .option("--use-snapshot", "Use snapshot", false)
    .option("--use-code-cache", "Use code cache", false)
    .parse(process.argv);
  const options = program.opts();
  // Check if entry is specified
  if (!((await stat(options.entry)).isFile())) {
    console.error(chalk.red(`Entry path ${options.entry} does not exist`));
    process.exit(1);
  }
  await sea(options.entry, options.output, {
    disableExperimentalSEAWarning: options.disableExperimentalSeaWarning,
    useSnapshot: options.useSnapshot,
    useCodeCache: options.useCodeCache
  })
}

await main();