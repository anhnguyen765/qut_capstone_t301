const { spawn } = require("child_process");

const child = spawn("npx", ["next", "start"], { stdio: "inherit" });

child.on("close", (code) => process.exit(code));

process.env.PORT = process.env.PORT || "3000";

process.env.HOST = process.env.HOST || "0.0.0.0";
require("./.next/standalone/server.js"); 

