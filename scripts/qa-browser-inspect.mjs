import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ARTIFACT_DIR = "/Users/theomichels/.gemini/antigravity/brain/7a13d5bd-c5f2-4ae1-8dc3-a7beb82c5ae1";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9222;

// 1. Obtenir une session Supabase fraîche pour michelstheo1@gmail.com
async function getSupabaseSession() {
  const envFile = await fs.readFile(".env", "utf8");
  const env = Object.fromEntries(
    envFile
      .split("\n")
      .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => {
        const idx = l.indexOf("=");
        const k = l.slice(0, idx).trim();
        const v = l.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        return [k, v];
      })
  );

  const admin = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const client = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: "michelstheo1@gmail.com",
  });
  if (linkErr) throw linkErr;

  const { data: authData, error: authErr } = await client.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink",
  });
  if (authErr) throw authErr;

  return authData.session;
}

// 2. Client CDP minimaliste via WebSocket natif
class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    this.consoleErrors = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id && this.pending.has(data.id)) {
          const { resolve, reject } = this.pending.get(data.id);
          this.pending.delete(data.id);
          if (data.error) reject(new Error(data.error.message));
          else resolve(data.result);
        } else if (data.method) {
          if (data.method === "Runtime.consoleAPICalled") {
            const type = data.params.type;
            const text = data.params.args.map((a) => a.value || a.description).join(" ");
            if (type === "error") {
              this.consoleErrors.push(text);
            }
          }
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send("Runtime.evaluate", {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }

  async screenshot(filePath) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    const buf = Buffer.from(res.data, "base64");
    await fs.writeFile(filePath, buf);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function main() {
  console.log("1. Récupération de la session Supabase...");
  const session = await getSupabaseSession();
  console.log("✔ Session active générée pour :", session.user.email);

  const userDataDir = `/tmp/chrome-test-profile-${Date.now()}`;
  console.log("2. Lancement de Chrome headless...");
  const chromeProc = spawn(CHROME_PATH, [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ]);

  try {
    // Attendre que le port CDP réponde
    let targetWs = null;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${PORT}/json`);
        const targets = await res.json();
        const page = targets.find((t) => t.type === "page");
        if (page?.webSocketDebuggerUrl) {
          targetWs = page.webSocketDebuggerUrl;
          break;
        }
      } catch {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    if (!targetWs) throw new Error("Impossible de se connecter au port CDP de Chrome");

    const client = new CdpClient(targetWs);
    await client.connect();
    await client.send("Page.enable");
    await client.send("Runtime.enable");

    // Émulation Mobile iPhone (375x812, ratio 3)
    console.log("3. Configuration de l'émulation Mobile Safari (375x812)...");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await client.send("Emulation.setUserAgentOverride", {
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });

    // Navigation initiale vers le domaine local pour injecter localStorage
    console.log("4. Injection du token Supabase dans localStorage...");
    await client.send("Page.navigate", { url: "http://localhost:8081" });
    await new Promise((r) => setTimeout(r, 1500));

    // Clé standard Supabase
    const storageKey = "sb-skzehjvqvdbxfehbrgzu-auth-token";
    await client.eval(`
      window.localStorage.setItem(${JSON.stringify(storageKey)}, ${JSON.stringify(JSON.stringify(session))});
    `);

    // Rechargement pour monter l'application authentifiée
    console.log("5. Chargement de l'application connectée sur Mobile Safari...");
    await client.send("Page.navigate", { url: "http://localhost:8081" });
    await new Promise((r) => setTimeout(r, 3500));

    // Sélectionner l'index 0 (Aujourd'hui / mois en cours)
    console.log("5b. Positionnement sur l'index 0 (Aujourd'hui)...");
    await client.eval(`
      (() => {
        const svg = document.querySelector('svg');
        if (svg) {
          const rect = svg.getBoundingClientRect();
          // padding.left est environ 44-54px, donc x=rect.left + 45 correspond à index 0
          const clickX = rect.left + 45;
          const clickY = rect.top + rect.height * 0.5;
          const evt = new PointerEvent('pointerdown', { clientX: clickX, clientY: clickY, bubbles: true });
          svg.dispatchEvent(evt);
        }
      })()
    `);
    await new Promise((r) => setTimeout(r, 1000));

    // Audit du DOM et des alignements
    const inspection = await client.eval(`
      (() => {
        const header = document.querySelector('[data-testid="chart-card-header"]');
        const dateEl = document.querySelector('[data-testid="chart-date-headline"]');
        const capEl = document.querySelector('[data-testid="chart-capital-value"]');
        const diffBadge = document.querySelector('[data-testid="chart-diff-badge"]');
        const projCard = document.querySelector('[data-testid="kpi-projected-card"]');
        const projGains = document.querySelector('[data-testid="kpi-projected-gains"]');

        const headerRect = header ? header.getBoundingClientRect() : null;
        const dateRect = dateEl ? dateEl.getBoundingClientRect() : null;
        const capRect = capEl ? capEl.getBoundingClientRect() : null;
        const projRect = projCard ? projCard.getBoundingClientRect() : null;

        return {
          found: {
            header: !!header,
            date: !!dateEl,
            capital: !!capEl,
            diffBadge: !!diffBadge,
            projCard: !!projCard,
            projGains: !!projGains,
          },
          dateText: dateEl ? dateEl.innerText : null,
          capitalText: capEl ? capEl.innerText : null,
          diffBadgeText: diffBadge ? diffBadge.innerText : null,
          projGainsText: projGains ? projGains.innerText : null,
          headerHeight: headerRect ? headerRect.height : null,
          projCardHeight: projRect ? projRect.height : null,
          // Vérification géométrique de non-wrapping : les hauts (tops) de la date et du montant doivent être quasiment alignés
          dateTop: dateRect ? dateRect.top : null,
          capTop: capRect ? capRect.top : null,
          isVerticallyStacked: dateRect && capRect ? (capRect.top > dateRect.bottom - 4) : false,
        };
      })()
    `);

    console.log("\n📊 RÉSULTAT DE L'INSPECTION VISUELLE (INDEX 0 / AUJOURD'HUI) :");
    console.log(JSON.stringify(inspection, null, 2));

    // Prendre capture d'écran mobile index 0
    const shotTodayPath = path.join(ARTIFACT_DIR, "proof_mobile_safari_today.png");
    await client.screenshot(shotTodayPath);
    console.log("✔ Capture d'écran enregistrée :", shotTodayPath);

    // Déplacement vers un mois futur (ex: clic au milieu du graphe ou modification)
    console.log("6. Test du comportement en faisant défiler le slider / mois futur...");
    await client.eval(`
      (() => {
        // Déclencher un clic/pointer au 60% de la largeur du graphe
        const svg = document.querySelector('svg');
        if (svg) {
          const rect = svg.getBoundingClientRect();
          const clickX = rect.left + rect.width * 0.6;
          const clickY = rect.top + rect.height * 0.5;
          const evt = new PointerEvent('pointerdown', { clientX: clickX, clientY: clickY, bubbles: true });
          svg.dispatchEvent(evt);
        }
      })()
    `);
    await new Promise((r) => setTimeout(r, 1000));

    const futureInspection = await client.eval(`
      (() => {
        const diffBadge = document.querySelector('[data-testid="chart-diff-badge"]');
        const projCard = document.querySelector('[data-testid="kpi-projected-card"]');
        const projGains = document.querySelector('[data-testid="kpi-projected-gains"]');
        const projRect = projCard ? projCard.getBoundingClientRect() : null;

        return {
          diffBadgeText: diffBadge ? diffBadge.innerText : null,
          projGainsText: projGains ? projGains.innerText : null,
          projCardHeight: projRect ? projRect.height : null,
        };
      })()
    `);
    console.log("\n📊 RÉSULTAT DE L'INSPECTION VISUELLE (MOIS FUTUR) :");
    console.log(JSON.stringify(futureInspection, null, 2));

    const shotFuturePath = path.join(ARTIFACT_DIR, "proof_mobile_safari_future.png");
    await client.screenshot(shotFuturePath);
    console.log("✔ Capture d'écran enregistrée :", shotFuturePath);

    // Revenir à l'index 0 (clic tout à gauche du graphe)
    console.log("7. Retour à l'index 0 (Aujourd'hui) pour vérifier le delta de hauteur...");
    await client.eval(`
      (() => {
        const svg = document.querySelector('svg');
        if (svg) {
          const rect = svg.getBoundingClientRect();
          const clickX = rect.left + 50;
          const clickY = rect.top + rect.height * 0.5;
          const evt = new PointerEvent('pointerdown', { clientX: clickX, clientY: clickY, bubbles: true });
          svg.dispatchEvent(evt);
        }
      })()
    `);
    await new Promise((r) => setTimeout(r, 1000));

    const backInspection = await client.eval(`
      (() => {
        const projCard = document.querySelector('[data-testid="kpi-projected-card"]');
        const projRect = projCard ? projCard.getBoundingClientRect() : null;
        return {
          projCardHeight: projRect ? projRect.height : null,
        };
      })()
    `);
    console.log("\n📊 RÉSULTAT DE L'INSPECTION (RETOUR AUJOURD'HUI) :");
    console.log(JSON.stringify(backInspection, null, 2));

    // Capture Desktop
    console.log("8. Inspection Desktop (1280x800)...");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await new Promise((r) => setTimeout(r, 500));
    const shotDesktopPath = path.join(ARTIFACT_DIR, "proof_desktop.png");
    await client.screenshot(shotDesktopPath);
    console.log("✔ Capture d'écran enregistrée :", shotDesktopPath);

    console.log("\n9. Vérification des erreurs console :");
    console.log("Console errors:", client.consoleErrors.length);
    if (client.consoleErrors.length > 0) {
      console.error("Erreurs trouvées :", client.consoleErrors);
    }

    client.close();
  } finally {
    chromeProc.kill();
    try {
      await fs.rm(userDataDir, { recursive: true, force: true });
    } catch {}
  }
}

main().catch((err) => {
  console.error("Erreur critique QA :", err);
  process.exit(1);
});
