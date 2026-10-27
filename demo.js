// The hero demo: two phones sharing one grocery list, sorted by the app's own aisle rules (aisles.js).
// Plays one example on its own, then hands over to the visitor.
(() => {
  const root = document.querySelector("[data-demo]");
  if (!root || typeof Aisles === "undefined") return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const form = root.querySelector("form");
  const input = form.querySelector("input");
  const mirror = root.querySelector("[data-mirror]");
  const lists = [...root.querySelectorAll("[data-list]")];
  const banner = root.querySelector("[data-banner]");
  const wire = root.querySelector("[data-wire]");
  const live = root.querySelector("[data-live]");
  const counts = [...root.querySelectorAll("[data-count]")];

  let items = [
    { id: 1, title: "Tomatoes", quantity: "6", aisle: "veggies", by: "Wife", done: false },
    { id: 2, title: "Bread", quantity: null, aisle: "bakery", by: "Wife", done: false },
  ];
  let nextId = 3;
  let autoplay = !reduce;

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  // Draw one phone's list: aisles in the order you walk the shop, then what's already in the cart.
  function render(list, fresh) {
    const open = items.filter((i) => !i.done), done = items.filter((i) => i.done);
    let html = "";
    for (const aisle of Aisles.WALK) {
      const here = open.filter((i) => i.aisle === aisle);
      if (!here.length) continue;
      html += `<li class="aisle"><span aria-hidden="true">${Aisles.EMOJI[aisle]}</span>${Aisles.TITLES[aisle]}<i>${here.length}</i></li>`;
      html += `<li class="rows"><ul>${here.map((i) => row(i, fresh)).join("")}</ul></li>`;
    }
    if (done.length) {
      html += `<li class="aisle"><span aria-hidden="true">🛒</span>In the cart<i>${done.length}</i></li>`;
      html += `<li class="rows"><ul>${done.map((i) => row(i, fresh)).join("")}</ul></li>`;
    }
    list.innerHTML = html;
  }
  function row(i, fresh) {
    return `<li class="item${i.done ? " done" : ""}${fresh.has(i.id) ? " fresh" : ""}"><button type="button" data-id="${i.id}"
      aria-pressed="${i.done}" aria-label="${esc(i.title)}${i.quantity ? ", " + esc(i.quantity) : ""}${i.done ? ", in the cart" : ""}">
      <span class="tick" aria-hidden="true"></span><span class="t"><b>${esc(i.title)}</b>${i.quantity ? `<em>${esc(i.quantity)}</em>` : ""}
      <small><span class="dot" aria-hidden="true"></span>${esc(i.by)} · ${i.id > 2 ? "now" : "2 hr. ago"}</small></span></button></li>`;
  }
  function count() {
    const n = items.filter((i) => !i.done).length;
    counts.forEach((c) => (c.textContent = n));
  }

  // Your phone updates at once; theirs a beat later, the way iCloud does.
  function sync(fresh, note) {
    render(lists[0], fresh);
    count();
    if (reduce) { render(lists[1], fresh); if (note) showBanner(note); return; }
    wire.classList.remove("go"); void wire.offsetWidth; wire.classList.add("go");
    setTimeout(() => { render(lists[1], fresh); if (note) showBanner(note); }, 650);
  }
  let bannerTimer;
  function showBanner(text) {
    banner.querySelector("[data-text]").textContent = text;
    banner.classList.remove("show"); void banner.offsetWidth; banner.classList.add("show");
    live.textContent = "On their phone: " + text;
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => banner.classList.remove("show"), 4200);
  }
  const listText = (names) => names.length < 2 ? names[0] : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];

  function add(text) {
    const parsed = Aisles.parse(text).slice(0, 8);
    if (!parsed.length) return;
    const fresh = new Set();
    for (const p of parsed) {
      const id = nextId++;
      items.push({ id, ...p, by: "You", done: false });
      fresh.add(id);
    }
    items = items.slice(-14);
    sync(fresh, `You added ${listText(parsed.map((p) => p.title.toLowerCase()))} to the groceries list`);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    stopAutoplay();
    add(input.value);
    input.value = "";
    mirror.textContent = "";
  });
  input.addEventListener("input", () => { stopAutoplay(); mirror.textContent = input.value; });
  input.addEventListener("focus", stopAutoplay);
  root.querySelectorAll("[data-try]").forEach((b) => b.addEventListener("click", () => {
    stopAutoplay();
    add(b.dataset.try);
  }));
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-id]");
    if (!b) return;
    const it = items.find((i) => i.id === +b.dataset.id);
    it.done = !it.done;
    sync(new Set(), null);
  });

  // The opening example, typed out once.
  const example = "milk, dhana, 2 kg rice";
  let typing;
  function stopAutoplay() {
    if (!autoplay) return;
    autoplay = false;
    clearTimeout(typing);
    input.placeholder = "Your turn: paneer, bhinda, 6 bananas…";
  }
  function type(i) {
    if (!autoplay) return;
    if (i <= example.length) {
      mirror.textContent = example.slice(0, i);
      typing = setTimeout(() => type(i + 1), i === 0 ? 900 : 55 + Math.random() * 45);
    } else {
      typing = setTimeout(() => {
        if (!autoplay) return;
        add(example);
        mirror.textContent = "";
        autoplay = false;
        input.placeholder = "Your turn: paneer, bhinda, 6 bananas…";
      }, 450);
    }
  }

  render(lists[0], new Set());
  render(lists[1], new Set());
  count();
  if (autoplay) {
    // Start when the hero is actually on screen.
    const io = new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { o.disconnect(); type(0); } });
    io.observe(root);
  } else {
    input.placeholder = "Try: milk, dhana, 2 kg rice";
  }
})();
