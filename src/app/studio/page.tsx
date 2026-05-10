import { ReactNode } from 'react';

const SLOGAN = 'Timeless design, like classical music, love and money';

export default function StudioPage() {
  return (
    <main className="min-h-screen pt-[20vh] pb-[20vh] flex flex-col items-center gap-y-[15vh]">
      <h1 className="font-bold uppercase text-center leading-[0.9] md:leading-[0.85] lg:leading-[0.8] text-[calc(1rem+6vw)]">
        Studio
      </h1>

      <Block>
        {SLOGAN}
      </Block>

      <Block label="Capabilities">
        Brand Identity, Art Direction, Editorial, Packaging, Web
      </Block>

      <Block label="Get in touch">
        <a href="mailto:martinmursalimov@gmail.com" className="hover:opacity-60 transition-opacity">
          let&apos;s talk
        </a>
        {' · '}
        <a href="https://t.me/martinmuur" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">
          Telegram
        </a>
        {' · '}
        <a href="https://www.behance.net/realmartinking" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">
          Behance
        </a>
      </Block>
    </main>
  );
}

function Block({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col items-center gap-y-[10px] max-w-[80vw] text-center">
      {label && (
        <h6 className="text-[15px] font-bold tracking-tight">{label}</h6>
      )}
      <p className="font-bold uppercase leading-[1.05] text-[calc(0.5rem+3vw)]">
        {children}
      </p>
    </section>
  );
}
