export default function Logo({ className = "" }) {
  return (
    <svg
      className={className}
      width="40"
      height="40"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Minibus body */}
      <rect
        x="15"
        y="30"
        width="70"
        height="40"
        rx="8"
        fill="#FF6B35"
        stroke="#E55100"
        strokeWidth="3"
      />
      
      {/* Windows */}
      <rect x="25" y="38" width="12" height="15" rx="2" fill="#87CEEB" />
      <rect x="42" y="38" width="12" height="15" rx="2" fill="#87CEEB" />
      <rect x="59" y="38" width="12" height="15" rx="2" fill="#87CEEB" />
      
      {/* Front grille */}
      <rect x="78" y="45" width="6" height="15" rx="1" fill="#333" />
      
      {/* Wheels */}
      <circle cx="30" cy="70" r="8" fill="#333" stroke="#666" strokeWidth="2" />
      <circle cx="30" cy="70" r="4" fill="#999" />
      <circle cx="70" cy="70" r="8" fill="#333" stroke="#666" strokeWidth="2" />
      <circle cx="70" cy="70" r="4" fill="#999" />
      
      {/* Headlight */}
      <circle cx="82" cy="60" r="3" fill="#FFD700" />
      
      {/* Side mirror */}
      <rect x="12" y="40" width="4" height="3" rx="1" fill="#E55100" />
      
      {/* Roof rack line */}
      <line x1="20" y1="28" x2="80" y2="28" stroke="#E55100" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
