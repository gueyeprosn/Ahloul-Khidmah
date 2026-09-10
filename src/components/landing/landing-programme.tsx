const pillars = [
  {
    title: "Foi",
    text: "Un engagement spirituel ancré dans le service de Serigne Touba.",
  },
  {
    title: "Discipline",
    text: "Une organisation par cellules locales, claire et régulière.",
  },
  {
    title: "Savoir",
    text: "Chaque talibé met une compétence concrète au service du collectif.",
  },
  {
    title: "Excellence",
    text: "Viser la qualité dans chaque contribution, grande ou modeste.",
  },
]

export function LandingProgramme() {
  return (
    <section
      id="programme"
      className="relative scroll-mt-20 border-t border-[var(--ak-gold)]/20 bg-[#08281A] px-5 py-24 md:px-8 md:py-32"
    >
      <div className="ak-pattern pointer-events-none absolute inset-0 opacity-20" />
      <div className="relative mx-auto max-w-6xl">
        <p className="text-xs font-semibold tracking-[0.25em] text-[var(--ak-gold)] uppercase">
          Programme national
        </p>
        <h2 className="mt-4 max-w-3xl font-[family-name:var(--font-amiri)] text-3xl leading-tight text-[var(--ak-ivory)] md:text-5xl">
          1 Talibé = 1 Compétence
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--ak-ivory)]/70 md:text-lg">
          Recensement national et adhésion pour rejoindre votre cellule locale à
          Touba et partout au Sénégal — et mettre votre expertise au service de
          la communauté.
        </p>

        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar, i) => (
            <div
              key={pillar.title}
              className="ak-reveal border-t border-[var(--ak-gold)]/35 pt-6"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <p className="font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-gold-light)]">
                {pillar.title}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--ak-ivory)]/65">
                {pillar.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
