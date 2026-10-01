import { chromium } from "playwright";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.DEMO_BASE_URL ?? "http://localhost:3001";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "demos");
const WIDTH = 1440;
const HEIGHT = 900;

rmSync(path.join(OUT, "videos"), { recursive: true, force: true });
rmSync(path.join(OUT, "screenshots"), { recursive: true, force: true });

const groups = [
  {
    name: "landing",
    views: [
      { path: "/", name: "landing" },
      { path: "/login", name: "login" },
      { path: "/design-system", name: "design-system" },
    ],
  },
  {
    name: "miembro",
    user: "miembro",
    views: [
      { path: "/inicio", name: "inicio" },
      { path: "/eventos", name: "eventos" },
      { path: "/personas", name: "personas" },
      { path: "/recursos", name: "recursos" },
      { path: "/perfil", name: "perfil" },
      { path: "/perfil/nuevo", name: "crear-perfil" },
    ],
  },
  {
    name: "capitulo",
    user: "presidente1",
    views: [
      { path: "/login/capitulo", name: "login-capitulo" },
      { path: "/admin", name: "panel" },
      { path: "/admin/miembros", name: "miembros" },
      { path: "/admin/validaciones", name: "validaciones" },
      { path: "/admin/eventos", name: "eventos" },
      { path: "/admin/financiamiento", name: "financiamiento" },
      { path: "/admin/capitulos", name: "capitulos" },
      { path: "/admin/capitulos/utec", name: "junta-utec" },
      { path: "/admin/invitaciones", name: "invitaciones" },
    ],
  },
  {
    name: "board",
    user: "luis",
    views: [
      { path: "/login/board", name: "login-board" },
      { path: "/board", name: "overview" },
      { path: "/board/capitulos", name: "capitulos" },
      { path: "/board/validaciones", name: "validaciones" },
      { path: "/board/financiamiento", name: "financiamiento" },
      { path: "/board/invitaciones", name: "invitaciones" },
      { path: "/board/equipo", name: "equipo" },
    ],
  },
  {
    name: "empresa",
    user: "recruiter",
    views: [
      { path: "/empresa/login", name: "login" },
      { path: "/empresa", name: "explorar" },
      { path: "/empresa/guardados", name: "guardados" },
      { path: "/empresa/talento/t1", name: "perfil-talento" },
      { path: "/empresa/ayuda", name: "ayuda" },
      { path: "/empresa/cuenta", name: "cuenta" },
    ],
  },
  {
    name: "legal",
    views: [
      { path: "/privacidad", name: "privacidad" },
      { path: "/terminos", name: "terminos" },
      { path: "/cookies", name: "cookies" },
      { path: "/reembolsos", name: "reembolsos" },
      { path: "/eliminar-datos", name: "eliminar-datos" },
    ],
  },
];

async function recordView(browser, group, view) {
  const ctx = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    recordVideo: {
      dir: path.join(OUT, "videos", group.name),
      size: { width: WIDTH, height: HEIGHT },
    },
  });
  const page = await ctx.newPage();
  if (view.user) {
    await page.addInitScript((id) => {
      try {
        localStorage.setItem("lead-view-as", id);
      } catch {}
    }, view.user);
  }
  await page.goto(BASE + view.path, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2400);
  mkdirSync(path.join(OUT, "screenshots", group.name), { recursive: true });
  await page.screenshot({ path: path.join(OUT, "screenshots", group.name, `${view.name}.png`) });
  await page.waitForTimeout(500);
  await ctx.close();
  console.log(`  ✓ ${group.name}/${view.name}`);
}

const browser = await chromium.launch();
console.log("Grabando demos →", path.resolve(OUT));
for (const group of groups) {
  console.log(`\n== ${group.name}${group.user ? ` (como ${group.user})` : ""} ==`);
  for (const view of group.views) {
    try {
      await recordView(browser, group, view);
    } catch (error) {
      console.error(`  ✗ ${group.name}/${view.name}: ${error.message}`);
    }
  }
}
await browser.close();
console.log("\nListo. Videos en demos/videos/ · capturas en demos/screenshots/");