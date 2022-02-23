import * as path from "path";
import chalkAnimation from "chalk-animation";
import inquirer from "inquirer";
import meow from "meow";

import type { Lang, Server } from ".";
import { servers } from ".";
import { createApp } from ".";

const help = `
  Usage:
    $ npx create-remix [flags...] [<dir>]

  If <dir> is not provided up front you will be prompted for it.

  Flags:
    --help, -h          Show this help message
    --version, -v       Show the version of this script
    --template, -t      The template to use for the app

  Examples:
    $ npx create-remix --template express-template
    $ npx create-remix --template :username/:repo
    $ npx create-remix --template https://github.com/:username/:repo
    $ npx create-remix --template https://github.com/:username/:repo/tree/:branch
    $ npx create-remix --template https://github.com/:username/:repo/archive/refs/tags/:tag.tar.gz
    $ npx create-remix --template /my/remix-stack
    $ npx create-remix --template /my/remix-stack.tar.gz
    $ npx create-remix --template https://example.com/remix-stack.tar.gz
    $ npx create-remix --template file:///Users/michael/michael-stackson.tar.gz
`;

run().then(
  () => {
    process.exit(0);
  },
  error => {
    console.error(error);
    process.exit(1);
  }
);

async function run() {
  let { input, flags, showHelp, showVersion, pkg } = meow(help, {
    flags: {
      help: { type: "boolean", default: false, alias: "h" },
      version: { type: "boolean", default: false, alias: "v" },
      template: { type: "string", alias: "t" }
    }
  });

  if (flags.help) showHelp();
  if (flags.version) showVersion();

  let anim = chalkAnimation.rainbow(`\nR E M I X - v${pkg.version}\n`);
  await new Promise(res => setTimeout(res, 1500));
  anim.stop();

  console.log("💿 Welcome to Remix! Let's get you set up with a new project.");
  console.log();

  // Figure out the app directory
  let projectDir = path.resolve(
    process.cwd(),
    input.length > 0
      ? input[0]
      : (
          await inquirer.prompt<{ dir: string }>([
            {
              type: "input",
              name: "dir",
              message: "Where would you like to create your app?",
              default: "./my-remix-app"
            }
          ])
        ).dir
  );

  if (flags.template) {
    await createApp({
      projectDir,
      lang: "ts",
      install: false,
      repo: flags.template
    });

    return;
  }

  let answers = await inquirer.prompt<{
    server: Server;
    lang: Lang;
    install: boolean;
  }>([
    {
      name: "server",
      type: "list",
      message:
        "Where do you want to deploy? Choose Remix if you're unsure, it's easy to change deployment targets.",
      loop: false,
      choices: Object.entries(servers).map(([server, url]) => {
        return { name: server, value: url };
      })
    },
    {
      name: "lang",
      type: "list",
      message: "TypeScript or JavaScript?",
      choices: [
        { name: "TypeScript", value: "ts" },
        { name: "JavaScript", value: "js" }
      ]
    },
    {
      name: "install",
      type: "confirm",
      message: "Do you want me to run `npm install`?",
      default: true
    }
  ]);

  await createApp({
    projectDir,
    lang: answers.lang,
    repo: answers.server,
    install: answers.install
  });

  return;
}
