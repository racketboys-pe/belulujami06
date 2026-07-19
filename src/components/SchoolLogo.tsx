import React from 'react';

interface SchoolLogoProps {
  className?: string;
}

export default function SchoolLogo({ className = 'w-12 h-12' }: SchoolLogoProps) {
  return (
    <svg
      viewBox="0 0 500 500"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Lotus Floral Border - Stylized 8 Petals */}
      <path
        d="M 250,5 C 290,30 330,30 370,15 C 410,50 420,90 445,115 C 480,155 480,195 495,250 C 480,305 480,345 445,385 C 420,410 410,450 370,485 C 330,470 290,470 250,495 C 210,470 170,470 130,485 C 90,450 80,410 55,385 C 20,345 20,305 5,250 C 20,195 20,155 55,115 C 80,90 90,50 130,15 C 170,30 210,30 250,5 Z"
        fill="#ea580c"
        stroke="#facc15"
        strokeWidth="6"
      />

      {/* Inner Petal Ring */}
      <path
        d="M 250,25 C 285,48 320,48 355,35 C 390,65 398,100 420,122 C 450,158 450,192 463,250 C 450,308 450,342 420,378 C 398,400 390,435 355,465 C 320,452 285,452 250,475 C 215,452 180,452 145,465 C 110,435 102,400 80,378 C 50,342 50,308 37,250 C 50,192 50,158 80,122 C 102,100 110,65 145,35 C 180,48 215,48 250,25 Z"
        fill="#f97316"
        stroke="#ffffff"
        strokeWidth="4"
      />

      {/* Main Base White Circle */}
      <circle cx="250" cy="250" r="195" fill="#ffffff" stroke="#ea580c" strokeWidth="8" />

      {/* Golden Lettering Circle Track */}
      <circle cx="250" cy="250" r="185" fill="none" stroke="#facc15" strokeWidth="4" strokeDasharray="6 4" />

      {/* Decorative Book Dividers (Left and Right) */}
      {/* Left Book */}
      <g transform="translate(85, 235) scale(0.7)" fill="#ea580c">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
        <path d="M6 6h10M6 10h10M6 14h10" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      </g>
      {/* Right Book */}
      <g transform="translate(385, 235) scale(0.7)" fill="#ea580c">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
        <path d="M6 6h10M6 10h10M6 14h10" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Circular Text using SVG textPath */}
      <defs>
        {/* Upper Track */}
        <path
          id="upper-text-path"
          d="M 75,250 A 175,175 0 0,1 425,250"
          fill="none"
        />
        {/* Lower Track */}
        <path
          id="lower-text-path"
          d="M 425,250 A 175,175 0 0,1 75,250"
          fill="none"
        />
      </defs>

      <text fontFamily="Fredoka, Nunito, sans-serif" fontSize="30" fontWeight="900" fill="#9a3412" letterSpacing="6">
        <textPath href="#upper-text-path" startOffset="50%" textAnchor="middle">
          SDN ULUJAMI 06 PAGI
        </textPath>
      </text>

      <text fontFamily="Fredoka, Nunito, sans-serif" fontSize="38" fontWeight="900" fill="#ea580c" letterSpacing="12">
        <textPath href="#lower-text-path" startOffset="50%" textAnchor="middle">
          CERIA
        </textPath>
      </text>

      {/* World Dotted Network Lines in Center Background */}
      <g opacity="0.12" stroke="#ea580c" strokeWidth="2" fill="none">
        <circle cx="250" cy="240" r="110" />
        <circle cx="250" cy="240" r="70" />
        <circle cx="250" cy="240" r="35" />
        <line x1="140" y1="240" x2="360" y2="240" />
        <line x1="250" y1="130" x2="250" y2="350" />
        <path d="M 160,200 Q 250,220 340,200" />
        <path d="M 160,280 Q 250,260 340,280" />
        <path d="M 200,150 Q 230,240 200,330" />
        <path d="M 300,150 Q 270,240 300,330" />
      </g>

      {/* Graduation Cap in Center */}
      <g transform="translate(195, 145) scale(1.1)">
        {/* Cap Shadow */}
        <path
          d="M 50,5 L 95,23 L 50,41 L 5,23 Z"
          fill="#374151"
        />
        {/* Cap Main Board */}
        <path
          d="M 50,2 L 98,20 L 50,38 L 2,20 Z"
          fill="#ea580c"
          stroke="#facc15"
          strokeWidth="3"
        />
        {/* Cap Skull Under */}
        <path
          d="M 24,26 L 24,42 C 24,48 76,48 76,42 L 76,26"
          fill="#c2410c"
          stroke="#ea580c"
          strokeWidth="2"
        />
        {/* Cap Tassel */}
        <path
          d="M 50,20 L 15,28 L 12,48"
          fill="none"
          stroke="#facc15"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <polygon points="12,46 7,52 17,52" fill="#facc15" />
      </g>

      {/* Pillar Beacon / Tugu Monument in Center Bottom */}
      <g transform="translate(210, 245) scale(1.1)">
        {/* Base steps */}
        <rect x="15" y="75" width="50" height="8" rx="2" fill="#9a3412" />
        <rect x="20" y="67" width="40" height="8" rx="2" fill="#c2410c" />
        
        {/* Pillar Shaft */}
        <path
          d="M 30,67 L 34,25 L 46,25 L 50,67 Z"
          fill="#ea580c"
          stroke="#9a3412"
          strokeWidth="1.5"
        />
        
        {/* Beacon Top Accent */}
        <polygon points="40,10 32,25 48,25" fill="#facc15" stroke="#ea580c" strokeWidth="1" />
        <circle cx="40" cy="9" r="4" fill="#ffffff" stroke="#facc15" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
