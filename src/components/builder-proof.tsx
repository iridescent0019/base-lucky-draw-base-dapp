import { builderProof } from "@/lib/builder-proof";

const proofRows = [
  ["Build ID", builderProof.buildId],
  ["Builder Wallet", builderProof.builderWallet],
  ["Builder Code", builderProof.builderCode],
  ["Live Demo", builderProof.liveDemo],
  ["GitHub", builderProof.github],
  ["Network", builderProof.network],
  ["Status", builderProof.status],
];

export function BuilderProofSection() {
  return (
    <section className="border-t border-white/10 bg-slate-950 px-5 py-12 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-200/80">
              Built on Base
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Builder Proof
            </h2>
          </div>
          <a
            href="/builder"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/15"
          >
            View Builder Profile
          </a>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {proofRows.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                {label}
              </p>
              <p className="mt-2 break-words text-sm font-semibold leading-5 text-white">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
