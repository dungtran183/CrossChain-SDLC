// Biên dịch mọi file contracts/src/**/*.sol bằng npm `solc` (wasm) → contracts/artifacts/<Contract>.json
// Chạy: cd contracts && npm install && npm run compile
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";

const root = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(root, "src");
const outDir = path.join(root, "artifacts");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : p.endsWith(".sol") ? [p] : [];
  });
}

const sources = {};
for (const file of walk(srcDir)) {
  const key = path.relative(srcDir, file).split(path.sep).join("/");
  sources[key] = { content: fs.readFileSync(file, "utf8") };
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "paris",
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};

const output = JSON.parse(
  solc.compile(JSON.stringify(input), {
    import: (p) => {
      const full = path.join(srcDir, p);
      return fs.existsSync(full) ? { contents: fs.readFileSync(full, "utf8") } : { error: "not found: " + p };
    },
  }),
);

const errors = (output.errors || []).filter((e) => e.severity === "error");
for (const e of output.errors || []) console.error(e.formattedMessage);
if (errors.length) process.exit(1);

// Tên contract phải duy nhất toàn repo (artifact ghi phẳng vào artifacts/<Name>.json).
// Quy ước: contract của module đặt tiền tố Cd1/Cd2/Cd3 (vd Cd2WrappedToken, Cd3WrappedToken).
const seen = new Map();
for (const [source, contracts] of Object.entries(output.contracts || {})) {
  for (const name of Object.keys(contracts)) {
    if (seen.has(name)) {
      console.error(`Duplicate contract name "${name}" in ${seen.get(name)} and ${source} — rename one (use Cd1/Cd2/Cd3 prefix).`);
      process.exit(1);
    }
    seen.set(name, source);
  }
}

fs.mkdirSync(outDir, { recursive: true });
let n = 0;
for (const [source, contracts] of Object.entries(output.contracts || {})) {
  for (const [name, c] of Object.entries(contracts)) {
    const artifact = {
      contractName: name,
      sourceName: source,
      compiler: solc.version(),
      abi: c.abi,
      bytecode: "0x" + c.evm.bytecode.object,
    };
    fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(artifact, null, 2) + "\n");
    n += 1;
  }
}
console.log(`Compiled ${n} contract(s) with solc ${solc.version()} → ${path.relative(process.cwd(), outDir)}`);
