export function Header() {
  return (
    <header className="pointer-events-none absolute top-0 left-0 z-10 p-4 sm:p-6">
      <p className="font-pixel text-cyan text-xs tracking-[0.3em]">CELESTIAL GLOBE / 天球儀</p>
      <h1
        className="glitch font-display text-sunset text-4xl font-black tracking-wider italic sm:text-6xl"
        data-text="POP★STARS"
      >
        POP★STARS
      </h1>
      <p className="font-pixel text-ink-dim mt-1 text-xs">
        ドラッグで回転 ・ ホイール／ピンチでズーム
      </p>
    </header>
  );
}
