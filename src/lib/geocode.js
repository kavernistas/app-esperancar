// Shared Nominatim geocoding helper
export async function geocodeAddress({ street, neighborhood, city, state }) {
  const parts = [street, neighborhood, city, state].filter(Boolean);
  if (parts.length === 0) return null;
  const q = parts.join(', ');
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}