import React from "react";
import { colors } from "./theme";
import backgroundImage from "../images/background.png";

/**
 * Full-bleed page background image (fills its positioned parent).
 */
export default function Background() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        backgroundColor: colors.pageBg,
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        zIndex: 0,
      }}
    />
  );
}
