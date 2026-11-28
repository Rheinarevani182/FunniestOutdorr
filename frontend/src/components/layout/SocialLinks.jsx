import React from "react";
import { useApp } from "../../context/AppContext";
import { waLink } from "../../utils";

export function SocialLinks() {
  const { settings: s } = useApp();
  return (
    <div className="social-links">
      {[
        ["Instagram", s.instagram],
        ["TikTok", s.tiktok],
        ["Google Maps", s.maps],
        [
          "WhatsApp",
          waLink(
            s.phone,
            "Halo Funniest Outdoor, saya ingin menanyakan sewa alat.",
          ),
        ],
      ].map(([label, url]) =>
        url ? (
          <a key={label} href={url} target="_blank" rel="noreferrer">
            {label}
          </a>
        ) : (
          <span className="muted" key={label}>
            {label} · segera tersedia
          </span>
        ),
      )}
    </div>
  );
}