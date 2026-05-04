import { createInterface } from "readline";
import { spawn } from "child_process";

const rl = createInterface({ input: process.stdin, output: process.stdout });

rl.question("Backend: (r)emoto / (l)ocal [remoto por default]: ", (answer) => {
  rl.close();

  const local = answer.trim().toLowerCase() === "l";
  const backendURL = local
    ? "http://localhost:3000"
    : "https://tic-campus-backend.vercel.app";

  console.log(`Usando backend: ${backendURL}`);

  const child = spawn("pnpm", ["exec", "astro", "dev"], {
    stdio: "inherit",
    env: { ...process.env, PUBLIC_BACKEND_URL: backendURL },
  });

  child.on("exit", (code) => process.exit(code ?? 0));
});
