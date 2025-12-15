export function SearchIllustration() {
  return (
    <svg width="300" height="250" viewBox="0 0 300 250" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Map background */}
      <rect x="20" y="20" width="260" height="200" rx="12" fill="#F0F7FF" />
      
      {/* Road lines */}
      <path d="M40 80 Q150 100, 260 80" stroke="#CBD5E1" strokeWidth="20" strokeLinecap="round" />
      <path d="M40 140 Q150 160, 260 140" stroke="#CBD5E1" strokeWidth="20" strokeLinecap="round" />
      
      {/* Location pins */}
      <g transform="translate(80, 60)">
        <path d="M0 0C-8 0-15 7-15 15C-15 26 0 40 0 40S15 26 15 15C15 7 8 0 0 0Z" fill="#FF6B35" />
        <circle cx="0" cy="15" r="6" fill="white" />
      </g>
      
      <g transform="translate(220, 120)">
        <path d="M0 0C-8 0-15 7-15 15C-15 26 0 40 0 40S15 26 15 15C15 7 8 0 0 0Z" fill="#4CAF50" />
        <circle cx="0" cy="15" r="6" fill="white" />
      </g>
      
      {/* Search magnifier */}
      <circle cx="150" cy="180" r="25" stroke="#FF6B35" strokeWidth="6" fill="white" />
      <line x1="168" y1="198" x2="190" y2="220" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}

export function TravelIllustration() {
  return (
    <svg width="300" height="250" viewBox="0 0 300 250" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Van */}
      <rect x="80" y="120" width="140" height="80" rx="12" fill="#FF6B35" />
      <rect x="95" y="135" width="25" height="35" rx="4" fill="#87CEEB" />
      <rect x="130" y="135" width="25" height="35" rx="4" fill="#87CEEB" />
      <rect x="165" y="135" width="25" height="35" rx="4" fill="#87CEEB" />
      
      {/* Wheels */}
      <circle cx="110" cy="200" r="18" fill="#333" />
      <circle cx="110" cy="200" r="10" fill="#666" />
      <circle cx="190" cy="200" r="18" fill="#333" />
      <circle cx="190" cy="200" r="10" fill="#666" />
      
      {/* Motion lines */}
      <line x1="30" y1="140" x2="60" y2="140" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />
      <line x1="20" y1="160" x2="55" y2="160" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />
      <line x1="25" y1="180" x2="50" y2="180" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />
      
      {/* Road */}
      <rect x="0" y="215" width="300" height="35" fill="#94A3B8" />
      <rect x="10" y="227" width="40" height="6" rx="3" fill="white" />
      <rect x="70" y="227" width="40" height="6" rx="3" fill="white" />
      <rect x="130" y="227" width="40" height="6" rx="3" fill="white" />
      <rect x="190" y="227" width="40" height="6" rx="3" fill="white" />
      <rect x="250" y="227" width="40" height="6" rx="3" fill="white" />
    </svg>
  )
}

export function CommunityIllustration() {
  return (
    <svg width="300" height="250" viewBox="0 0 300 250" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* People icons */}
      <g transform="translate(70, 80)">
        <circle cx="0" cy="0" r="25" fill="#FF6B35" />
        <path d="M-20 60C-20 40 -10 30 0 30C10 30 20 40 20 60" fill="#FF6B35" />
      </g>
      
      <g transform="translate(150, 80)">
        <circle cx="0" cy="0" r="25" fill="#4CAF50" />
        <path d="M-20 60C-20 40 -10 30 0 30C10 30 20 40 20 60" fill="#4CAF50" />
      </g>
      
      <g transform="translate(230, 80)">
        <circle cx="0" cy="0" r="25" fill="#2196F3" />
        <path d="M-20 60C-20 40 -10 30 0 30C10 30 20 40 20 60" fill="#2196F3" />
      </g>
      
      {/* Stars */}
      <text x="60" y="170" fontSize="30" fill="#FFD700">⭐</text>
      <text x="140" y="170" fontSize="30" fill="#FFD700">⭐</text>
      <text x="220" y="170" fontSize="30" fill="#FFD700">⭐</text>
    </svg>
  )
}
