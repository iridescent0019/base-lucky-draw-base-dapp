import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import solc from "solc";
import { createPublicClient, createWalletClient, defineChain, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const envPath = resolve(process.cwd(), ".env.local");
const envText = await readFile(envPath, "utf8").catch(() => "");

function getEnv(name) {
  const shellValue = process.env[name];
  if (shellValue) return shellValue;
  const match = envText.match(new RegExp(`^${name}=(.*)$`, "m"));
  return match?.[1]?.trim();
}

const privateKey = getEnv("DEPLOYER_PRIVATE_KEY");
const rpcUrl = getEnv("BASE_RPC_URL") ?? "https://mainnet.base.org";

if (!privateKey) {
  throw new Error("Missing DEPLOYER_PRIVATE_KEY in .env.local or shell env.");
}

const normalizedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;

const source = await readFile(resolve(process.cwd(), "contracts/BaseLuckyDraw.sol"), "utf8");
const input = {
  language: "Solidity",
  sources: {
    "BaseLuckyDraw.sol": { content: source },
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const contract = output.contracts?.["BaseLuckyDraw.sol"]?.BaseLuckyDraw;
if (!contract) {
  throw new Error("Solidity compile failed.");
}

const account = privateKeyToAccount(normalizedKey);
const base = defineChain({
  id: 8453,
  name: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: "BaseScan",
      url: "https://basescan.org",
    },
  },
});

const publicClient = createPublicClient({
  chain: base,
  transport: http(rpcUrl),
});

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(rpcUrl),
});

console.log(`Deploying BaseLuckyDraw from ${account.address} on Base...`);

const hash = await walletClient.deployContract({
  abi: contract.abi,
  bytecode: `0x${contract.evm.bytecode.object}`,
});

const receipt = await publicClient.waitForTransactionReceipt({ hash });
console.log(`Transaction: https://basescan.org/tx/${hash}`);
console.log(`Contract: ${receipt.contractAddress}`);
console.log("Set NEXT_PUBLIC_LUCKY_DRAW_CONTRACT_ADDRESS to this contract address in Vercel.");
