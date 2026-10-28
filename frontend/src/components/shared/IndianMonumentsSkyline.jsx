import React from 'react';

/**
 * IndianMonumentsSkyline
 * Renders the hand-crafted architectural silhouette featuring Indian iconic monuments:
 * - Left Minaret & Shrubbery
 * - Taj Mahal (Pishtaq archway, onion dome, and minarets)
 * - Traditional Village Pavilion
 * - India Gate (Cenotaph, attic frieze, and piers)
 * - Canopy Pavilion
 * - Qutub Minar (Fluted minar and ornate balconies)
 * - Charminar (Grand central archway, upper loggia, battlements, and twin minarets)
 * 
 * Supports both 'light' (hero on page 1) and 'dark' (footer on navy blue) themes.
 */
export const IndianMonumentsSkyline = ({
  variant = 'light',
  className = 'w-full h-auto',
  idPrefix = variant === 'dark' ? 'footerSkyline' : 'heroSkyline',
  viewBox = variant === 'dark' ? '0 0 712 100' : '0 0 760 100',
}) => {
  const isDark = variant === 'dark';

  const strokeColor = isDark ? '#7eb5f5' : '#6895ce';
  const groundStroke = isDark ? '#60a5fa' : '#6895ce';
  const dotColor = isDark ? '#93c5fd' : '#6895ce';

  const skylineWashId = `${idPrefix}-wash`;
  const panelWashId = `${idPrefix}-panel`;

  return (
    <svg
      className={className}
      viewBox={viewBox}
      preserveAspectRatio="xMaxYMax meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={skylineWashId} x1="0" y1="0" x2="0" y2="1">
          {isDark ? (
            <>
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.05" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#deebfa" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#cde0f7" stopOpacity="0.1" />
            </>
          )}
        </linearGradient>
        <linearGradient id={panelWashId} x1="0" y1="0" x2="0" y2="1">
          {isDark ? (
            <>
              <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.10" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#deebfa" stopOpacity="0.25" />
            </>
          )}
        </linearGradient>
      </defs>

      {/* ── Ground Horizon Line ── */}
      <line
        x1="0"
        y1="98"
        x2="760"
        y2="98"
        stroke={groundStroke}
        strokeWidth="1.3"
        strokeLinecap="round"
      />

      {/* ── 1. Slender Left Minaret & Shrubbery (x=70 to 105) ── */}
      <g id={`${idPrefix}-left-minaret`}>
        <path
          d="M72,98 Q76,93 80,98 Q82,92 86,98"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${skylineWashId})`}
        />
        <rect
          x="88"
          y="90"
          width="10"
          height="8"
          rx="0.5"
          stroke={strokeColor}
          strokeWidth="1.1"
          fill={`url(#${skylineWashId})`}
        />
        <rect
          x="90"
          y="68"
          width="6"
          height="22"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${skylineWashId})`}
        />
        <line x1="88" y1="68" x2="98" y2="68" stroke={strokeColor} strokeWidth="1.2" />
        <rect
          x="91"
          y="48"
          width="4"
          height="20"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${skylineWashId})`}
        />
        <line x1="89" y1="48" x2="97" y2="48" stroke={strokeColor} strokeWidth="1.2" />
        <path
          d="M91,48 Q93,41 95,48 Z"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${skylineWashId})`}
        />
        <line x1="93" y1="41" x2="93" y2="35" stroke={strokeColor} strokeWidth="0.9" />
        <circle cx="93" cy="34.5" r="0.8" fill={dotColor} />
      </g>

      {/* ── 2. Taj Mahal (x=124 to 226) ── */}
      <g id={`${idPrefix}-taj-mahal`}>
        <rect
          x="136"
          y="86"
          width="78"
          height="12"
          rx="0.5"
          stroke={strokeColor}
          strokeWidth="1.2"
          fill={`url(#${skylineWashId})`}
        />
        <line x1="136" y1="91" x2="214" y2="91" stroke={strokeColor} strokeWidth="0.8" />
        <line x1="170" y1="98" x2="180" y2="98" stroke={strokeColor} strokeWidth="1" />
        <line x1="172" y1="95" x2="178" y2="95" stroke={strokeColor} strokeWidth="0.8" />

        {/* Left Minaret */}
        <rect
          x="130"
          y="80"
          width="7"
          height="18"
          rx="0.5"
          stroke={strokeColor}
          strokeWidth="1.1"
          fill={`url(#${skylineWashId})`}
        />
        <path
          d="M131.5,80 L132.5,38 L134.5,38 L135.5,80 Z"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${skylineWashId})`}
        />
        <line x1="130.5" y1="67" x2="136.5" y2="67" stroke={strokeColor} strokeWidth="1" />
        <line x1="131" y1="52" x2="136" y2="52" stroke={strokeColor} strokeWidth="1" />
        <path
          d="M132,38 Q133.5,30 135,38 Z"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${skylineWashId})`}
        />
        <line x1="133.5" y1="30" x2="133.5" y2="24" stroke={strokeColor} strokeWidth="0.8" />

        {/* Right Minaret */}
        <rect
          x="213"
          y="80"
          width="7"
          height="18"
          rx="0.5"
          stroke={strokeColor}
          strokeWidth="1.1"
          fill={`url(#${skylineWashId})`}
        />
        <path
          d="M214.5,80 L215.5,38 L217.5,38 L218.5,80 Z"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${skylineWashId})`}
        />
        <line x1="213.5" y1="67" x2="219.5" y2="67" stroke={strokeColor} strokeWidth="1" />
        <line x1="214" y1="52" x2="219" y2="52" stroke={strokeColor} strokeWidth="1" />
        <path
          d="M215,38 Q216.5,30 218,38 Z"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${skylineWashId})`}
        />
        <line x1="216.5" y1="30" x2="216.5" y2="24" stroke={strokeColor} strokeWidth="0.8" />

        {/* Central Mausoleum Structure */}
        <rect
          x="148"
          y="52"
          width="54"
          height="34"
          rx="0.5"
          stroke={strokeColor}
          strokeWidth="1.2"
          fill={`url(#${skylineWashId})`}
        />

        {/* Pishtaq Archway */}
        <path
          d="M164,86 L164,58 Q175,47 186,58 L186,86 Z"
          stroke={strokeColor}
          strokeWidth="1.2"
          fill={`url(#${panelWashId})`}
        />
        <path
          d="M167,86 L167,62 Q175,54 183,62 L183,86 Z"
          stroke={strokeColor}
          strokeWidth="0.9"
          fill={`url(#${skylineWashId})`}
        />
        <line
          x1="175"
          y1="62"
          x2="175"
          y2="86"
          stroke={strokeColor}
          strokeWidth="0.6"
          strokeDasharray="2 1"
        />

        {/* Niches */}
        <path
          d="M152,67 L152,58 Q156,54 160,58 L160,67 Z"
          stroke={strokeColor}
          strokeWidth="0.9"
          fill={`url(#${panelWashId})`}
        />
        <path
          d="M152,82 L152,73 Q156,69 160,73 L160,82 Z"
          stroke={strokeColor}
          strokeWidth="0.9"
          fill={`url(#${panelWashId})`}
        />
        <path
          d="M190,67 L190,58 Q194,54 198,58 L198,67 Z"
          stroke={strokeColor}
          strokeWidth="0.9"
          fill={`url(#${panelWashId})`}
        />
        <path
          d="M190,82 L190,73 Q194,69 198,73 L198,82 Z"
          stroke={strokeColor}
          strokeWidth="0.9"
          fill={`url(#${panelWashId})`}
        />

        {/* Central Onion Dome */}
        <rect
          x="166"
          y="46"
          width="18"
          height="6"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${skylineWashId})`}
        />
        <path
          d="M164,46 Q161,26 175,17 Q189,26 186,46 Z"
          stroke={strokeColor}
          strokeWidth="1.3"
          fill={`url(#${panelWashId})`}
        />
        <line x1="175" y1="17" x2="175" y2="7" stroke={strokeColor} strokeWidth="1" />
        <circle cx="175" cy="6.5" r="1.3" fill={dotColor} />

        {/* Side Domes */}
        <path
          d="M153,52 Q156.5,42 160,52 Z"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${skylineWashId})`}
        />
        <line x1="156.5" y1="42" x2="156.5" y2="37" stroke={strokeColor} strokeWidth="0.8" />
        <path
          d="M190,52 Q193.5,42 197,52 Z"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${skylineWashId})`}
        />
        <line x1="193.5" y1="42" x2="193.5" y2="37" stroke={strokeColor} strokeWidth="0.8" />
      </g>

      {/* ── 3. Traditional Pavilion & Trees (x=244 to 296) ── */}
      <g id={`${idPrefix}-village-pavilion`}>
        <rect
          x="248"
          y="88"
          width="16"
          height="10"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${skylineWashId})`}
        />
        <polygon
          points="246,88 256,76 266,88"
          stroke={strokeColor}
          strokeWidth="1.1"
          fill={`url(#${panelWashId})`}
        />
        <path
          d="M253,98 L253,92 Q256,89 259,92 L259,98 Z"
          stroke={strokeColor}
          strokeWidth="0.9"
          fill={`url(#${panelWashId})`}
        />
        <line x1="272" y1="98" x2="272" y2="85" stroke={strokeColor} strokeWidth="1" />
        <line x1="280" y1="98" x2="280" y2="85" stroke={strokeColor} strokeWidth="1" />
        <path
          d="M270,85 Q276,77 282,85 Z"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${skylineWashId})`}
        />
        <line x1="276" y1="77" x2="276" y2="73" stroke={strokeColor} strokeWidth="0.8" />
        <line x1="284" y1="98" x2="284" y2="92" stroke={strokeColor} strokeWidth="1" />
        <line x1="284" y1="92" x2="298" y2="92" stroke={strokeColor} strokeWidth="1" />
        <line x1="298" y1="92" x2="298" y2="98" stroke={strokeColor} strokeWidth="1" />
      </g>

      {/* ── 4. India Gate (x=318 to 392) ── */}
      <g id={`${idPrefix}-india-gate`}>
        <rect
          x="322"
          y="95"
          width="66"
          height="3"
          rx="0.4"
          stroke={strokeColor}
          strokeWidth="1.1"
          fill={`url(#${skylineWashId})`}
        />
        <rect
          x="325"
          y="92"
          width="60"
          height="3"
          rx="0.4"
          stroke={strokeColor}
          strokeWidth="1.1"
          fill={`url(#${skylineWashId})`}
        />
        <rect
          x="328"
          y="89"
          width="54"
          height="3"
          rx="0.4"
          stroke={strokeColor}
          strokeWidth="1.1"
          fill={`url(#${skylineWashId})`}
        />

        {/* Left Pier */}
        <rect
          x="330"
          y="48"
          width="16"
          height="41"
          stroke={strokeColor}
          strokeWidth="1.2"
          fill={`url(#${skylineWashId})`}
        />
        <line x1="334" y1="48" x2="334" y2="89" stroke={strokeColor} strokeWidth="0.8" />
        <rect
          x="336"
          y="52"
          width="8"
          height="7"
          rx="0.5"
          stroke={strokeColor}
          strokeWidth="0.8"
          fill={`url(#${panelWashId})`}
        />
        <line x1="330" y1="62" x2="346" y2="62" stroke={strokeColor} strokeWidth="0.8" />
        <rect
          x="336"
          y="65"
          width="8"
          height="10"
          rx="0.5"
          stroke={strokeColor}
          strokeWidth="0.8"
          fill={`url(#${panelWashId})`}
        />
        <circle
          cx="340"
          cy="70"
          r="2.5"
          stroke={strokeColor}
          strokeWidth="0.8"
          fill={`url(#${skylineWashId})`}
        />
        <line x1="330" y1="77" x2="346" y2="77" stroke={strokeColor} strokeWidth="0.8" />
        <rect
          x="336"
          y="79"
          width="8"
          height="7"
          rx="0.5"
          stroke={strokeColor}
          strokeWidth="0.8"
          fill={`url(#${panelWashId})`}
        />

        {/* Right Pier */}
        <rect
          x="364"
          y="48"
          width="16"
          height="41"
          stroke={strokeColor}
          strokeWidth="1.2"
          fill={`url(#${skylineWashId})`}
        />
        <line x1="376" y1="48" x2="376" y2="89" stroke={strokeColor} strokeWidth="0.8" />
        <rect
          x="366"
          y="52"
          width="8"
          height="7"
          rx="0.5"
          stroke={strokeColor}
          strokeWidth="0.8"
          fill={`url(#${panelWashId})`}
        />
        <line x1="364" y1="62" x2="380" y2="62" stroke={strokeColor} strokeWidth="0.8" />
        <rect
          x="366"
          y="65"
          width="8"
          height="10"
          rx="0.5"
          stroke={strokeColor}
          strokeWidth="0.8"
          fill={`url(#${panelWashId})`}
        />
        <circle
          cx="370"
          cy="70"
          r="2.5"
          stroke={strokeColor}
          strokeWidth="0.8"
          fill={`url(#${skylineWashId})`}
        />
        <line x1="364" y1="77" x2="380" y2="77" stroke={strokeColor} strokeWidth="0.8" />
        <rect
          x="366"
          y="79"
          width="8"
          height="7"
          rx="0.5"
          stroke={strokeColor}
          strokeWidth="0.8"
          fill={`url(#${panelWashId})`}
        />

        {/* Archway */}
        <path
          d="M346,89 L346,55 A9,9 0 0,1 364,55 L364,89 Z"
          stroke={strokeColor}
          strokeWidth="1.2"
          fill={`url(#${panelWashId})`}
        />
        <path
          d="M344.5,55 A10.5,10.5 0 0,1 365.5,55"
          stroke={strokeColor}
          strokeWidth="0.9"
          fill="none"
        />
        <polygon
          points="353.5,43 356.5,43 357,47 353,47"
          stroke={strokeColor}
          strokeWidth="0.8"
          fill={`url(#${skylineWashId})`}
        />
        <circle
          cx="349.5"
          cy="50"
          r="1.8"
          stroke={strokeColor}
          strokeWidth="0.8"
          fill={`url(#${skylineWashId})`}
        />
        <circle
          cx="360.5"
          cy="50"
          r="1.8"
          stroke={strokeColor}
          strokeWidth="0.8"
          fill={`url(#${skylineWashId})`}
        />

        {/* Entablature & Frieze */}
        <rect
          x="325"
          y="40"
          width="60"
          height="4"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${skylineWashId})`}
        />
        {Array.from({ length: 14 }).map((_, i) => (
          <line
            key={`${idPrefix}-ig-dt-` + i}
            x1={327 + i * 4}
            y1="41"
            x2={327 + i * 4}
            y2="43.5"
            stroke={strokeColor}
            strokeWidth="0.8"
          />
        ))}
        <rect
          x="323"
          y="38"
          width="64"
          height="2"
          rx="0.4"
          stroke={strokeColor}
          strokeWidth="1.1"
          fill={`url(#${skylineWashId})`}
        />

        {/* Attic Story */}
        <rect
          x="326"
          y="26"
          width="58"
          height="12"
          stroke={strokeColor}
          strokeWidth="1.2"
          fill={`url(#${skylineWashId})`}
        />
        <circle
          cx="333"
          cy="32"
          r="2.2"
          stroke={strokeColor}
          strokeWidth="0.8"
          fill={`url(#${panelWashId})`}
        />
        <rect
          x="340"
          y="28"
          width="30"
          height="8"
          rx="1.5"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${panelWashId})`}
        />
        <line
          x1="343"
          y1="32"
          x2="367"
          y2="32"
          stroke={strokeColor}
          strokeWidth="0.6"
          strokeDasharray="1.5 1"
        />
        <circle
          cx="377"
          cy="32"
          r="2.2"
          stroke={strokeColor}
          strokeWidth="0.8"
          fill={`url(#${panelWashId})`}
        />
        <rect
          x="325"
          y="24"
          width="60"
          height="2"
          rx="0.3"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${skylineWashId})`}
        />

        {/* Roof & Cap */}
        <rect
          x="330"
          y="21"
          width="50"
          height="3"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${skylineWashId})`}
        />
        <rect
          x="336"
          y="18"
          width="38"
          height="3"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${skylineWashId})`}
        />
        <rect
          x="342"
          y="15"
          width="26"
          height="3"
          stroke={strokeColor}
          strokeWidth="0.9"
          fill={`url(#${skylineWashId})`}
        />
        <path
          d="M346,15 Q355,10 364,15 Z"
          stroke={strokeColor}
          strokeWidth="1.1"
          fill={`url(#${panelWashId})`}
        />
        <rect
          x="353.5"
          y="8"
          width="3"
          height="2"
          stroke={strokeColor}
          strokeWidth="0.8"
          fill={dotColor}
        />
      </g>

      {/* ── 5. Canopy Pavilion (x=415 to 455) ── */}
      <g id={`${idPrefix}-canopy`}>
        <path
          d="M420,98 L420,85 Q430,73 440,85 L440,98 Z"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${skylineWashId})`}
        />
        <path
          d="M418,85 Q430,70 442,85 Z"
          stroke={strokeColor}
          strokeWidth="1.1"
          fill={`url(#${panelWashId})`}
        />
        <path
          d="M424,78 Q430,65 436,78 Z"
          stroke={strokeColor}
          strokeWidth="0.9"
          fill={`url(#${panelWashId})`}
        />
        <line x1="430" y1="65" x2="430" y2="60" stroke={strokeColor} strokeWidth="0.8" />
      </g>

      {/* ── 6. Qutub Minar (x=488 to 524) ── */}
      <g id={`${idPrefix}-qutub-minar`}>
        <rect
          x="498"
          y="94"
          width="16"
          height="4"
          rx="0.5"
          stroke={strokeColor}
          strokeWidth="1.1"
          fill={`url(#${skylineWashId})`}
        />
        <rect
          x="500"
          y="91"
          width="12"
          height="3"
          rx="0.5"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${skylineWashId})`}
        />
        <path
          d="M501,91 L504.5,18 L507.5,18 L511,91 Z"
          stroke={strokeColor}
          strokeWidth="1.2"
          fill={`url(#${skylineWashId})`}
        />
        <line x1="503" y1="91" x2="505.2" y2="18" stroke={strokeColor} strokeWidth="0.7" opacity="0.8" />
        <line x1="505" y1="91" x2="505.8" y2="18" stroke={strokeColor} strokeWidth="0.7" opacity="0.8" />
        <line x1="507" y1="91" x2="506.2" y2="18" stroke={strokeColor} strokeWidth="0.7" opacity="0.8" />
        <line x1="509" y1="91" x2="506.8" y2="18" stroke={strokeColor} strokeWidth="0.7" opacity="0.8" />

        <rect
          x="500"
          y="74"
          width="12"
          height="2.2"
          rx="0.3"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${panelWashId})`}
        />
        <rect
          x="501.5"
          y="58"
          width="9"
          height="2"
          rx="0.3"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${panelWashId})`}
        />
        <rect
          x="503"
          y="42"
          width="6"
          height="1.8"
          rx="0.3"
          stroke={strokeColor}
          strokeWidth="0.9"
          fill={`url(#${panelWashId})`}
        />
        <rect
          x="504"
          y="26"
          width="4"
          height="1.5"
          rx="0.3"
          stroke={strokeColor}
          strokeWidth="0.8"
          fill={`url(#${panelWashId})`}
        />

        <path
          d="M504.5,18 Q506,12 507.5,18 Z"
          stroke={strokeColor}
          strokeWidth="0.9"
          fill={`url(#${panelWashId})`}
        />
        <line x1="506" y1="12" x2="506" y2="5" stroke={strokeColor} strokeWidth="0.8" />
        <circle cx="506" cy="4.5" r="0.8" fill={dotColor} />
      </g>

      {/* ── 7. Charminar / Grand Monument (x=546 to 715) ── */}
      <g id={`${idPrefix}-charminar`}>
        {/* Outer Left Minaret */}
        <rect
          x="550"
          y="88"
          width="8"
          height="10"
          rx="0.5"
          stroke={strokeColor}
          strokeWidth="1.1"
          fill={`url(#${skylineWashId})`}
        />
        <rect
          x="551.5"
          y="16"
          width="5"
          height="72"
          stroke={strokeColor}
          strokeWidth="1.1"
          fill={`url(#${skylineWashId})`}
        />
        <rect
          x="549.5"
          y="62"
          width="9"
          height="2"
          rx="0.3"
          stroke={strokeColor}
          strokeWidth="0.9"
          fill={`url(#${panelWashId})`}
        />
        <rect
          x="550"
          y="38"
          width="8"
          height="2"
          rx="0.3"
          stroke={strokeColor}
          strokeWidth="0.9"
          fill={`url(#${panelWashId})`}
        />
        <path
          d="M551.5,16 Q554,8 556.5,16 Z"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${panelWashId})`}
        />
        <line x1="554" y1="8" x2="554" y2="4" stroke={strokeColor} strokeWidth="0.8" />

        {/* Outer Right Minaret */}
        <rect
          x="702"
          y="88"
          width="8"
          height="10"
          rx="0.5"
          stroke={strokeColor}
          strokeWidth="1.1"
          fill={`url(#${skylineWashId})`}
        />
        <rect
          x="703.5"
          y="16"
          width="5"
          height="72"
          stroke={strokeColor}
          strokeWidth="1.1"
          fill={`url(#${skylineWashId})`}
        />
        <rect
          x="701.5"
          y="62"
          width="9"
          height="2"
          rx="0.3"
          stroke={strokeColor}
          strokeWidth="0.9"
          fill={`url(#${panelWashId})`}
        />
        <rect
          x="702"
          y="38"
          width="8"
          height="2"
          rx="0.3"
          stroke={strokeColor}
          strokeWidth="0.9"
          fill={`url(#${panelWashId})`}
        />
        <path
          d="M703.5,16 Q706,8 708.5,16 Z"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${panelWashId})`}
        />
        <line x1="706" y1="8" x2="706" y2="4" stroke={strokeColor} strokeWidth="0.8" />

        {/* Central Monument Main Block */}
        <rect
          x="558"
          y="44"
          width="144"
          height="54"
          stroke={strokeColor}
          strokeWidth="1.2"
          fill={`url(#${skylineWashId})`}
        />

        {/* Grand Central Archway */}
        <path
          d="M610,98 L610,62 Q630,44 650,62 L650,98 Z"
          stroke={strokeColor}
          strokeWidth="1.3"
          fill={`url(#${panelWashId})`}
        />
        <path
          d="M614,98 L614,66 Q630,50 646,66 L646,98 Z"
          stroke={strokeColor}
          strokeWidth="0.9"
          fill={`url(#${skylineWashId})`}
        />

        {/* Left & Right Flanking Arch Portals */}
        <path
          d="M566,98 L566,74 Q576,64 586,74 L586,98 Z"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${panelWashId})`}
        />
        <path
          d="M674,98 L674,74 Q684,64 694,74 L694,98 Z"
          stroke={strokeColor}
          strokeWidth="1"
          fill={`url(#${panelWashId})`}
        />

        {/* Dividing String Course Moulding */}
        <line x1="558" y1="62" x2="702" y2="62" stroke={strokeColor} strokeWidth="1" />

        {/* Upper Loggia Arched Openings */}
        {Array.from({ length: 9 }).map((_, i) => (
          <path
            key={`${idPrefix}-cm-win-` + i}
            d={
              'M' +
              (566 + i * 15) +
              ',58 L' +
              (566 + i * 15) +
              ',50 Q' +
              (571.5 + i * 15) +
              ',44 ' +
              (577 + i * 15) +
              ',50 L' +
              (577 + i * 15) +
              ',58 Z'
            }
            stroke={strokeColor}
            strokeWidth="0.8"
            fill={`url(#${panelWashId})`}
          />
        ))}

        {/* Parapet Cresting & Battlements */}
        <line x1="558" y1="44" x2="702" y2="44" stroke={strokeColor} strokeWidth="1.2" />
        {Array.from({ length: 24 }).map((_, i) => (
          <line
            key={`${idPrefix}-cm-cr-` + i}
            x1={560 + i * 6}
            y1="41"
            x2={560 + i * 6}
            y2="44"
            stroke={strokeColor}
            strokeWidth="0.8"
          />
        ))}

        {/* Central Dome & Inner Turrets */}
        <rect
          x="620"
          y="38"
          width="20"
          height="6"
          stroke={strokeColor}
          strokeWidth="0.9"
          fill={`url(#${skylineWashId})`}
        />
        <path
          d="M618,38 Q630,24 642,38 Z"
          stroke={strokeColor}
          strokeWidth="1.2"
          fill={`url(#${panelWashId})`}
        />
        <line x1="630" y1="24" x2="630" y2="18" stroke={strokeColor} strokeWidth="0.8" />
        <circle cx="630" cy="17.5" r="1" fill={dotColor} />

        {/* Inner Pair of Turrets */}
        <rect
          x="596"
          y="28"
          width="4"
          height="16"
          stroke={strokeColor}
          strokeWidth="0.9"
          fill={`url(#${skylineWashId})`}
        />
        <path
          d="M596,28 Q598,22 600,28 Z"
          stroke={strokeColor}
          strokeWidth="0.8"
          fill={`url(#${panelWashId})`}
        />
        <rect
          x="660"
          y="28"
          width="4"
          height="16"
          stroke={strokeColor}
          strokeWidth="0.9"
          fill={`url(#${skylineWashId})`}
        />
        <path
          d="M660,28 Q662,22 664,28 Z"
          stroke={strokeColor}
          strokeWidth="0.8"
          fill={`url(#${panelWashId})`}
        />
      </g>
    </svg>
  );
};

export default IndianMonumentsSkyline;
