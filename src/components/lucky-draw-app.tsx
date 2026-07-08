"use client";

import {
  CircleDollarSign,
  Gift,
  Loader2,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Address } from "viem";
import { formatEther, parseEther } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  luckyDrawAbi,
  luckyDrawContractAddress,
  MAX_DRAW_NOTE_LENGTH,
  MAX_DRAW_TITLE_LENGTH,
} from "@/lib/lucky-draw";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function shortAddress(address?: Address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatEth(value?: bigint) {
  if (value === undefined) return "--";
  return `${Number(formatEther(value)).toFixed(4)} ETH`;
}

function timeLeftLabel(endsAt?: bigint) {
  if (!endsAt) return "--";
  const seconds = Number(endsAt) - Math.floor(new Date().getTime() / 1000);
  if (seconds <= 0) return "Drawing time";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export function LuckyDrawApp() {
  const [drawIdInput, setDrawIdInput] = useState("1");
  const [title, setTitle] = useState("Base Launch Box");
  const [note, setNote] = useState(
    "Small community draw with one wallet, one entry, and one onchain winner.",
  );
  const [entryFeeEth, setEntryFeeEth] = useState("0.001");
  const [durationHours, setDurationHours] = useState("12");
  const [status, setStatus] = useState(
    "Create a draw, let wallets join, and reveal one onchain winner at the end.",
  );
  const [walletStatus, setWalletStatus] = useState("");

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync, isPending: disconnecting } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const {
    data: hash,
    writeContract,
    isPending: writing,
    error: writeError,
  } = useWriteContract();

  const { isLoading: confirming, isSuccess: confirmed } =
    useWaitForTransactionReceipt({ hash });

  const availableConnectors = useMemo(
    () =>
      connectors
        .filter((item) => item.type !== "mock")
        .sort((a, b) => {
          const score = (item: (typeof connectors)[number]) => {
            if (item.id === "baseAccount" || item.name === "Base Account") {
              return 0;
            }
            if (item.type === "injected") return 1;
            return 2;
          };

          return score(a) - score(b);
        }),
    [connectors],
  );

  async function connectWallet() {
    const errors: string[] = [];
    setWalletStatus("Opening wallet...");

    for (const item of availableConnectors) {
      try {
        await connectAsync({ connector: item, chainId: base.id });
        setWalletStatus("");
        return;
      } catch (error) {
        errors.push(
          error instanceof Error
            ? `${item.name}: ${error.message}`
            : `${item.name}: connection failed`,
        );
      }
    }

    setWalletStatus(
      errors[0] ??
        "No wallet connector is available. Open this app inside Base App or install a wallet.",
    );
  }

  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
      setWalletStatus("Wallet disconnected. Tap Connect to reconnect.");
    } catch (error) {
      setWalletStatus(
        error instanceof Error ? error.message : "Could not disconnect wallet.",
      );
    }
  }
  const parsedDrawId = BigInt(Math.max(1, Number(drawIdInput || "1")));

  const drawQuery = useReadContract({
    abi: luckyDrawAbi,
    address: luckyDrawContractAddress,
    functionName: "getDraw",
    args: [parsedDrawId],
    query: {
      enabled: Boolean(luckyDrawContractAddress),
      refetchInterval: 12000,
    },
  });

  const joinStatusQuery = useReadContract({
    abi: luckyDrawAbi,
    address: luckyDrawContractAddress,
    functionName: "hasJoined",
    args: address ? [parsedDrawId, address] : undefined,
    query: {
      enabled: Boolean(luckyDrawContractAddress && address),
      refetchInterval: 12000,
    },
  });

  const drawTuple = drawQuery.data as
    | readonly [Address, bigint, bigint, boolean, Address, string, string, bigint]
    | undefined;

  const draw = useMemo(
    () =>
      drawTuple
        ? {
            creator: drawTuple[0],
            entryFee: drawTuple[1],
            endsAt: drawTuple[2],
            settled: drawTuple[3],
            winner: drawTuple[4],
            title: drawTuple[5],
            note: drawTuple[6],
            entrantCount: drawTuple[7],
          }
        : undefined,
    [drawTuple],
  );

  const hasJoined = Boolean(joinStatusQuery.data);
  const nowSeconds = Math.floor(new Date().getTime() / 1000);
  const isDrawActive = draw ? Number(draw.endsAt) > nowSeconds : false;
  const prizePool = draw ? draw.entryFee * draw.entrantCount : undefined;

  const canCreate =
    Boolean(luckyDrawContractAddress) &&
    isConnected &&
    chainId === base.id &&
    title.trim().length > 0 &&
    title.trim().length <= MAX_DRAW_TITLE_LENGTH &&
    note.trim().length <= MAX_DRAW_NOTE_LENGTH &&
    Number(entryFeeEth) > 0 &&
    Number(durationHours) > 0;

  const canJoin =
    Boolean(luckyDrawContractAddress) &&
    isConnected &&
    chainId === base.id &&
    Boolean(draw?.creator && draw.creator !== ZERO_ADDRESS) &&
    isDrawActive &&
    !draw?.settled &&
    !hasJoined;

  const canSettle =
    Boolean(luckyDrawContractAddress) &&
    isConnected &&
    chainId === base.id &&
    Boolean(draw?.creator && draw.creator !== ZERO_ADDRESS) &&
    !isDrawActive &&
    !draw?.settled;

  const statusText = confirmed
    ? "Transaction confirmed on Base."
    : writeError
      ? writeError.message
      : status;

  function createDraw() {
    if (!luckyDrawContractAddress) return;

    try {
      const entryFee = parseEther(entryFeeEth);
      const durationSeconds = BigInt(Math.floor(Number(durationHours) * 3600));
      setStatus("Confirm the draw creation in your wallet.");
      writeContract({
        address: luckyDrawContractAddress,
        abi: luckyDrawAbi,
        functionName: "createDraw",
        args: [title.trim(), note.trim(), entryFee, durationSeconds],
        chainId: base.id,
      });
    } catch {
      setStatus("Enter a valid entry fee before creating the draw.");
    }
  }

  function joinDraw() {
    if (!luckyDrawContractAddress || !draw) return;

    setStatus("Confirm your draw entry in the wallet.");
    writeContract({
      address: luckyDrawContractAddress,
      abi: luckyDrawAbi,
      functionName: "joinDraw",
      args: [parsedDrawId],
      chainId: base.id,
      value: draw.entryFee,
    });
  }

  function settleDraw() {
    if (!luckyDrawContractAddress) return;

    setStatus("Confirm the winner draw settlement in your wallet.");
    writeContract({
      address: luckyDrawContractAddress,
      abi: luckyDrawAbi,
      functionName: "settleDraw",
      args: [parsedDrawId],
      chainId: base.id,
    });
  }

  return (
    <main className="min-h-screen bg-[#fff6df] text-[#3b2412]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b border-[#3b2412]/20 pb-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full border border-[#3b2412] bg-[#ffbf4d] shadow-[0_10px_30px_rgba(255,162,0,0.25)]">
              <PartyPopper className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#b55412]">
                Base Lucky Draw
              </p>
              <h1 className="text-xl font-black sm:text-2xl">
                Enter one draw. Reveal one winner.
              </h1>
            </div>
          </div>

          {isConnected ? (
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[#3b2412]/20 bg-white px-3 py-2 text-sm font-semibold">
                {shortAddress(address)}
              </span>
              <button
                className="rounded-full border border-[#3b2412] bg-[#3b2412] px-4 py-2 text-sm font-semibold text-white"
                onClick={disconnectWallet}
              >{disconnecting ? "Disconnecting" : "Disconnect"}</button>
            </div>
          ) : (
            <button
              className="inline-flex items-center gap-2 rounded-full border border-[#3b2412] bg-[#3b2412] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              disabled={availableConnectors.length === 0 || connecting}
              onClick={connectWallet}
            >
              {connecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              Connect
            </button>
          )}
        {walletStatus ? (
            <p className="w-full text-right text-xs font-semibold opacity-75">
              {walletStatus}
            </p>
          ) : null}
        </header>

        <div className="grid flex-1 gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-[34px] border border-[#3b2412] bg-[linear-gradient(180deg,#fffdf5_0%,#ffe7b1_100%)] p-5 shadow-[0_22px_60px_rgba(103,65,15,0.12)]">
            <div className="max-w-3xl">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#3b2412] bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.18em]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Onchain raffle
              </p>
              <h2 className="text-4xl font-black leading-tight sm:text-6xl">
                A bright lucky draw built for Base mobile users.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#7c5b32] sm:text-lg">
                Start a small paid draw, let wallets join one time each, and
                settle a single winner onchain when the timer ends.
              </p>
            </div>

            <div className="mt-8 rounded-[34px] border border-[#3b2412] bg-[#3b2412] p-5 text-white">
              <div className="flex items-start justify-between gap-4 border-b border-white/15 pb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffd66b]">
                    Draw machine
                  </p>
                  <h3 className="mt-2 text-3xl font-black">
                    {draw?.title || "Base Launch Box"}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#ffe6ad]">
                    {draw?.note || "Small community draw with one wallet, one entry, and one onchain winner."}
                  </p>
                </div>
                <div className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold">
                  {draw ? timeLeftLabel(draw.endsAt) : "Waiting for draw"}
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[24px] border border-white/15 bg-white/10 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffd66b]">
                    Entry fee
                  </p>
                  <p className="mt-3 text-2xl font-black">{formatEth(draw?.entryFee)}</p>
                </div>
                <div className="rounded-[24px] border border-white/15 bg-white/10 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffd66b]">
                    Entrants
                  </p>
                  <p className="mt-3 text-2xl font-black">
                    {draw ? Number(draw.entrantCount) : "--"}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/15 bg-white/10 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffd66b]">
                    Prize pool
                  </p>
                  <p className="mt-3 text-2xl font-black">{formatEth(prizePool)}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-[#3b2412] bg-white/80 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b55412]">
                  Step 1
                </p>
                <p className="mt-2 text-lg font-semibold">Create draw</p>
              </div>
              <div className="rounded-[24px] border border-[#3b2412] bg-white/80 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b55412]">
                  Step 2
                </p>
                <p className="mt-2 text-lg font-semibold">Join once</p>
              </div>
              <div className="rounded-[24px] border border-[#3b2412] bg-white/80 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b55412]">
                  Step 3
                </p>
                <p className="mt-2 text-lg font-semibold">Reveal winner</p>
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-4">
            <section className="rounded-[34px] border border-[#3b2412] bg-white p-5 shadow-[0_22px_60px_rgba(103,65,15,0.12)]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#ffe6ad]">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">Create draw</h3>
                  <p className="text-sm text-[#7c5b32]">
                    Launch a one-winner entry pool.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-[#b55412]">
                    Draw title
                  </span>
                  <input
                    className="rounded-2xl border border-[#3b2412]/15 bg-[#fffaf0] px-4 py-3 outline-none"
                    maxLength={MAX_DRAW_TITLE_LENGTH}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-[#b55412]">
                    Draw note
                  </span>
                  <textarea
                    className="min-h-24 rounded-2xl border border-[#3b2412]/15 bg-[#fffaf0] px-4 py-3 outline-none"
                    maxLength={MAX_DRAW_NOTE_LENGTH}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-[#b55412]">
                      Entry fee
                    </span>
                    <input
                      className="rounded-2xl border border-[#3b2412]/15 bg-[#fffaf0] px-4 py-3 outline-none"
                      value={entryFeeEth}
                      onChange={(event) => setEntryFeeEth(event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-[#b55412]">
                      Hours
                    </span>
                    <input
                      className="rounded-2xl border border-[#3b2412]/15 bg-[#fffaf0] px-4 py-3 outline-none"
                      value={durationHours}
                      onChange={(event) => setDurationHours(event.target.value)}
                    />
                  </label>
                </div>
              </div>

              {chainId !== base.id && isConnected ? (
                <button
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#3b2412] px-4 py-3 font-semibold text-white disabled:opacity-60"
                  disabled={switching}
                  onClick={() => switchChain({ chainId: base.id })}
                >
                  {switching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wallet className="h-4 w-4" />
                  )}
                  Switch to Base
                </button>
              ) : (
                <button
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#ffbf4d] px-4 py-3 font-semibold text-[#3b2412] disabled:opacity-50"
                  disabled={!canCreate || writing || confirming}
                  onClick={createDraw}
                >
                  {writing || confirming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PartyPopper className="h-4 w-4" />
                  )}
                  Create on Base
                </button>
              )}
            </section>

            <section className="rounded-[34px] border border-[#3b2412] bg-white p-5 shadow-[0_22px_60px_rgba(103,65,15,0.12)]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#ffe6ad]">
                  <CircleDollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">Entry panel</h3>
                  <p className="text-sm text-[#7c5b32]">
                    Load a draw and take one entry slot.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-[#b55412]">
                    Draw ID
                  </span>
                  <input
                    className="rounded-2xl border border-[#3b2412]/15 bg-[#fffaf0] px-4 py-3 outline-none"
                    value={drawIdInput}
                    onChange={(event) => setDrawIdInput(event.target.value)}
                  />
                </label>
              </div>

              <button
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#3b2412] px-4 py-3 font-semibold text-white disabled:opacity-50"
                disabled={!canJoin || writing || confirming}
                onClick={joinDraw}
              >
                {writing || confirming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Join draw
              </button>

              <button
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#3b2412]/20 bg-[#fffaf0] px-4 py-3 font-semibold text-[#3b2412] disabled:opacity-50"
                disabled={!canSettle || writing || confirming}
                onClick={settleDraw}
              >
                {writing || confirming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PartyPopper className="h-4 w-4" />
                )}
                Reveal winner
              </button>
            </section>

            <section className="rounded-[34px] border border-[#3b2412] bg-[#3b2412] p-5 text-white shadow-[0_22px_60px_rgba(103,65,15,0.12)]">
              <h3 className="text-2xl font-black">Winner board</h3>
              <p className="mt-4 min-h-16 text-sm leading-6 text-[#ffe6ad]">
                {statusText}
              </p>

              <div className="rounded-[24px] border border-white/15 bg-white/10 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffd66b]">
                  Winner
                </p>
                <p className="mt-3 text-2xl font-black">
                  {draw?.winner && draw.winner !== ZERO_ADDRESS
                    ? shortAddress(draw.winner)
                    : "Not drawn yet"}
                </p>
              </div>

              {!luckyDrawContractAddress ? (
                <p className="mt-4 rounded-[18px] border border-white/20 bg-white/10 p-3 text-xs leading-6 text-[#ffe6ad]">
                  Add `NEXT_PUBLIC_LUCKY_DRAW_CONTRACT_ADDRESS` after
                  deploying the draw contract, then redeploy Vercel.
                </p>
              ) : null}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
