export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-20">
      <h1 className="font-serif text-4xl mb-2" style={{
        background: "linear-gradient(135deg, #fbbf24 0%, #d97706 40%, #92400e 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}>
        About Us
      </h1>
      <p className="text-stone-400 text-sm mb-10 tracking-wide uppercase">Our story</p>

      <div className="space-y-6 text-stone-600 leading-relaxed text-lg">
        <p>
          Georgia Suds was born from a simple belief — that the everyday ritual of washing your hands
          should feel like a small luxury. We craft each bar by hand in small batches, using only
          natural ingredients sourced from trusted suppliers.
        </p>
        <p>
          Every soap starts with a base of nourishing oils — olive, coconut, and shea — and is
          scented with pure essential oils and botanicals. No synthetic fragrances, no harsh
          chemicals, just honest ingredients that are good for your skin and kind to the planet.
        </p>
        <p>
          We believe beautiful things don't have to be complicated. Each bar is cured for a minimum
          of four weeks, resulting in a long-lasting, luxuriously creamy lather that you'll look
          forward to every single day.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
        {[
          { label: "Small-batch", detail: "Every bar made by hand" },
          { label: "Natural", detail: "No synthetic ingredients" },
          { label: "4-week cure", detail: "For a longer-lasting bar" },
        ].map(({ label, detail }) => (
          <div key={label} className="border border-amber-100 rounded-2xl p-6">
            <p className="font-serif text-2xl text-amber-800 mb-1">{label}</p>
            <p className="text-sm text-stone-500">{detail}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
