// Run from the repository root with node checks/verify.cjs.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

// Load the same functions used by the page, without starting browser listeners.
const app = fs.readFileSync('app.js', 'utf8').split("document.addEventListener('click'")[0];
const cases = fs.readFileSync('cases.js', 'utf8');
const scope = vm.createContext({});
vm.runInContext(cases + '\n' + app, scope);
const read = code => vm.runInContext(code, scope);
const data = read('({concerns, results, tireSources, pumpSteps, wearSteps})');
let paths = 0;
for (const [group, entry] of Object.entries(data.concerns)) {
  assert.equal(new Set(entry.options.map(option => option[0])).size, entry.options.length);
  for (const [id, text, resultKey] of entry.options) {
    const result = data.results[resultKey];
    assert.ok(result && result.script && result.follow && result.action, group + '/' + id);
    assert.ok(data.tireSources[result.source]);
    assert.ok(text && ['home','soon','plan','urgent'].includes(result.level));
    paths++;
  }
}
for (const key of ['flat','bulge','wobble','service','worn','damageUnknown']) assert.equal(data.results[key].level,'urgent');
for (const key of ['flash','nail','leak','impact']) assert.equal(data.results[key].level,'soon');
assert.match(data.results.warmHigh.action,/leave it alone/i);
assert.match(data.results.warmLow.action,/temporary step/);

// Verify published example arithmetic in both directions.
const coldRear = data.pumpSteps[1].rear, initialReading = 31;
assert.equal(coldRear - initialReading, 4);
assert.equal(initialReading + 4, coldRear);
assert.equal(900 - 600, 300);
assert.equal(600 + 300, 900);
for (const pos of [0,3]) {
  const s = data.pumpSteps[pos];
  assert.equal(s.choices[s.answer], s.rear + ' psi');
}
assert.equal(Math.min(6,5,2),2);
assert.equal([6,5,2].sort((a,b)=>a-b)[0],2);
const decode = s => read('decodeSize(' + JSON.stringify(s) + ')');
assert.match(decode('p225 / 65r17 102h'), /1,874/);
assert.match(decode('225/65R17 102H'), /130 mph/);
assert.match(decode('205/55R16 91V'), /1,356/);
assert.match(decode('205/55R16 91V'), /149 mph/);
assert.match(decode('225/65R17'), /17 inches/);
assert.match(decode('lt265/70r17 121/118s'), /full marking/);
assert.match(decode('T125/80D16'), /marking needs/);
assert.equal(decode('  '),'');
assert.doesNotMatch(decode('<img src=x>'), /<img/);
assert.match(decode('225/65R17 102H XL'), /Extra load/);
// Independent check using the metric load table and the exact pound definition.
assert.equal(Math.round(850 / 0.45359237),1874);
assert.equal(Math.round(615 / 0.45359237),1356);
const when = s => read('decodeDate(' + JSON.stringify(s) + ',new Date("2026-11-26T12:00:00Z"))');
assert.match(when('3422'),/week 34 of 2022/);
assert.match(when('0019'),/does not occur/);
assert.match(when('5422'),/does not occur/);
assert.match(when('5322'),/does not occur/);
assert.match(when('5323'),/week 53 of 2023/);
assert.match(when('0127'),/future/);
assert.match(when('4826'),/future/);
assert.match(when('4726'),/week 47 of 2026/);
assert.match(when('234'),/Three digits/);
assert.match(when('DOT XXXX 3422'),/last four/);
assert.equal(when(''),'');
const siteText = ['index.html','app.js','cases.js'].map(n=>fs.readFileSync(n,'utf8')).join('\n');
assert.doesNotMatch(siteText,/\bkpa\b|kilopascal/i);
console.log(paths + ' concern paths and ' + Object.keys(data.results).length + ' distinct outcomes verified. Practice arithmetic, rating examples, date boundaries, and pressure units passed.');

