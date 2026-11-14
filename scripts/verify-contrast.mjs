function getLuminance(hex) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const a = [r, g, b].map(v => {
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrast(hex1, hex2) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export const themes = {
  light: {
    name: "Light Theme",
    backgrounds: {
      surface: "#F5EFE6",        // ivory 100 (page)
      "surface-raised": "#FBF8F3", // ivory 50 (cards/modals)
      "surface-muted": "#EFE8DD",  // stone 100 (muted containers)
    },
    textTokens: {
      text: { hex: "#17120F", label: "Body Text", minRatio: 4.5 },
      "text-muted": { hex: "#6B625A", label: "Muted Text", minRatio: 4.5 },
      "accent-text": { hex: "#7A5F34", label: "Accent Text", minRatio: 4.5 },
      danger: { hex: "#9E3228", label: "Danger Text", minRatio: 4.5 },
      success: { hex: "#2E5E3E", label: "Success Text", minRatio: 4.5 },
      warning: { hex: "#8F5F14", label: "Warning Text", minRatio: 4.5 },
    },
    accentSurfacePairs: [
      {
        bgName: "accent (solid button)",
        bgHex: "#B79A6B",
        fgName: "accent-contrast",
        fgHex: "#17120F",
        minRatio: 4.5,
      },
      {
        bgName: "primary button (solid ink)",
        bgHex: "#17120F",
        fgName: "text-inverse",
        fgHex: "#FBF8F3",
        minRatio: 4.5,
      }
    ]
  },
  dark: {
    name: "Dark Theme",
    backgrounds: {
      surface: "#17120F",        // ink 950 (page)
      "surface-raised": "#221B17", // ink 900 (cards/modals)
      "surface-muted": "#3A322C",  // ink 700 (muted containers)
    },
    textTokens: {
      text: { hex: "#FBF8F3", label: "Body Text", minRatio: 4.5 },
      "text-muted": { hex: "#CFC5B8", label: "Muted Text", minRatio: 4.5 },
      "accent-text": { hex: "#D4BC92", label: "Accent Text", minRatio: 4.5 },
      danger: { hex: "#F0897E", label: "Danger Text", minRatio: 4.5 },
      success: { hex: "#7EC494", label: "Success Text", minRatio: 4.5 },
      warning: { hex: "#E9B764", label: "Warning Text", minRatio: 4.5 },
    },
    accentSurfacePairs: [
      {
        bgName: "accent (solid button)",
        bgHex: "#B79A6B",
        fgName: "accent-contrast",
        fgHex: "#17120F",
        minRatio: 4.5,
      },
      {
        bgName: "primary button (solid ivory)",
        bgHex: "#FBF8F3",
        fgName: "text-inverse",
        fgHex: "#17120F",
        minRatio: 4.5,
      }
    ]
  }
};

export function runContrastCheck() {
  const results = [];

  for (const [themeKey, theme] of Object.entries(themes)) {
    for (const [bgName, bgHex] of Object.entries(theme.backgrounds)) {
      for (const [tokenName, tokenData] of Object.entries(theme.textTokens)) {
        const ratio = getContrast(tokenData.hex, bgHex);
        const pass = ratio >= tokenData.minRatio;
        results.push({
          theme: themeKey,
          background: bgName,
          bgHex,
          token: tokenName,
          label: tokenData.label,
          hex: tokenData.hex,
          ratio: Number(ratio.toFixed(2)),
          minRatio: tokenData.minRatio,
          pass,
        });
      }
    }

    for (const pair of theme.accentSurfacePairs) {
      const ratio = getContrast(pair.fgHex, pair.bgHex);
      const pass = ratio >= pair.minRatio;
      results.push({
        theme: themeKey,
        background: pair.bgName,
        bgHex: pair.bgHex,
        token: pair.fgName,
        label: `${pair.fgName} on ${pair.bgName}`,
        hex: pair.fgHex,
        ratio: Number(ratio.toFixed(2)),
        minRatio: pair.minRatio,
        pass,
      });
    }
  }

  return results;
}

if (process.argv[1] && process.argv[1].endsWith('verify-contrast.mjs')) {
  const results = runContrastCheck();
  console.log('| Theme | Token | Foreground | Background | Ratio | Min Req | Status |');
  console.log('|:------|:------|:-----------|:-----------|:------|:--------|:-------|');
  let failures = 0;
  for (const r of results) {
    const status = r.pass ? 'PASS' : 'FAIL';
    if (!r.pass) failures++;
    console.log(`| ${r.theme.padEnd(5)} | ${r.token.padEnd(14)} | ${r.hex} | ${r.background} (${r.bgHex}) | ${r.ratio.toFixed(2)}:1 | ${r.minRatio}:1 | ${status} |`);
  }
  console.log(`\nTotal pairs tested: ${results.length}. Failures: ${failures}`);
}
