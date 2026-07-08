import type { Address } from "viem";

export const MAX_DRAW_TITLE_LENGTH = 40;
export const MAX_DRAW_NOTE_LENGTH = 120;

export const luckyDrawAbi = [
  {
    type: "function",
    name: "createDraw",
    stateMutability: "nonpayable",
    inputs: [
      { name: "title", type: "string" },
      { name: "note", type: "string" },
      { name: "entryFee", type: "uint256" },
      { name: "durationSeconds", type: "uint256" },
    ],
    outputs: [{ name: "drawId", type: "uint256" }],
  },
  {
    type: "function",
    name: "joinDraw",
    stateMutability: "payable",
    inputs: [{ name: "drawId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "settleDraw",
    stateMutability: "nonpayable",
    inputs: [{ name: "drawId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "hasJoined",
    stateMutability: "view",
    inputs: [
      { name: "drawId", type: "uint256" },
      { name: "account", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "getDraw",
    stateMutability: "view",
    inputs: [{ name: "drawId", type: "uint256" }],
    outputs: [
      { name: "creator", type: "address" },
      { name: "entryFee", type: "uint256" },
      { name: "endsAt", type: "uint256" },
      { name: "settled", type: "bool" },
      { name: "winner", type: "address" },
      { name: "title", type: "string" },
      { name: "note", type: "string" },
      { name: "entrantCount", type: "uint256" },
    ],
  },
] as const;

export type DrawData = {
  creator: Address;
  entryFee: bigint;
  endsAt: bigint;
  settled: boolean;
  winner: Address;
  title: string;
  note: string;
  entrantCount: bigint;
};

export const luckyDrawContractAddress = process.env
  .NEXT_PUBLIC_LUCKY_DRAW_CONTRACT_ADDRESS as Address | undefined;
