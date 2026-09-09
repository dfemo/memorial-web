export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 720 }}>
        <h2>About EverRemember</h2>
        <p className="lede">
          EverRemember is a peaceful digital place for families to honour the people they love —
          with stories, photographs, tributes, and privacy that stays in your hands.
        </p>
        <div className="soft-card">
          <p>
            We built EverRemember for moments when the internet should feel gentle: birthdays,
            anniversaries, and quiet evenings when someone wants to leave a memory.
          </p>
          <p style={{ marginBottom: 0 }}>
            The product is original. It is inspired by the broader category of online memorials,
            not by any single brand&apos;s identity or copyrighted materials.
          </p>
        </div>
      </div>
    </section>
  );
}
