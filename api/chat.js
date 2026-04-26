export default async function handler(req, res) {
  try {
    const bodyData = typeof req.body === "string"
  ? JSON.parse(req.body)
  : req.body || {};

const { message, messages, images } = bodyData;

    // --- Build the text prompt ---
    let textPrompt = message;
    if (!textPrompt && messages) {
      // Fallback if the frontend ever sends an array of messages
      textPrompt = messages.map(m => m.content || "").join("\n");
    }

    // --- Build the parts array for Gemini ---
    const parts = [];

    // Add the text part if we have one
    if (textPrompt && textPrompt.trim().length > 0) {
      parts.push({ text: textPrompt });
    }

    // Add images as inline_data parts
    if (images && Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        if (img.base64 && img.mimeType) {
          parts.push({
            inline_data: {
              mime_type: img.mimeType,
              data: img.base64
            }
          });
        }
      }
    }

    // If there's nothing to send, respond with an error
    if (parts.length === 0) {
      return res.status(400).json({ error: "No content provided." });
    }

    // --- Call the Gemini API ---
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { parts }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
  const errMsg = data?.error?.message || `Upstream API error ${response.status}`;
  return res.status(response.status).json({ error: errMsg });
}

    // Success: return the full Gemini response
    res.status(200).json(data);

  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({ error: error.message });
  }
}