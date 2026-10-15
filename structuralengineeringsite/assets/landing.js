(() => {
  "use strict";
  const menu = document.querySelector(".mobile-nav");
  menu?.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      menu.open = false;
    }),
  );
  const sections = [...document.querySelectorAll("main section[id]")];
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            document
              .querySelectorAll(".desktop-nav a")
              .forEach((a) =>
                a.toggleAttribute(
                  "aria-current",
                  a.hash === "#" + entry.target.id,
                ),
              );
          }
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
  }
})();

// Keep illustrative report tabs usable with arrow, Home and End keys.
document.querySelectorAll('.sample-tabs[role="tablist"]').forEach((list) => {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  function select(tab) {
    tabs.forEach((t) => {
      t.tabIndex = t === tab ? 0 : -1;
    });
  }
  tabs.forEach((tab, i) => {
    tab.tabIndex = i === 0 ? 0 : -1;
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (event) => {
      let target;
      if (["ArrowRight", "ArrowDown"].includes(event.key))
        target = tabs[(i + 1) % tabs.length];
      if (["ArrowLeft", "ArrowUp"].includes(event.key))
        target = tabs[(i + tabs.length - 1) % tabs.length];
      if (event.key === "Home") target = tabs[0];
      if (event.key === "End") target = tabs[tabs.length - 1];
      if (target) {
        event.preventDefault();
        target.click();
        target.focus();
      }
    });
  });
});
