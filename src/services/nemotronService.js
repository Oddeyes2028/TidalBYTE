const NEMOTRON_BASE_URL =
    import.meta.env.VITE_NEMOTRON_BASE_URL || "http://nvidia.com";
const NEMOTRON_API_KEY = import.meta.env.VITE_NEMOTRON_API_KEY || "null";
const NEMOTRON_MODEL =
    import.meta.env.VITE_NEMOTRON_MODEL ||
    "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-FP8";

/**
 * Queries NVIDIA Nemotron using multi-dataset Complex Matrix telemetry
 * (Google Kaggle ASL, Microsoft ASL Citizen, WLASL, ChaLearn IsoGD)
 * to evaluate signing accuracy and provide clear, encouraging feedback.
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
Evaluate the user's signing attempt against the Target Sign using 3D palm-normalized Complex Matrix telemetry (trained on Google Kaggle ASL, Microsoft ASL Citizen, WLASL, and ChaLearn IsoGD).

Key disambiguation rules:
- Multi-word & single-word gestures (e.g., PLEASE = open palm rubbing chest in circles; HELLO = open hand saluting outward from forehead; THANK_YOU = fingertips moving forward from chin; NICE_TO_MEET_YOU = flat palms sliding, upright index fingers meeting, then pointing forward; I_LOVE_YOU = thumb, index, and pinky extended).
- Dynamic letters: 'J' scoops pinky downward from 'I'; 'Z' traces a Z with the index finger.
- Close/overlapping joint letters:
  - 'R' crosses middle finger behind index; 'U' holds index & middle tightly parallel; 'V' separates them.
  - 'A' rests thumb upright beside the fist; 'S' wraps thumb across the front of curled fingers.
  - 'M' drapes 3 fingers over the thumb; 'N' drapes 2 fingers over the thumb; 'T' tucks thumb between index and middle.
  - 'G' & 'H' point horizontally sideways; 'P' & 'Q' point downward.

Respond ONLY with a valid JSON object matching this exact schema:
{
  "isCorrect": boolean,
  "score": number,
  "headline": "Short 3-5 word status",
  "feedback": "1-2 concise, encouraging sentences explaining whether they signed it right or how to improve.",
  "suggestions": ["Specific improvement 1", "Specific improvement 2"]
}`;

    const userPrompt = `Mode: ${mode}
Target Sign: "${targetSign}"
Complex Matrix Top Match: "${topMatch}" (${Math.round(confidence * 100)}% confidence)
Complex Matrix Runner-Up: "${runnerUp}" (${Math.round(runnerUpScore * 100)}% confidence)
Dynamic Motion Detected: ${isDynamicMotion ? "Yes" : "No"} — ${motionPathSummary}
3D Palm & Joint Geometry: ${JSON.stringify(fingerCurlProfile)}

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
        return generateTelemetryCoaching(targetSign, matrixResult);
    }
}

function generateTelemetryCoaching(targetSign, matrixResult) {
    const target = (targetSign || "").trim().toUpperCase().replace(/\s+/g, "_");
    const top = (matrixResult?.topMatch || "").toUpperCase();
    const conf = matrixResult?.confidence || 0;
    const pct = Math.round(conf * 100);
    const isCorrect = top === target && conf >= 0.72;

    if (isCorrect) {
        return {
            isCorrect: true,
            score: pct,
            headline: `Spot on! "${target.replace(/_/g, " ")}" matched`,
            feedback: `Your posture and motion match "${target.replace(/_/g, " ")}" (${pct}% multi-dataset confidence).`,
            suggestions: ["Great form—ready for the next sign!"],
        };
    }

    const tipsByTarget = {
        PLEASE: [
            "Place your open flat hand directly over the center of your chest and rub in a steady circle.",
        ],
        HELLO: [
            "Bring your flat hand to your forehead/temple and move it outward in a small salute.",
        ],
        THANK_YOU: [
            "Touch your fingertips to your chin and move your hand forward toward the camera.",
        ],
        NICE_TO_MEET_YOU: [
            "Slide one flat palm across the other, bring both upright index fingers together, then point forward.",
        ],
        HOW_ARE_YOU: [
            "Roll curved knuckles forward in front of your chest, then point your index finger toward the camera.",
        ],
        I_LOVE_YOU: [
            "Extend your thumb, index finger, and pinky straight out while keeping your middle and ring fingers curled.",
        ],
        GOOD_MORNING: [
            "Touch your fingertips to your chin and lower onto your palm, then raise your arm up like the sunrise.",
        ],
        EXCUSE_ME: [
            "Brush the fingertips of your dominant hand forward twice across your opposite open palm.",
        ],
        WHERE_IS: [
            "Hold your index finger upright and wave it gently side-to-side.",
        ],
        BATHROOM: [
            "Form a 'T' handshape (thumb between index and middle fingers) and shake it side-to-side.",
        ],
        A: [
            "Keep all four fingers curled into your palm and rest your thumb upright beside your index finger (not across the front).",
        ],
        S: [
            "Wrap your thumb firmly across the front of your curled fingers.",
        ],
        T: [
            "Tuck your thumb cleanly between your index and middle fingers.",
        ],
        G: [
            "Turn your wrist sideways so your index finger and thumb point horizontally parallel to the floor.",
        ],
        H: [
            "Extend both your index and middle fingers horizontally side-by-side.",
        ],
        P: [
            "Form a 'K' shape and tilt your wrist downward so your middle finger points toward the floor.",
        ],
        Q: [
            "Point your index finger and thumb straight downward toward the floor.",
        ],
        R: [
            "Keep your index and middle fingers upright and cross your middle finger behind your index finger.",
        ],
        U: [
            "Hold your index and middle fingers straight up pressed tightly together without crossing them.",
        ],
        V: [
            "Separate your extended index and middle fingers into a clear 'V' shape.",
        ],
        M: [
            "Drape THREE fingers (index, middle, and ring) over your tucked thumb.",
        ],
        N: [
            "Drape TWO fingers (index and middle) over your tucked thumb, keeping your ring finger curled down.",
        ],
        J: [
            "Start with your pinky up ('I'), then scoop downward in a 'J' curve.",
        ],
        Z: [
            "Point your index finger forward and trace a clear 'Z' path in the air.",
        ],
    };

    const suggestions = tipsByTarget[target] || [
        `Adjust your finger angles toward "${target.replace(/_/g, " ")}" (currently reading "${top || "adjusting"}").`,
        "Keep your hand and upper torso centered in good lighting.",
    ];

    return {
        isCorrect: false,
        score: pct,
        headline: `Adjusting for "${target.replace(/_/g, " ")}"`,
        feedback:
            top && top !== "IN_PROGRESS"
                ? `Currently reading "${top.replace(/_/g, " ")}" (${pct}%) instead of "${target.replace(/_/g, " ")}".`
                : `Move into position for "${target.replace(/_/g, " ")}" in front of your camera.`,
        suggestions,
    };
}
