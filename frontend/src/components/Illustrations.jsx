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
    <svg width="300" height="250" viewBox="0 0 300 250" fill="none" xmlns="http://www.w3.org/2000/svg" className="travel-illustration">
      <defs>
        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          @keyframes wheelSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes treeSlide {
            from { transform: translateX(0px); }
            to { transform: translateX(-300px); }
          }
          @keyframes roadSlide {
            from { transform: translateX(0px); }
            to { transform: translateX(-60px); }
          }
          .van-body { 
            animation: bounce 0.6s ease-in-out infinite;
            transform-origin: center;
          }
          .wheel { 
            animation: wheelSpin 0.5s linear infinite;
          }
          .wheel:nth-of-type(5) {
            transform-origin: 110px 200px;
          }
          .wheel:nth-of-type(6) {
            transform-origin: 190px 200px;
          }
          .tree {
            animation: treeSlide 4s linear infinite;
          }
          .road-line {
            animation: roadSlide 1s linear infinite;
          }
        `}</style>
      </defs>
      
      {/* Trees moving in background */}
      <g className="tree">
        <ellipse cx="50" cy="100" rx="15" ry="25" fill="#4CAF50" />
        <rect x="45" y="100" width="10" height="30" fill="#8B4513" />
      </g>
      <g className="tree">
        <ellipse cx="150" cy="90" rx="18" ry="30" fill="#4CAF50" />
        <rect x="144" y="90" width="12" height="35" fill="#8B4513" />
      </g>
      <g className="tree">
        <ellipse cx="250" cy="95" rx="16" ry="28" fill="#4CAF50" />
        <rect x="245" y="95" width="10" height="32" fill="#8B4513" />
      </g>
      <g className="tree">
        <ellipse cx="350" cy="100" rx="15" ry="25" fill="#4CAF50" />
        <rect x="345" y="100" width="10" height="30" fill="#8B4513" />
      </g>
      
      {/* Van body with bounce */}
      <g className="van-body">
        <rect x="80" y="120" width="140" height="80" rx="12" fill="#FF6B35" />
        <rect x="95" y="135" width="25" height="35" rx="4" fill="#87CEEB" />
        <rect x="130" y="135" width="25" height="35" rx="4" fill="#87CEEB" />
        <rect x="165" y="135" width="25" height="35" rx="4" fill="#87CEEB" />
      </g>
      
      {/* Wheels with spin */}
      <g className="wheel">
        <circle cx="110" cy="200" r="18" fill="#333" />
        <circle cx="110" cy="200" r="10" fill="#666" />
        <line x1="110" y1="192" x2="110" y2="208" stroke="#888" strokeWidth="2" />
        <line x1="102" y1="200" x2="118" y2="200" stroke="#888" strokeWidth="2" />
      </g>
      <g className="wheel">
        <circle cx="190" cy="200" r="18" fill="#333" />
        <circle cx="190" cy="200" r="10" fill="#666" />
        <line x1="190" y1="192" x2="190" y2="208" stroke="#888" strokeWidth="2" />
        <line x1="182" y1="200" x2="198" y2="200" stroke="#888" strokeWidth="2" />
      </g>
      
      {/* Motion lines */}
      <line x1="30" y1="140" x2="60" y2="140" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      <line x1="20" y1="160" x2="55" y2="160" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      <line x1="25" y1="180" x2="50" y2="180" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      
      {/* Road */}
      <rect x="0" y="215" width="300" height="35" fill="#94A3B8" />
      <g className="road-line">
        <rect x="10" y="227" width="40" height="6" rx="3" fill="white" />
        <rect x="70" y="227" width="40" height="6" rx="3" fill="white" />
        <rect x="130" y="227" width="40" height="6" rx="3" fill="white" />
        <rect x="190" y="227" width="40" height="6" rx="3" fill="white" />
        <rect x="250" y="227" width="40" height="6" rx="3" fill="white" />
        <rect x="310" y="227" width="40" height="6" rx="3" fill="white" />
      </g>
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
