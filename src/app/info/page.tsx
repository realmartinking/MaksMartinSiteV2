import { ReactNode } from 'react';

const ABOUT = '10+ years building creative direction at the intersection of strategy, management, and product. My approach combines systems thinking, aesthetic judgment, and technical flexibility, producing cohesive creative solutions that scale with the business.';

export default function InfoPage() {
  return (
    <main className="min-h-screen pt-[20vh] pb-[20vh] flex flex-col items-center gap-y-[15vh]">
      <Block index={0}>{ABOUT}</Block>

      <Block index={1} label="Capabilities">
        Branding, Art Direction, Motion, 3D, Strategy
      </Block>

      <Block index={2} label="AI Capabilities">
        AI Production, AI-driven brand systems, AI integration consulting, Automation pipelines for creative teams
      </Block>

      <Block index={3} label="Get in touch">
        <a href="mailto:martinmursalimov@gmail.com" className="hover:opacity-60 transition-opacity">
          let&apos;s talk
        </a>
        {' · '}
        <a href="https://t.me/martinmuur" target="_blank" rel="noopener noreferrer" aria-label="Telegram (opens in new tab)" className="hover:opacity-60 transition-opacity">
          Telegram
        </a>
        {' · '}
        <a href="https://www.behance.net/martinmur" target="_blank" rel="noopener noreferrer" aria-label="Behance (opens in new tab)" className="hover:opacity-60 transition-opacity">
          Behance
        </a>
      </Block>
    </main>
  );
}

function Block({ label, children, index = 0 }: { label?: string; children: ReactNode; index?: number }) {
  return (
    <section
      className="flex flex-col items-center gap-y-[10px] max-w-[80vw] text-center"
      style={{
        animation: `list-entrance 1s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.15}s both`,
      }}
    >
      {label && (
        <h2 className="text-[15px] font-bold tracking-tight">{label}</h2>
      )}
      <p className="font-bold uppercase leading-[1.05] text-[calc(0.5rem+3vw)]">
        {children}
      </p>
    </section>
  );
}
