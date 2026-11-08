/**
 * Illustrative concept factors, kg CO2 / passenger-km, NOT official UAE factors.
 * Broad ranges informed by UK DESNZ greenhouse-gas conversion-factor methodology:
 * https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting
 * Metro/tram values assume shared electric transport. Water taxi is an illustrative
 * assumption. Replace with audited local occupancy, fleet and electricity factors
 * before reporting real emissions or awarding real money.
 */
export const carbonConfig = {
  baseline: 0.17,
  creditsPerKg: 10,
  creditsPerAed: 100,
  dailyCap: 500,
  verificationThreshold: 75,
  factors: {
    car: 0.17, taxi: 0.17, bus: 0.07, metro: 0.03, tram: 0.03,
    water_taxi: 0.10, bike: 0, scooter: 0, walking: 0,
  } as Record<string, number>,
};
export const round = (n: number, places = 2) => Number(n.toFixed(places));
export function carbonFor(legs: { distance: number; mode: string }[], distance: number) {
  const co2 = legs.reduce((sum, leg) => sum + leg.distance * (carbonConfig.factors[leg.mode] ?? carbonConfig.baseline), 0);
  const saved = Math.max(0, distance * carbonConfig.baseline - co2);
  // Round credits down, never award more than the measured saving.
  return { co2: round(co2), saved: round(saved), credits: Math.floor(saved * carbonConfig.creditsPerKg) };
}
export function dayGST(date = new Date()) {
  return new Date(date.getTime() + 4 * 3600000).toISOString().slice(0, 10);
}
