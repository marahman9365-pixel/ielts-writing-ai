exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server API key is not configured." })
    };
  }

  try {
    const { parts } = JSON.parse(event.body);
    const models = ["gemini-3.8-flash", "gemini-3.5-flash-lite"];
    let resultData = null;
    let lastError = "";

    for (const modelName of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts }]
            })
          }
        );

        const data = await response.json();
        if (response.ok && data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          resultData = data;
          break;
        } else {
          lastError = data.error?.message || `HTTP ${response.status}`;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!resultData) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: `AI Model Error: ${lastError}` })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resultData)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
