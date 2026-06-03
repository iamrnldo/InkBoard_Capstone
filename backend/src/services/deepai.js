/*
 * DeepAI chat provider (free scrape).
 * Adapted from a snippet by Herza (https://github.com/herzonly) with syntax
 * fixes (the original had broken template-literal calls).
 *
 * Exposes `deepaiChat(query, imagePath?)` -> { content: string }.
 */
const https = require("https");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const API_KEY =
  process.env.DEEPAI_API_KEY ||
  "tryit-46250764014-3e32c7cea5e2c93bdfd535d9f80155c7";

function httpsPost(reqPath, fields, fileField = null) {
  return new Promise((resolve, reject) => {
    const boundary = "----" + crypto.randomBytes(16).toString("hex");
    const parts = [];

    for (const [key, val] of Object.entries(fields)) {
      parts.push(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}`,
      );
    }

    let body;
    if (fileField) {
      const { name, buffer, mime } = fileField;
      const head = Buffer.from(
        parts.join("\r\n") +
          `\r\n--${boundary}\r\n` +
          `Content-Disposition: form-data; name="file"; filename="${name}"\r\n` +
          `Content-Type: ${mime}\r\n\r\n`,
      );
      const tail = Buffer.from(`\r\n--${boundary}--`);
      body = Buffer.concat([head, buffer, tail]);
    } else {
      body = Buffer.from(parts.join("\r\n") + `\r\n--${boundary}--`);
    }

    const req = https.request(
      {
        hostname: "api.deepai.org",
        path: reqPath,
        method: "POST",
        headers: {
          "api-key": API_KEY,
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": body.length,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve(data));
      },
    );

    req.on("error", reject);
    req.setTimeout(60000, () => req.destroy(new Error("DeepAI request timed out")));
    req.write(body);
    req.end();
  });
}

async function uploadImage(filePath) {
  const buffer = fs.readFileSync(filePath);
  const name = path.basename(filePath);
  const mime = "image/jpeg";
  const res = await httpsPost("/chat_attachments/upload", {}, { name, buffer, mime });
  const data = JSON.parse(res);
  return data.attachment.uuid;
}

/**
 * Send a single text query (optionally with an image) to DeepAI chat.
 * @returns {Promise<{ content: string }>}
 */
async function deepaiChat(query, imagePath = null) {
  const sessionUuid = crypto.randomUUID();
  let attachmentUuids = [];

  if (imagePath) {
    const uuid = await uploadImage(imagePath);
    attachmentUuids = [uuid];
  }

  const message = { role: "user", content: query };
  if (attachmentUuids.length) message.attachment_uuids = attachmentUuids;
  const history = JSON.stringify([message]);

  await httpsPost("/save_chat_session", {
    uuid: sessionUuid,
    title: "",
    chat_style: "chat",
    messages: history,
  });

  const fields = {
    chat_style: "chat",
    chatHistory: history,
    model: "standard",
    session_uuid: sessionUuid,
    sensitivity_request_id: crypto.randomUUID(),
    hacker_is_stinky: "very_stinky",
    enabled_tools: JSON.stringify(["image_generator", "image_editor"]),
  };
  if (attachmentUuids.length) {
    fields.attachment_uuids = JSON.stringify(attachmentUuids);
  }

  const reply = await httpsPost("/hacking_is_a_serious_crime", fields);

  // DeepAI returns the assistant message as plain text (not JSON).
  return { content: String(reply || "").trim() };
}

module.exports = { deepaiChat };
