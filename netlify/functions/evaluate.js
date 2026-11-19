exports.handler = async function (event) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Server API Key is not configured." })
        };
    }

    try {
        const { parts } = JSON.parse(event.body);
        const models = ["gemini-3.8-flash", "gemini-3.5-flash-lite"];
        let resultData = null;
        let lastError = "";

        for (const modelName of models) {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: parts }],
                        generationConfig: {
                            responseMimeType: "application/json",
                            maxOutputTokens: 1200
                        }
                    })
                }
            );

            const data = await response.json();
            if (data.error) {
                lastError = data.error.message;
                continue;
            }

            resultData = {
                text: data.candidates[0].content.parts[0].text,
                model: modelName
            };
            break;
        }

        if (resultData) {
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(resultData)
            };
        } else {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: lastError || "AI evaluation failed." })
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
