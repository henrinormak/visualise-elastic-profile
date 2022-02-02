function hashCode(str: string): number {
  let hash = 0;

  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return hash;
}

function hslToHex(hue: number, saturation: number, luminance: number) {
  luminance /= 100;

  const a = (saturation * Math.min(luminance, 1 - luminance)) / 100;
  const toHex = (n: number) => {
    const k = (n + hue / 30) % 12;
    const color = luminance - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };

  return `#${toHex(0)}${toHex(8)}${toHex(4)}`;
}

export function getColor(str: string): string {
  return hslToHex(hashCode(str) % 360, 100, 20);
}
