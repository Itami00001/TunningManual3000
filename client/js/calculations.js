export function calculatePowerGain(partsArray, basePower) {
  if (!Array.isArray(partsArray)) return 0;

  const gains = partsArray
    .map((p) => parsePowerGain(p?.specs?.power_gain))
    .filter((v) => typeof v === 'number' && Number.isFinite(v));

  if (gains.length === 0) return 0;
  return gains.reduce((a, b) => a + b, 0);
}

export function calculateBuildQuality(partsArray) {
  const radar = calculateEfficiencyRadar(partsArray);

  const values = Object.values(radar).filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (values.length === 0) return 5; // estimated

  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return clamp01To10(avg);
}

export function calculateEfficiencyRadar(partsArray) {
  if (!Array.isArray(partsArray)) {
    return { power: 0, reliability: 5, cost: 5, complexity: 5, compatibility: 5 }; // estimated
  }

  const compatibilityValues = partsArray
    .map((p) => p?.compatibility_score)
    .filter((v) => typeof v === 'number' && Number.isFinite(v));

  const complexityValues = partsArray
    .map((p) => p?.complexity_install)
    .filter((v) => typeof v === 'number' && Number.isFinite(v));

  const priceValues = partsArray
    .map((p) => parsePriceApprox(p?.price_approx))
    .filter((v) => typeof v === 'number' && Number.isFinite(v) && v > 0);

  const avgCompatibility = compatibilityValues.length
    ? compatibilityValues.reduce((a, b) => a + b, 0) / compatibilityValues.length
    : 6; // estimated

  const avgComplexity = complexityValues.length
    ? complexityValues.reduce((a, b) => a + b, 0) / complexityValues.length
    : 5; // estimated

  // Power: если нет численных power_gain — null
  const powerGains = partsArray
    .map((p) => parsePowerGain(p?.specs?.power_gain))
    .filter((v) => typeof v === 'number' && Number.isFinite(v));

  const totalGain = powerGains.length ? powerGains.reduce((a, b) => a + b, 0) : 0; // estimated

  // Нормализация прироста: 0 л.с. => 0, 200 л.с. => 10 (cap)
  const power = clamp01To10((totalGain / 200) * 10);

  // Reliability: если нет complexity_install — null
  // Иначе: 10 - complexity (cap)
  const reliability = clamp01To10(10 - avgComplexity);

  // Cost: если нет price_approx — null
  // Иначе: 0 руб => 10, 1 000 000 руб => 0 (cap)
  const avgPrice = priceValues.length ? priceValues.reduce((a, b) => a + b, 0) / priceValues.length : 250_000; // estimated
  const cost = clamp01To10(10 - (avgPrice / 1_000_000) * 10);

  const complexity = clamp01To10(avgComplexity);
  const compatibility = clamp01To10(avgCompatibility);

  return { power, reliability, cost, complexity, compatibility };
}

export function calculatePowerResult(partsArray, basePower) {
  if (typeof basePower !== 'number' || !Number.isFinite(basePower)) return 0;
  const gain = calculatePowerGain(partsArray, basePower);
  return basePower + gain;
}

export function calculateRpmTorqueCurve(partsArray, baseCurve) {
  const parts = Array.isArray(partsArray) ? partsArray : [];
  const curve = Array.isArray(baseCurve) && baseCurve.length ? baseCurve : estimateBaseCurveFromParts(parts); // estimated

  const mods = summarizeMods(parts);
  return applyCurveModifiers(curve, mods);
}

export function calculateBuildCost(partsArray) {
  if (!Array.isArray(partsArray) || partsArray.length === 0) return 0;

  const values = partsArray
    .map((p) => parsePriceRange(p?.price_approx))
    .filter(Boolean);

  if (values.length === 0) return 0;

  const min = values.reduce((a, r) => a + r.min, 0);
  const max = values.reduce((a, r) => a + r.max, 0);
  return { min, max, avg: Math.round((min + max) / 2) };
}

function clamp01To10(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(10, value));
}

function parsePowerGain(powerGainField) {
  // Поддерживает строки вида "+15-25 л.с." или "+80-100".
  if (typeof powerGainField !== 'string') return null;

  const s = powerGainField.replace(',', '.');

  // Ищем диапазон a-b
  const rangeMatch = s.match(/([+-]?\d+(?:\.\d+)?)\s*[-–]\s*([+-]?\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    const a = Number(rangeMatch[1]);
    const b = Number(rangeMatch[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) return (a + b) / 2;
  }

  // Ищем одиночное число
  const singleMatch = s.match(/([+-]?\d+(?:\.\d+)?)/);
  if (singleMatch) {
    const v = Number(singleMatch[1]);
    return Number.isFinite(v) ? v : null;
  }

  return null;
}

function parsePriceRange(priceApprox) {
  if (typeof priceApprox === 'number' && Number.isFinite(priceApprox) && priceApprox > 0) {
    const v = Math.round(priceApprox);
    return { min: v, max: v };
  }
  if (typeof priceApprox !== 'string') return null;

  const s = priceApprox.replace(/\s+/g, '').replace(/руб\.?/gi, '').replace(/₽/g, '');
  const m = s.match(/(\d+(?:\.\d+)?)[-–](\d+(?:\.\d+)?)/);
  if (m) {
    const a = Math.round(Number(m[1]));
    const b = Math.round(Number(m[2]));
    if (Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0) {
      return { min: Math.min(a, b), max: Math.max(a, b) };
    }
  }

  const single = s.match(/(\d+(?:\.\d+)?)/);
  if (single) {
    const v = Math.round(Number(single[1]));
    return Number.isFinite(v) && v > 0 ? { min: v, max: v } : null;
  }

  return null;
}

function parsePriceApprox(priceApprox) {
  const r = parsePriceRange(priceApprox);
  if (!r) return null;
  return (r.min + r.max) / 2;
}

function summarizeMods(parts) {
  const categories = new Set(parts.map((p) => p?.category).filter(Boolean));
  const hasTurbo = categories.has('turbo');
  const hasCam = categories.has('camshaft');
  const hasExhaust = categories.has('exhaust');
  const hasIntake = categories.has('intake');

  const gain = calculatePowerGain(parts, 0);
  return { hasTurbo, hasCam, hasExhaust, hasIntake, totalPowerGain: gain };
}

function estimateBaseCurveFromParts(parts) {
  const vehicle = parts.find((p) => typeof p?.vehicle === 'string')?.vehicle ?? '';
  if (/silvia\s+s14|silvia\s+s15/i.test(vehicle)) return stockCurveSR20DET();
  if (/skyline\s+gt-r\s+r34/i.test(vehicle)) return stockCurveRB26DETT();
  if (/rx-7\s+fd3s/i.test(vehicle)) return stockCurve13BREW();
  if (/supra\s+a80/i.test(vehicle)) return stockCurve2JZGTE();
  return stockCurveGeneric2L();
}

function applyCurveModifiers(curve, mods) {
  const base = curve.map((p) => ({ rpm: p.rpm, torque: p.torque }));

  const turboFactor = mods.hasTurbo ? 1.08 : 1; // estimated
  const camHighRpmFactor = mods.hasCam ? 1.06 : 1; // estimated
  const exhaustFactor = mods.hasExhaust ? 1.03 : 1; // estimated
  const intakeFactor = mods.hasIntake ? 1.02 : 1; // estimated

  return base.map((pt) => {
    const rpm = pt.rpm;
    const highRpmBias = rpm >= 5000 ? camHighRpmFactor : 1;
    const torque = Math.round(pt.torque * turboFactor * exhaustFactor * intakeFactor * highRpmBias);
    return { rpm, torque };
  });
}

function stockCurveSR20DET() {
  return [
    { rpm: 2000, torque: 220 },
    { rpm: 2500, torque: 245 },
    { rpm: 3000, torque: 270 },
    { rpm: 3500, torque: 285 },
    { rpm: 4000, torque: 290 },
    { rpm: 4500, torque: 285 },
    { rpm: 5000, torque: 275 },
    { rpm: 5500, torque: 260 },
    { rpm: 6000, torque: 240 },
    { rpm: 6500, torque: 220 }
  ];
}

function stockCurveRB26DETT() {
  return [
    { rpm: 2000, torque: 260 },
    { rpm: 2500, torque: 300 },
    { rpm: 3000, torque: 330 },
    { rpm: 3500, torque: 350 },
    { rpm: 4000, torque: 365 },
    { rpm: 4500, torque: 370 },
    { rpm: 5000, torque: 360 },
    { rpm: 5500, torque: 345 },
    { rpm: 6000, torque: 325 },
    { rpm: 6500, torque: 300 }
  ];
}

function stockCurve13BREW() {
  return [
    { rpm: 2000, torque: 210 },
    { rpm: 2500, torque: 235 },
    { rpm: 3000, torque: 260 },
    { rpm: 3500, torque: 280 },
    { rpm: 4000, torque: 295 },
    { rpm: 4500, torque: 300 },
    { rpm: 5000, torque: 295 },
    { rpm: 5500, torque: 285 },
    { rpm: 6000, torque: 270 },
    { rpm: 6500, torque: 250 }
  ];
}

function stockCurve2JZGTE() {
  return [
    { rpm: 2000, torque: 320 },
    { rpm: 2500, torque: 360 },
    { rpm: 3000, torque: 400 },
    { rpm: 3500, torque: 430 },
    { rpm: 4000, torque: 440 },
    { rpm: 4500, torque: 435 },
    { rpm: 5000, torque: 420 },
    { rpm: 5500, torque: 395 },
    { rpm: 6000, torque: 370 },
    { rpm: 6500, torque: 340 }
  ];
}

function stockCurveGeneric2L() {
  return [
    { rpm: 2000, torque: 180 },
    { rpm: 2500, torque: 195 },
    { rpm: 3000, torque: 210 },
    { rpm: 3500, torque: 220 },
    { rpm: 4000, torque: 225 },
    { rpm: 4500, torque: 220 },
    { rpm: 5000, torque: 210 },
    { rpm: 5500, torque: 195 },
    { rpm: 6000, torque: 180 },
    { rpm: 6500, torque: 165 }
  ];
}
