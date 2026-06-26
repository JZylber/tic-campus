import { spawn } from "child_process";

console.log("\x1b[31m\x1b[1m");
console.log("╔════════════════════════════════════════════════════════════════════════════════════╗");
console.log("║  ADVERTENCIA: EL BACKEND TIENE QUE ESTAR CORRIENDO LOCALMENTE EN EL PUERTO 3000    ║");
console.log("║  El backend ahora tiene algo de autenticación y no puede estar tan libre por CORS. ║");
console.log("║  PERDÓN es re molesto ya se.                                                       ║");
console.log("║                                                                                    ║");
console.log("║  TIP: Igual, para previsualizar los artículos usá: pnpm preview:articles           ║");
console.log("╚════════════════════════════════════════════════════════════════════════════════════╝");
console.log("\x1b[0m");

const child = spawn("pnpm", ["exec", "astro", "dev"], {
  stdio: "inherit",
  env: { ...process.env, PUBLIC_BACKEND_URL: "http://localhost:3000" },
});

child.on("exit", (code) => process.exit(code ?? 0));