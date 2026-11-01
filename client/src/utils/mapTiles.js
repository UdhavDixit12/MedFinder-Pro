/** Raster tiles from MapTiler. The key stays in VITE_TILE_URL and is never stored in source. */
export const TILE_URL = import.meta.env.VITE_TILE_URL || '';

/** Required credit for MapTiler tiles and the OpenStreetMap data they are drawn from. */
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener noreferrer">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';
