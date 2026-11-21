const NEMOTRON_BASE_URL =
    import.meta.env.VITE_NEMOTRON_BASE_URL || "http://nvidia.com";
const NEMOTRON_API_KEY = import.meta.env.VITE_NEMOTRON_API_KEY || "null";
const NEMOTRON_MODEL =
    import.meta.env.VITE_NEMOTRON_MODEL ||
    "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-FP8";

/**
 * Queries NVIDIA Nemotron using the complex matrix pattern-matching telemetry
 * to evaluate user signing accuracy and provide actionable coaching.
 */
export async function getNemotronFeedback({
    targetSign,
    mode = "lesson",
    matrixResult,
}) {
    const {
        topMatch = "None",
        confidence = 0,
        runnerUp = "None",
        runnerUpScore = 0,
        isDynamicMotion = false,
        motionPathSummary = "Static hold",
        fingerCurlProfile = {},
    } = matrixResult || {};

    const systemPrompt = `You are Signly's real-time American Sign Language (ASL) coach powered by NVIDIA Nemotron.
Analyze the user's signing attempt against the Target Sign using the Complex Matrix telemetry (trained on the Google Kaggle ASL dataset).

Pay special attention to:
1. Dynamic multi-motion signs: 'J' requires extending the pinky ('I' shape) and scooping downward in a J-curve; 'Z' requires tracing a Z with the index finger.
2. Visually similar static letters:
   - 'M' has THREE fingers (index, middle, ring) draped over the tucked thumb.
   - 'N' has TWO fingers (index, middle) draped over the tucked thumb, with the ring finger tucked underneath.
   - 'A', 'S', 'T', 'E' differ by exact thumb placement across or against the curled fingers.

Respond ONLY with a valid JSON object matching this exact schema:
{
  "isCorrect": boolean,
  "score": number,
  "headline": "Short 3-5 word status",
  "feedback": "1-2 concise, encouraging sentences explaining whether they signed it right or what needs adjustment.",
  "suggestions": ["Specific improvement 1", "Specific improvement 2"]
}`;

    const userPrompt = `Mode: ${mode}
Target Sign: "${targetSign}"
Complex Matrix Top Match: "${topMatch}" (${Math.round(confidence * 100)}% confidence)
Complex Matrix Runner-Up: "${runnerUp}" (${Math.round(runnerUpScore * 100)}% confidence)
Dynamic Motion Detected: ${isDynamicMotion ? "Yes" : "No"} — ${motionPathSummary}
Finger & Thumb Geometry: ${JSON.stringify(fingerCurlProfile)}

Evaluate whether the user is signing "${targetSign}" accurately and give clear feedback/suggestions.`;

    try {
        const endpoint = NEMOTRON_BASE_URL.endsWith("/v1")
            ? `${NEMOTRON_BASE_URL}/chat/completions`
            : `${NEMOTRON_BASE_URL}/v1/chat/completions`;

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${NEMOTRON_API_KEY}`,
            },
            body: JSON.stringify({
                model: NEMOTRON_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                temperature: 0.2,
                max_tokens: 260,
            }),
        });

        if (!response.ok) {
            throw new Error(`Nemotron HTTP ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error("Non-JSON response from Nemotron");
    } catch {
        // Intelligent fallback powered by Complex Matrix telemetry when API key is "null" or offline
        return generateTelemetryCoaching(targetSign, matrixResult);
    }
}

function generateTelemetryCoaching(targetSign, matrixResult) {
    const target = (targetSign || "").trim().toUpperCase();
    const top = (matrixResult?.topMatch || "").toUpperCase();
    const conf = matrixResult?.confidence || 0;
    const pct = Math.round(conf * 100);
    const isCorrect = top === target && conf >= 0.72;

    if (isCorrect) {
        return {
            isCorrect: true,
            score: pct,
            headline: `Spot on! "${target}" matched`,
            feedback: `Your hand posture and motion match "${target}" (${pct}% complex matrix confidence).`,
            suggestions: ["Hold steady briefly to lock in your progress."],
        };
    }

    const suggestions = [];
    if (target === "J") {
        suggestions.push(
            "Start in an 'I' handshape (pinky up, other fingers curled), then scoop your pinky downward in a 'J' curve."
        );
    } else if (target === "Z") {
        suggestions.push(
            "Point your index finger forward and trace a clear 'Z' shape in the air."
        );
    } else if (target === "M") {
        suggestions.push(
            "Tuck your thumb under THREE fingers (index, middle, and ring) so your thumb peeks between the ring and pinky."
        );
    } else if (target === "N") {
        suggestions.push(
            "Tuck your thumb under only TWO fingers (index and middle), keeping your ring and pinky fingers curled down."
        );
    } else if (target === "T") {
        suggestions.push(
            "Tuck your thumb directly between your index and middle fingers."
        );
    } else if (target === "S") {
        suggestions.push(
            "Make a tight fist with your thumb wrapped across the front of your curled fingers."
        );
    } else if (target === "A") {
        suggestions.push(
            "Keep all four fingers curled into the palm with your thumb resting upright along the side of your index finger."
        );
    } else {
        suggestions.push(
            `Adjust finger extension toward "${target}" (matrix currently sees "${top || "no clear sign"}").`
        );
        suggestions.push(
            "Keep your hand centered in the camera frame with good lighting."
        );
    }

    return {
        isCorrect: false,
        score: pct,
        headline: `Adjusting for "${target}"`,
        feedback: top
            ? `Currently reading "${top}" (${pct}%) instead of "${target}".`
            : "Raise your hand into the camera frame to start matching.",
        suggestions,
    };
}
