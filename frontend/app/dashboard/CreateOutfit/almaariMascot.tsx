function AlmaariMascot() {
  return (
    <>
      <svg
        width="300"
        height="300"
        viewBox="0 0 300 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Arms + Hands (animated) */}
        {/* Left */}
        <g className="wave-left">
          <path
            d="M80 110 C40 100, 40 60, 65 70"
            fill="#F9F7F1"
            stroke="#273157"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="50"
            cy="60"
            r="8"
            fill="#F9F7F1"
            stroke="#273157"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        {/* Right */}
        <g className="wave-right">
          <path
            d="M190 120 C260 100, 260 60, 235 70"
            fill="#F9F7F1"
            stroke="#273157"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="250"
            cy="60"
            r="8"
            fill="#F9F7F1"
            stroke="#273157"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        {/* Body (wardrobe) */}
        <rect
          x="80"
          y="60"
          width="120"
          height="180"
          rx="6"
          fill="#F9F7F1"
          stroke="#273157"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Top lip */}
        <rect
          x="70"
          y="50"
          width="140"
          height="15"
          rx="6"
          fill="#F9F7F1"
          stroke="#273157"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Legs */}
        <rect
          x="95"
          y="240"
          width="15"
          height="30"
          rx="3"
          fill="#F9F7F1"
          stroke="#273157"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="170"
          y="240"
          width="15"
          height="30"
          rx="3"
          fill="#F9F7F1"
          stroke="#273157"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Doors */}
        <rect
          x="90"
          y="130"
          width="45"
          height="90"
          rx="2"
          fill="#F9F7F1"
          stroke="#273157"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="145"
          y="130"
          width="45"
          height="90"
          rx="2"
          fill="#F9F7F1"
          stroke="#273157"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Door handles */}
        <line
          x1="120"
          y1="170"
          x2="120"
          y2="190"
          stroke="#273157"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1="160"
          y1="170"
          x2="160"
          y2="190"
          stroke="#273157"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Face */}
        <circle
          className="eyes-blink left-eye"
          cx="125"
          cy="85"
          r="4"
          fill="#273157"
        />
        <circle
          className="eyes-blink right-eye"
          cx="155"
          cy="85"
          r="4"
          fill="#273157"
        />

        <path
          d="M120 100 Q140 115, 160 100"
          fill="none"
          stroke="#273157"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Speech bubble
      <path
        d="M200 25 C230 10, 270 20, 270 45 C270 70, 230 80, 200 65 L185 80 L190 60 C180 55, 180 35, 200 25Z"
        fill="#F9F7F1"
        stroke="#273157"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      /> */}
      </svg>
      <style jsx>{`
        @keyframes armWave {
          0% {
            transform: rotate(-6deg);
          }
          20% {
            transform: rotate(8deg);
          }
          40% {
            transform: rotate(-6deg);
          }
          60% {
            transform: rotate(-6deg); /* pause here */
          }
          80% {
            transform: rotate(-6deg); /* still paused */
          }
          100% {
            transform: rotate(-6deg);
          }
        }
        .wave-right {
          transform-box: fill-box;
          transform-origin: 100px 110px;
          animation: armWave 1.8s ease-in-out infinite;
          animation-delay: 0.15s;
        }

        @keyframes blink {
          0%,
          90%,
          100% {
            transform: scaleY(1);
          }
          93%,
          97% {
            transform: scaleY(0.15);
          }
          95% {
            transform: scaleY(1);
          }
        }

        .eyes-blink.left-eye {
          transform-origin: 125px 85px;
          animation: blink 8s ease-in-out infinite;
        }
        .eyes-blink.right-eye {
          transform-origin: 155px 85px;
          animation: blink 8s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}

export default AlmaariMascot;
