export interface ParsedPlayer {
  name: string;
  rating?: number;
}

/**
 * Parses bulk-pasted player input, one per line, as `Name` or `Name, Rating`.
 * Blank lines are ignored. A non-numeric rating is dropped (treated as unrated)
 * rather than rejecting the whole line, since arbiters often paste messy lists.
 */
export function parseBulkPlayers(text: string): ParsedPlayer[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [namePart, ratingPart] = line.split(',');
      const name = (namePart ?? '').trim();
      const ratingNum = ratingPart !== undefined ? Number.parseInt(ratingPart.trim(), 10) : NaN;
      return Number.isFinite(ratingNum) ? { name, rating: ratingNum } : { name };
    })
    .filter((p) => p.name.length > 0);
}
