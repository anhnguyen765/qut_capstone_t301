const { spawn } = require("child_process");

const child = spawn("npx", ["next", "start"], { stdio: "inherit" });

child.on("close", (code) => process.exit(code));

