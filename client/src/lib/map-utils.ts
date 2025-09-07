export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function calculateMapBounds(lat: number, lng: number, zoom: number) {
  // Calculate approximate bounds based on zoom level
  const latDelta = 0.1 / Math.pow(2, zoom - 10);
  const lngDelta = 0.1 / Math.pow(2, zoom - 10);
  
  return {
    north: lat + latDelta,
    south: lat - latDelta,
    east: lng + lngDelta,
    west: lng - lngDelta,
  };
}

export function validateCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(4)}°${lat >= 0 ? 'N' : 'S'}, ${lng.toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`;
}

export function calculatePrice(productSettings: {
  size: string;
  material: string;
  shape: string;
}, customizations: {
  texts: any[];
  icons: any[];
  compass?: any;
}): number {
  const basePrices: Record<string, number> = {
    compact: 49.99,
    standard: 64.99,
    large: 89.99,
  };

  let price = basePrices[productSettings.size] || basePrices.standard;
  
  // Add premium for metal material
  if (productSettings.material === 'metal') {
    price += 15.00;
  }
  
  // Add cost for customizations
  price += customizations.texts.length * 5.00;
  price += customizations.icons.length * 3.00;
  if (customizations.compass) {
    price += 7.00;
  }
  
  return Math.round(price * 100) / 100;
}

export function generateMapImageUrl(location: { lat: number; lng: number; zoom: number }): string {
  // In a real implementation, this would generate a map tile URL
  // For now, return a placeholder that represents the map
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <path d="M50,150 Q200,100 350,150 Q200,200 50,150" fill="none" stroke="#333" stroke-width="2"/>
      <circle cx="200" cy="150" r="3" fill="#333"/>
      <text x="200" y="140" text-anchor="middle" font-size="12" fill="#333">
        ${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}
      </text>
    </svg>
  `)}`;
}
