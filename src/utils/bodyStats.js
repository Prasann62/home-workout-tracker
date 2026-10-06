import { Storage } from './storage.js';

const WEIGHT_KEY = 'ila_body_weight';
const MEASURE_KEY = 'ila_measurements';

export function logWeight(kg) {
  const data = getWeightHistory();
  const today = new Date().toISOString().split('T')[0];
  const lbs = parseFloat((kg * 2.20462).toFixed(1));
  
  const existingIdx = data.findIndex(d => d.date === today);
  const entry = { date: today, kg, lbs };
  
  if (existingIdx >= 0) {
    data[existingIdx] = entry;
  } else {
    data.push(entry);
  }
  
  data.sort((a, b) => a.date.localeCompare(b.date));
  Storage.saveBodyWeight(data.slice(-90));
}

export function getWeightHistory() {
  return Storage.getBodyWeight();
}

export function getLatestWeight() {
  const data = getWeightHistory();
  return data.length > 0 ? data[data.length - 1] : null;
}

export function deleteWeightEntry(date) {
  const data = getWeightHistory().filter(d => d.date !== date);
  Storage.saveBodyWeight(data);
}

export function getWeightTrend() {
  const data = getWeightHistory();
  if (data.length < 2) return 'insufficient';
  
  // Simple trend based on first vs last in recent window
  const recent = data.slice(-7);
  if (recent.length < 2) return 'insufficient';
  
  const diff = recent[recent.length - 1].kg - recent[0].kg;
  if (Math.abs(diff) < 0.2) return 'stable';
  return diff > 0 ? 'gaining' : 'losing';
}

export function logMeasurement(measurements) {
  const data = getMeasurementHistory();
  const today = new Date().toISOString().split('T')[0];
  
  const existingIdx = data.findIndex(d => d.date === today);
  const entry = { date: today, ...measurements };
  
  if (existingIdx >= 0) {
    data[existingIdx] = entry;
  } else {
    data.push(entry);
  }
  
  data.sort((a, b) => a.date.localeCompare(b.date));
  Storage.saveMeasurements(data);
}

export function getMeasurementHistory() {
  return Storage.getMeasurements();
}
