import React from 'react';

interface LogoProps {
  className?: string;
  light?: boolean; // If true, optimizes colors for dark backgrounds
}

const Logo: React.FC<LogoProps> = ({ className = "h-12 w-auto", light = false }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 300 100" 
      className={className}
      fill="none"
    >
      {/* Palm Tree Trunk */}
      <path 
        d="M165 25 C 165 25, 168 50, 150 90 L 135 90 C 150 60, 158 40, 158 25 Z" 
        fill={light ? "#8d7b68" : "#5e4b35"} 
      />
      
      {/* Palm Leaves (Stylized) */}
      <path d="M160 25 Q 140 10, 130 25 Q 145 28, 160 25" fill={light ? "#5fc08d" : "#266b4b"} />
      <path d="M160 25 Q 150 0, 165 5 Q 165 20, 160 25" fill={light ? "#5fc08d" : "#266b4b"} />
      <path d="M165 25 Q 180 5, 190 20 Q 175 25, 165 25" fill={light ? "#5fc08d" : "#266b4b"} />
      <path d="M165 25 Q 190 35, 180 50 Q 170 40, 165 25" fill={light ? "#5fc08d" : "#266b4b"} />
      <path d="M160 25 Q 140 40, 135 35 Q 150 30, 160 25" fill={light ? "#5fc08d" : "#266b4b"} />

      {/* Woodpecker Bird */}
      <g transform="translate(138, 45) scale(0.15)">
        <path d="M50 0 L 70 10 L 70 30 L 50 60 L 40 50 Z" fill={light ? "#e0f7e9" : "#1d4634"} /> 
        <path d="M50 0 L 30 10 L 40 20 Z" fill="#ef4444" /> {/* Red Crest */}
        <path d="M70 10 L 90 12 L 70 15 Z" fill="#fbbf24" /> {/* Beak */}
        <path d="M50 20 Q 30 30, 50 60" fill={light ? "#fff" : "#f2fbf5"} /> {/* Wing/Body accent */}
      </g>

      {/* Text "Vinaya Vana" */}
      <text 
        x="10" 
        y="85" 
        fontFamily="Merriweather, serif" 
        fontSize="32" 
        fontWeight="bold" 
        fill={light ? "#f2fbf5" : "#3e3223"}
      >
        Vinaya
      </text>
      <text 
        x="180" 
        y="85" 
        fontFamily="Merriweather, serif" 
        fontSize="32" 
        fontWeight="bold" 
        fill={light ? "#f2fbf5" : "#3e3223"}
      >
        Vana
      </text>
    </svg>
  );
};

export default Logo;