import React from "react";
import { colors } from "./theme";

/**
 * Generates an interactive visual handshape diagram & animated motion path SVG
 * for every ASL letter (A-Z) and Microsoft ASL Citizen phrase gesture so users
 * have an immediate visual reference of what to aim for.
 */
const HAND_CONFIGS = {
    A: { thumb: "side", fingers: [0, 0, 0, 0], badge: "Thumb upright beside fist" },
    B: { thumb: "across", fingers: [1, 1, 1, 1], badge: "4 fingers straight up" },
    C: { thumb: "curve", fingers: [0.6, 0.6, 0.6, 0.6], badge: "Curved C-handshape" },
    D: { thumb: "touch", fingers: [1, 0, 0, 0], badge: "Index up, others touch thumb" },
    E: { thumb: "tuck", fingers: [0.25, 0.25, 0.25, 0.25], badge: "Fingertips curled onto thumb" },
    F: { thumb: "pinch", fingers: [0.2, 1, 1, 1], badge: "Index+thumb circle, 3 up" },
    G: { thumb: "horiz", fingers: [1, 0, 0, 0], rotate: -75, badge: "Point index & thumb sideways" },
    H: { thumb: "across", fingers: [1, 1, 0, 0], rotate: -75, badge: "Index & middle sideways" },
    I: { thumb: "across", fingers: [0, 0, 0, 1], badge: "Pinky straight up" },
    J: { thumb: "across", fingers: [0, 0, 0, 1], motion: "J-curve", badge: "Scoop pinky in a J-hook" },
    K: { thumb: "between", fingers: [1, 1, 0, 0], spread: true, badge: "V-fingers with thumb between" },
    L: { thumb: "out", fingers: [1, 0, 0, 0], badge: "L-shape: index up, thumb out" },
    M: { thumb: "under3", fingers: [0.2, 0.2, 0.2, 0], badge: "3 fingers draped over thumb" },
    N: { thumb: "under2", fingers: [0.2, 0.2, 0, 0], badge: "2 fingers draped over thumb" },
    O: { thumb: "pinch", fingers: [0.5, 0.5, 0.5, 0.5], badge: "All fingertips meet thumb" },
    P: { thumb: "between", fingers: [1, 1, 0, 0], rotate: 135, badge: "K-hand tilted downward" },
    Q: { thumb: "horiz", fingers: [1, 0, 0, 0], rotate: 165, badge: "Index & thumb point down" },
    R: { thumb: "across", fingers: [1, 1, 0, 0], crossed: true, badge: "Cross middle behind index" },
    S: { thumb: "across", fingers: [0, 0, 0, 0], badge: "Thumb wrapped across fist" },
    T: { thumb: "between1", fingers: [0.2, 0, 0, 0], badge: "Thumb tucked under index" },
    U: { thumb: "across", fingers: [1, 1, 0, 0], badge: "Index & middle tight together" },
    V: { thumb: "across", fingers: [1, 1, 0, 0], spread: true, badge: "Index & middle spread in V" },
    W: { thumb: "across", fingers: [1, 1, 1, 0], spread: true, badge: "3 fingers spread in W" },
    X: { thumb: "across", fingers: [0.55, 0, 0, 0], badge: "Hooked index finger" },
    Y: { thumb: "out", fingers: [0, 0, 0, 1], badge: "Thumb & pinky extended" },
    Z: { thumb: "across", fingers: [1, 0, 0, 0], motion: "Z-path", badge: "Trace a Z with index finger" },
};

const PHRASE_VISUALS = {
    PLEASE: { icon: "✋↻", zone: "Center of Chest", motion: "Circular palm rub" },
    HELLO: { icon: "🫡↗", zone: "Forehead / Temple", motion: "Salute outward" },
    THANK_YOU: { icon: " Chin ↘", zone: "Chin to Viewer", motion: "Flat hand forward & down" },
    NICE_TO_MEET_YOU: { icon: "🤝→", zone: "Chest Level", motion: "Slide palms, meet index fingers, point" },
    HOW_ARE_YOU: { icon: "👐↗", zone: "Upper Chest", motion: "Roll knuckles forward & point" },
    I_LOVE_YOU: { icon: "🤟", zone: "Neutral Space", motion: "Thumb, index & pinky extended" },
    GOOD_MORNING: { icon: "🌅↗", zone: "Chin to Arm", motion: "Chin tap + rising arm" },
    GOOD_NIGHT: { icon: "🌙↘", zone: "Chin to Wrist", motion: "Chin tap + arcing downward" },
    EXCUSE_ME: { icon: "✋⇢", zone: "Open Palm", motion: "Brush fingertips forward twice" },
    WHERE_IS: { icon: "☝️↔", zone: "Neutral Space", motion: "Wave upright index side-to-side" },
    SORRY: { icon: "✊↻", zone: "Center of Chest", motion: "Circular fist rub on chest" },
    HELP: { icon: "👍⬆️", zone: "Chest Level", motion: "Fist on open palm lifting upward" },
    YES: { icon: "✊↕", zone: "Neutral Space", motion: "Nodding fist up and down" },
    NO: { icon: "🤏", zone: "Neutral Space", motion: "Tap index & middle onto thumb" },
    MORE: { icon: "🤌↔", zone: "Chest Level", motion: "Tap pinched fingertips together" },
    LOVE: { icon: "🫂", zone: "Across Chest", motion: "Cross both fists over chest" },
    FRIEND: { icon: "🪝🔄", zone: "Neutral Space", motion: "Hook & flip index fingers" },
    WATER: { icon: "🖖💧", zone: "Chin", motion: "Tap W-hand index finger to chin" },
    EAT: { icon: "🤌👄", zone: "Mouth / Chin", motion: "Tap flat-O hand to mouth twice" },
    BATHROOM: { icon: "✊↔", zone: "Neutral Space", motion: "Shake T-handshape side-to-side" },
    NAME: { icon: "✌️✖", zone: "Neutral Space", motion: "Tap H-fingers together twice" },
    LEARN: { icon: "🖐️↗🧠", zone: "Palm to Forehead", motion: "Gather fingers from palm to forehead" },
};

export default function SignVisualCard({ signKey = "A", size = 180 }) {
    const normalized = (signKey || "A").toUpperCase().replace(/\s+/g, "_");
    const phraseInfo = PHRASE_VISUALS[normalized];

    if (phraseInfo) {
        return (
            <div
                style={{
                    width: size,
                    minHeight: size,
                    borderRadius: 18,
                    padding: 14,
                    boxSizing: "border-box",
                    background:
                        "linear-gradient(160deg, rgba(247,124,174,0.22), rgba(24,29,55,0.92))",
                    border: "1px solid rgba(255,246,250,0.28)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-between",
                    textAlign: "center",
                    flexShrink: 0,
                }}
            >
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 0.6,
                        padding: "3px 8px",
                        borderRadius: 999,
                        background: "rgba(255,246,250,0.12)",
                        color: colors.pinkTranslate,
                    }}
                >
                    GESTURE VISUAL
                </span>

                <div style={{ fontSize: 40, lineHeight: 1.1, margin: "6px 0" }}>
                    {phraseInfo.icon}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: colors.textBrand }}>
                        {phraseInfo.zone}
                    </span>
                    <span style={{ fontSize: 12, color: colors.textMuted }}>
                        {phraseInfo.motion}
                    </span>
                </div>
            </div>
        );
    }

    const cfg = HAND_CONFIGS[normalized] || HAND_CONFIGS.A;
    const fingerX = [62, 82, 102, 122];
    const fingerBaseH = [52, 60, 55, 44];

    return (
        <div
            style={{
                width: size,
                borderRadius: 18,
                padding: 12,
                boxSizing: "border-box",
                background:
                    "linear-gradient(160deg, rgba(247,124,174,0.2), rgba(24,29,55,0.92))",
                border: "1px solid rgba(255,246,250,0.28)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                flexShrink: 0,
            }}
        >
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "rgba(255,246,250,0.12)",
                        color: colors.pinkTranslate,
                    }}
                >
                    ASL "{normalized}"
                </span>
                <span style={{ fontSize: 11, color: colors.textMuted }}>Reference</span>
            </div>

            {/* Vector Hand Demonstration Diagram */}
            <svg
                viewBox="0 0 180 175"
                width={size - 24}
                height={size - 34}
                aria-label={`ASL hand diagram for ${normalized}`}
            >
                <defs>
                    <linearGradient id={`palmGrad-${normalized}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffd1e3" />
                        <stop offset="100%" stopColor="#f77cae" />
                    </linearGradient>
                </defs>

                <g transform={`rotate(${cfg.rotate || 0} 92 105)`}>
                    {/* Wrist */}
                    <rect
                        x="68"
                        y="132"
                        width="48"
                        height="30"
                        rx="10"
                        fill="rgba(255,210,228,0.45)"
                    />

                    {/* Four Fingers */}
                    {cfg.fingers.map((ext, idx) => {
                        const fullH = fingerBaseH[idx];
                        const h = Math.max(18, fullH * (0.3 + ext * 0.7));
                        let x = fingerX[idx];
                        if (cfg.spread) {
                            x += (idx - 1.5) * 6;
                        }
                        if (cfg.crossed && idx === 1) {
                            x -= 11;
                        }
                        const y = 92 - h;

                        return (
                            <g key={idx}>
                                <rect
                                    x={x - 8}
                                    y={y}
                                    width="16"
                                    height={h + 10}
                                    rx="8"
                                    fill={`url(#palmGrad-${normalized})`}
                                    stroke="#181d37"
                                    strokeWidth="2"
                                />
                                {/* Knuckle crease */}
                                <line
                                    x1={x - 5}
                                    y1={y + h * 0.45}
                                    x2={x + 5}
                                    y2={y + h * 0.45}
                                    stroke="rgba(24,29,55,0.4)"
                                    strokeWidth="1.5"
                                />
                            </g>
                        );
                    })}

                    {/* Palm Body */}
                    <rect
                        x="52"
                        y="84"
                        width="80"
                        height="56"
                        rx="22"
                        fill={`url(#palmGrad-${normalized})`}
                        stroke="#181d37"
                        strokeWidth="2"
                    />

                    {/* Thumb Positioning */}
                    {cfg.thumb === "side" && (
                        <rect
                            x="36"
                            y="66"
                            width="16"
                            height="44"
                            rx="8"
                            fill="#ffc5d9"
                            stroke="#181d37"
                            strokeWidth="2"
                        />
                    )}
                    {cfg.thumb === "out" && (
                        <rect
                            x="22"
                            y="96"
                            width="42"
                            height="16"
                            rx="8"
                            fill="#ffc5d9"
                            stroke="#181d37"
                            strokeWidth="2"
                        />
                    )}
                    {cfg.thumb === "horiz" && (
                        <rect
                            x="44"
                            y="64"
                            width="16"
                            height="38"
                            rx="8"
                            fill="#ffc5d9"
                            stroke="#181d37"
                            strokeWidth="2"
                        />
                    )}
                    {(cfg.thumb === "across" ||
                        cfg.thumb === "tuck" ||
                        cfg.thumb === "under2" ||
                        cfg.thumb === "under3") && (
                            <rect
                                x="54"
                                y="94"
                                width={cfg.thumb === "under3" ? 56 : 44}
                                height="15"
                                rx="7.5"
                                fill="#ffc5d9"
                                stroke="#181d37"
                                strokeWidth="2"
                            />
                        )}
                    {(cfg.thumb === "between" || cfg.thumb === "between1") && (
                        <rect
                            x="66"
                            y="76"
                            width="14"
                            height="32"
                            rx="7"
                            fill="#ffe3ee"
                            stroke="#181d37"
                            strokeWidth="2"
                        />
                    )}
                    {(cfg.thumb === "pinch" || cfg.thumb === "touch" || cfg.thumb === "curve") && (
                        <circle
                            cx="60"
                            cy="82"
                            r="11"
                            fill="none"
                            stroke="#ffe3ee"
                            strokeWidth="5"
                        />
                    )}
                </g>

                {/* Animated Motion Arrows for J and Z */}
                {cfg.motion === "J-curve" && (
                    <path
                        d="M 134 45 L 134 88 Q 134 112 110 112"
                        fill="none"
                        stroke="#86efac"
                        strokeWidth="3.5"
                        strokeDasharray="6 4"
                        strokeLinecap="round"
                    />
                )}
                {cfg.motion === "Z-path" && (
                    <path
                        d="M 55 34 L 125 34 L 55 74 L 125 74"
                        fill="none"
                        stroke="#86efac"
                        strokeWidth="3.5"
                        strokeDasharray="6 4"
                        strokeLinecap="round"
                    />
                )}
            </svg>

            <span
                style={{
                    fontSize: 12,
                    fontWeight: 600,
                    textAlign: "center",
                    color: colors.textWhite,
                    lineHeight: 1.25,
                }}
            >
                {cfg.badge}
            </span>
        </div>
    );
}
