// Builds ../why-route.html: the bento section, with the Hairline kernel and both figures inline.
// Run from the repo root: node sections/why-route/build.mjs
import { readFileSync, writeFileSync } from "node:fs";
const here = new URL(".", import.meta.url).pathname;
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const out = read("template.html")
  .replace("/*KERNEL*/", () => read("../../.agents/skills/hairline-create/kernel.js").trim())
  .replace("/*STEPS*/", () => read("steps.js"))
  .replace("/*KEYS*/", () => read("keys.js"));
writeFileSync(here + "../why-route.html", out);
console.log("wrote sections/why-route.html");
