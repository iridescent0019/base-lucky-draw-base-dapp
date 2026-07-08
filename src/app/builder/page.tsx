import Link from "next/link";
import { BuilderProofSection } from "@/components/builder-proof";
import { builderProof } from "@/lib/builder-proof";

export default function BuilderPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:px-10">
        <Link href="/" className="text-sm font-semibold text-blue-200 hover:text-white">
          ← Back to app
        </Link>
        <div className="mt-10 rounded-[2rem] border border-white/12 bg-white/8 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-200/80">
            Builder Identity
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
            {builderProof.appName}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/64">
            {builderProof.identityNote}
          </p>
          <dl className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              ["Base Developer Dashboard", builderProof.baseDashboard],
              ["Build ID", builderProof.buildId],
              ["Builder Wallet", builderProof.builderWallet],
              ["Builder Code", builderProof.builderCode],
              ["Live Demo", builderProof.liveDemo],
              ["GitHub Repository", builderProof.github],
              ["Network", builderProof.network],
              ["Deployment", builderProof.deployment],
              ["Status", builderProof.status],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
                  {label}
                </dt>
                <dd className="mt-2 break-words text-sm font-semibold leading-5 text-white">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <BuilderProofSection />
    </main>
  );
}
