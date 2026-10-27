// Saath site motion. Everything here only adds to a page that already reads fine without it.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Features: the step nearest the middle of the screen is "on", and the phone shows its screen.
  const steps = [...document.querySelectorAll(".step")];
  const screens = [...document.querySelectorAll(".screen")];
  const show = (i) => {
    steps.forEach((s, j) => s.classList.toggle("on", j === i));
    screens.forEach((s, j) => s.classList.toggle("on", j === i));
  };
  if (steps.length) {
    show(0);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) show(steps.indexOf(e.target));
    }, { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach((s) => io.observe(s));
  }

  // The three points come in once, together, as the section arrives.
  const points = document.querySelectorAll(".point");
  if (points.length && !reduce) {
    const io = new IntersectionObserver((entries, obs) => {
      if (entries.some((e) => e.isIntersecting)) {
        points.forEach((p) => p.classList.add("in"));
        obs.disconnect();
      }
    }, { rootMargin: "0px 0px -15% 0px" });
    io.observe(points[0]);
  }

  // Wall screen: scroll progress through the section turns day into evening.
  const dusk = document.querySelector(".dusk");
  if (dusk) {
    let queued = false;
    const update = () => {
      queued = false;
      const r = dusk.getBoundingClientRect();
      const travel = Math.max(1, r.height - innerHeight * 0.6);
      const raw = (innerHeight * 0.3 - r.top) / travel;
      // Quick through the middle, so text never sits long on a half-dark room.
      const x = Math.min(1, Math.max(0, (raw - 0.2) / 0.5));
      const p = x * x * (3 - 2 * x);
      dusk.style.setProperty("--p", p.toFixed(3));
      dusk.classList.toggle("night", p > 0.6);
    };
    const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    if (reduce) {
      dusk.style.setProperty("--p", "0");
    } else {
      addEventListener("scroll", onScroll, { passive: true });
      addEventListener("resize", onScroll);
      update();
    }
  }
})();
