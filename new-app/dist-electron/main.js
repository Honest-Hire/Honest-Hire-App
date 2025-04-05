import { app as u, BrowserWindow as k, ipcMain as h } from "electron";
import { fileURLToPath as S } from "node:url";
import c from "node:path";
import E from "node:fs";
const g = c.dirname(S(import.meta.url));
process.env.APP_ROOT = c.join(g, "..");
const p = process.env.VITE_DEV_SERVER_URL, I = c.join(process.env.APP_ROOT, "dist-electron"), b = c.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = p ? c.join(process.env.APP_ROOT, "public") : b;
let l;
const C = async () => {
  try {
    return l = (await import("./index-iGRs6nGM.js")).default, !0;
  } catch (e) {
    return console.error("Failed to initialize ps-list:", e), !1;
  }
};
C();
let n;
function v() {
  const e = c.join(g, "assets", "icon.png"), t = E.existsSync(e), s = {
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: c.join(g, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0
    },
    show: !1
  };
  t && (s.icon = e), n = new k(s), p ? n.loadURL(p) : n.loadFile(c.join(b, "index.html")), p && n.webContents.openDevTools(), n.once("ready-to-show", () => {
    n == null || n.show();
  }), n.on("closed", () => {
    n = null;
  });
}
u.on("window-all-closed", () => {
  process.platform !== "darwin" && (u.quit(), n = null);
});
u.on("activate", () => {
  k.getAllWindows().length === 0 && v();
});
u.whenReady().then(v);
h.handle("check-displays", async () => await P());
h.handle("check-screen-sharing", async () => await N());
h.handle("check-keyboards", async () => await R());
h.handle("check-interview-coder", async () => await T());
async function P() {
  try {
    const t = await (await import("./index-BQunaRZu.js").then((r) => r.i)).graphics(), s = t.displays ? t.displays.length : 0;
    return {
      success: !0,
      multipleDisplays: s > 1,
      displayCount: s
    };
  } catch (e) {
    return console.error("Error checking displays:", e), {
      success: !1,
      error: e instanceof Error ? e.message : "Unknown error"
    };
  }
}
async function N() {
  try {
    l || (l = (await import("./index-iGRs6nGM.js")).default);
    const e = await l(), t = [
      { name: "Zoom", processNames: ["zoom", "zoomshare", "caphost"] },
      { name: "Microsoft Teams", processNames: ["teams", "teams.exe"] },
      { name: "Discord", processNames: ["discord", "discord.exe"] },
      { name: "Skype", processNames: ["skype", "skype.exe"] },
      { name: "Google Meet", processNames: ["meet.google.com"] },
      { name: "WebEx", processNames: ["webex", "webexmta", "webexhost"] },
      {
        name: "OBS Studio",
        processNames: ["obs", "obs-studio", "obs64", "obs.exe"]
      },
      { name: "TeamViewer", processNames: ["teamviewer", "teamviewer.exe"] },
      { name: "AnyDesk", processNames: ["anydesk", "anydesk.exe"] },
      {
        name: "Chrome Remote Desktop",
        processNames: ["chrome-remote-desktop", "remoting_host"]
      },
      { name: "VLC", processNames: ["vlc", "vlc.exe"] },
      { name: "QuickTime Player", processNames: ["quicktimeplayer"] },
      { name: "Slack", processNames: ["slack", "slack.exe"] }
    ], s = [
      {
        name: "QuickTime Player Screen Recording",
        processNames: ["com.apple.screencapture", "QuickTimePlayerX"]
      },
      {
        name: "Screenshot App",
        processNames: ["Screenshot", "screencaptureui"]
      },
      { name: "ScreenFlow", processNames: ["screenflow"] },
      { name: "Loom", processNames: ["loom"] },
      { name: "Snagit", processNames: ["snagit", "snagiteditor"] }
    ], r = [...t];
    process.platform === "darwin" && r.push(...s);
    const o = [];
    for (const i of r)
      e.some((d) => {
        const w = (d.name || "").toLowerCase(), f = (d.cmd || "").toLowerCase();
        return i.processNames.some(
          (y) => w.includes(y.toLowerCase()) || f.includes(y.toLowerCase())
        );
      }) && o.push(i.name);
    const m = ["chrome", "firefox", "safari", "msedge"];
    let a = !1;
    for (const i of m)
      if (e.some((d) => {
        const w = (d.name || "").toLowerCase(), f = (d.cmd || "").toLowerCase();
        return w.includes(i) || f.includes(i);
      })) {
        a = !0;
        break;
      }
    return a && o.length > 0 && (o.includes("Browser-based screen sharing") || o.push("Browser-based screen sharing (possible)")), {
      success: !0,
      multipleShareTargets: o.length > 1,
      isScreenBeingShared: o.length > 0,
      sharingApps: o,
      browserDetected: a
    };
  } catch (e) {
    return console.error("Error checking screen sharing:", e), {
      success: !1,
      error: e instanceof Error ? e.message : "Unknown error"
    };
  }
}
async function R() {
  try {
    const s = (await (await import("./index-BQunaRZu.js").then((r) => r.i)).usb()).filter((r) => {
      const o = (r.name || "").toLowerCase(), m = (r.manufacturer || "").toLowerCase();
      return o.includes("keyboard") || o.includes("kbd") || m.includes("keyboard") || o.includes("input device") || o.includes("hid");
    });
    return {
      success: !0,
      multipleKeyboards: s.length > 1,
      keyboardCount: s.length,
      keyboards: s.map(
        (r) => r.name || "Unknown Keyboard"
      )
    };
  } catch (e) {
    return console.error("Error checking keyboards:", e), {
      success: !1,
      error: e instanceof Error ? e.message : "Unknown error"
    };
  }
}
async function T() {
  try {
    if (!l && !await C())
      throw new Error("Failed to initialize process list module");
    const e = await l(), t = [
      /interview\s*coder/i,
      /interview/i,
      /cheat/i,
      /hack/i,
      /Interview\s*Helper/i,
      /Code\s*Assist/i,
      /Interview\s*Buddy/i,
      /Code\s*Helper/i,
      /Interview\s*Assistant/i,
      /Code\s*Whisperer/i,
      /Interview\s*Whisperer/i
    ], s = e.filter((r) => {
      const o = (r.name || "").toLowerCase(), m = (r.cmd || "").toLowerCase();
      return console.log(o + `
`), t.some((a) => a.test(o) || a.test(m));
    });
    return console.log("Process check complete:", {
      processCount: e.length,
      interviewCoderDetected: s.length > 0,
      matchedProcesses: s
    }), {
      success: !0,
      interviewCoderDetected: s.length > 0,
      processCount: s.length
    };
  } catch (e) {
    return console.error("Error checking for interview coder:", e), {
      success: !1,
      error: e instanceof Error ? e.message : "Unknown error"
    };
  }
}
export {
  I as MAIN_DIST,
  b as RENDERER_DIST,
  p as VITE_DEV_SERVER_URL
};
