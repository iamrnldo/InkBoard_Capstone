const axios = require("axios");
const crypto = require("crypto");

class TurnstileSolver {
  constructor() {
    this.solverURL = "https://cf-solver-renofc.my.id/api/solvebeta";
  }

  async solve(url, siteKey, mode = "turnstile-min") {
    const response = await axios.post(
      this.solverURL,
      {
        url: url,
        siteKey: siteKey,
        mode: mode,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 45000, // solver itself can be slow
      },
    );
    return response.data.token.result.token;
  }
}

class AIBanana {
  constructor() {
    this.baseURL = "https://aibanana.net";
    this.siteKey = "0x4AAAAAAAB2-fh9F_EBQqG2_";
    this.solver = new TurnstileSolver();
  }

  generateFingerprint() {
    return crypto
      .createHash("sha256")
      .update(crypto.randomBytes(32))
      .digest("hex");
  }

  generateDeviceId() {
    return crypto.randomBytes(8).toString("hex");
  }

  generateRandomUserAgent() {
    const osList = [
      "Windows NT 10.0; Win64; x64",
      "Macintosh; Intel Mac OS X 10_15_7",
      "X11; Linux x86_64",
    ];
    const os = osList[Math.floor(Math.random() * osList.length)];
    const chromeVersion = Math.floor(Math.random() * 40) + 110;
    return `Mozilla/5.0 (${os}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion}.0.0.0 Safari/537.36`;
  }

  generateRandomViewport() {
    const resolutions = [
      { w: 1366, h: 768 },
      { w: 1920, h: 1080 },
      { w: 1440, h: 900 },
      { w: 1536, h: 864 },
      { w: 1280, h: 720 },
      { w: 1600, h: 900 },
      { w: 2560, h: 1440 },
      { w: 1680, h: 1050 },
      { w: 1024, h: 768 },
    ];
    return resolutions[Math.floor(Math.random() * resolutions.length)];
  }

  generateRandomPlatform() {
    return ["Windows", "Linux", "macOS", "Chrome OS"][
      Math.floor(Math.random() * 4)
    ];
  }

  generateRandomLanguage() {
    return [
      "en-US,en;q=0.9",
      "id-ID,id;q=0.9,en-US;q=0.8",
      "en-GB,en;q=0.9",
      "es-ES,es;q=0.9",
    ][Math.floor(Math.random() * 4)];
  }

  async generateImage(prompt, model = "nano-banana-2") {
    const maxRetries = 2;
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `[AIBanana] Attempt ${attempt}/${maxRetries} for model ${model}`,
        );
        const turnstileToken = await this.solver.solve(
          this.baseURL,
          this.siteKey,
          "turnstile-min",
        );

        const fingerprint = this.generateFingerprint();
        const deviceId = this.generateDeviceId();
        const userAgent = this.generateRandomUserAgent();
        const viewport = this.generateRandomViewport();
        const platform = this.generateRandomPlatform();
        const language = this.generateRandomLanguage();
        const chromeVersion = Math.floor(Math.random() * 30) + 110;
        const randomIP = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

        const response = await axios.post(
          `${this.baseURL}/api/image-generation`,
          {
            prompt: prompt,
            model: model,
            mode: "text-to-image",
            numImages: 1,
            aspectRatio: "1:1",
            clientFingerprint: fingerprint,
            turnstileToken: turnstileToken,
            deviceId: deviceId,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "*/*",
              "Accept-Language": language,
              Origin: this.baseURL,
              Referer: `${this.baseURL}/`,
              "User-Agent": userAgent,
              "Sec-Ch-Ua": `"Chromium";v="${chromeVersion}", "Not-A.Brand";v="24", "Google Chrome";v="${chromeVersion}"`,
              "Sec-Ch-Ua-Mobile": "?0",
              "Sec-Ch-Ua-Platform": `"${platform}"`,
              "Viewport-Width": viewport.w.toString(),
              "Viewport-Height": viewport.h.toString(),
              "X-Forwarded-For": randomIP,
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
            timeout: 120000,
          },
        );

        console.log(
          "[AIBanana] Success, response keys:",
          Object.keys(response.data || {}),
        );
        return response.data;
      } catch (error) {
        lastError = error;
        console.error(
          `[AIBanana] Attempt ${attempt} failed:`,
          error.response?.status,
          error.response?.data || error.message,
        );
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 1500 * attempt)); // backoff
        }
      }
    }
    console.error("[AIBanana] All retries failed for image generation");
    throw lastError;
  }
}

const aibanana = new AIBanana();

async function generateDiagramImage(prompt) {
  try {
    // Use a prompt optimized for diagram generation - aim for complex, neat, Lucidchart-like professional diagrams
    const diagramPrompt = `Create a detailed, professional, clean and complex flowchart or diagram for: ${prompt}. Include many logical steps, decision points (diamonds), processes (rectangles), start/end (ovals), labeled arrows. Use modern clean vector style, white background, clear readable text in Indonesian or English, good spacing and layout like professional tools (Lucidchart, Draw.io). Make it visually rich and complete.`;

    const result = await aibanana.generateImage(diagramPrompt, "nano-banana-2");
    return result;
  } catch (error) {
    console.error("[AIBanana] generateDiagramImage failed:", error.message);
    throw error;
  }
}

module.exports = { generateDiagramImage, AIBanana };
