const fs = require('fs');

console.log('✅ 최종 검증');
console.log('=' .repeat(70));

// 데이터 로드
const csv = fs.readFileSync('C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_results.csv', 'utf8');
const lines = csv.trim().split('\n').slice(1);
const draws = lines.map(line => {
  const parts = line.split(',');
  return {
    numbers: [parts[2], parts[3], parts[4], parts[5], parts[6], parts[7]].map(Number)
  };
});

const tickets = fs.readFileSync('C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_ultimate_numbers.txt', 'utf8')
  .trim().split('\n').map(line => line.split(',').map(Number));

console.log(`\n검증 대상: ${tickets.length}장\n`);

// 1. 합계 분포 검증
console.log('[1] 합계 분포 검증');
const realDist = { '80-99': 0, '100-119': 0, '120-139': 0, '140-159': 0, '160-179': 0, '180+': 0 };
const ticketDist = { '80-99': 0, '100-119': 0, '120-139': 0, '140-159': 0, '160-179': 0, '180+': 0 };

draws.forEach(d => {
  const sum = d.numbers.reduce((a, b) => a + b, 0);
  if (sum < 100) realDist['80-99']++;
  else if (sum < 120) realDist['100-119']++;
  else if (sum < 140) realDist['120-139']++;
  else if (sum < 160) realDist['140-159']++;
  else if (sum < 180) realDist['160-179']++;
  else realDist['180+']++;
});

tickets.forEach(t => {
  const sum = t.reduce((a, b) => a + b, 0);
  if (sum < 100) ticketDist['80-99']++;
  else if (sum < 120) ticketDist['100-119']++;
  else if (sum < 140) ticketDist['120-139']++;
  else if (sum < 160) ticketDist['140-159']++;
  else if (sum < 180) ticketDist['160-179']++;
  else ticketDist['180+']++;
});

let sumPass = true;
console.log('  범위     | 실제  | 500장 | 차이  | 판정');
console.log('  ' + '-'.repeat(45));
Object.keys(realDist).forEach(range => {
  const real = (realDist[range] / draws.length * 100).toFixed(1);
  const ticket = (ticketDist[range] / tickets.length * 100).toFixed(1);
  const diff = Math.abs(parseFloat(ticket) - parseFloat(real));
  const ok = diff <= 5 ? '✓ PASS' : '✗ FAIL';
  if (diff > 5) sumPass = false;
  console.log(`  ${range.padStart(8)} | ${real.padStart(4)}% | ${ticket.padStart(4)}% | ${diff.toFixed(1).padStart(4)}% | ${ok}`);
});
console.log(`  결과: ${sumPass ? '✓ PASS' : '✗ FAIL'}\n`);

// 2. 홀짝 분포 검증
console.log('[2] 홀짝 분포 검증');
const oddEvenReal = {};
const oddEvenTicket = {};

draws.forEach(d => {
  const odd = d.numbers.filter(n => n % 2 === 1).length;
  const key = `${odd}:${6-odd}`;
  oddEvenReal[key] = (oddEvenReal[key] || 0) + 1;
});

tickets.forEach(t => {
  const odd = t.filter(n => n % 2 === 1).length;
  const key = `${odd}:${6-odd}`;
  oddEvenTicket[key] = (oddEvenTicket[key] || 0) + 1;
});

console.log('  패턴  | 실제  | 500장');
console.log('  ' + '-'.repeat(25));
['0:6', '1:5', '2:4', '3:3', '4:2', '5:1', '6:0'].forEach(pattern => {
  const real = ((oddEvenReal[pattern] || 0) / draws.length * 100).toFixed(1);
  const ticket = ((oddEvenTicket[pattern] || 0) / tickets.length * 100).toFixed(1);
  console.log(`  ${pattern.padStart(5)} | ${real.padStart(4)}% | ${ticket.padStart(4)}%`);
});

// 2:4 ~ 4:2 비율
const realCore = (((oddEvenReal['2:4']||0) + (oddEvenReal['3:3']||0) + (oddEvenReal['4:2']||0)) / draws.length * 100).toFixed(1);
const ticketCore = (((oddEvenTicket['2:4']||0) + (oddEvenTicket['3:3']||0) + (oddEvenTicket['4:2']||0)) / tickets.length * 100).toFixed(1);
console.log(`  2:4~4:2 비율: 실제 ${realCore}% | 500장 ${ticketCore}%\n`);

// 3. 고저 분포 검증
console.log('[3] 고저 분포 검증');
const highLowReal = {};
const highLowTicket = {};

draws.forEach(d => {
  const low = d.numbers.filter(n => n <= 21).length;
  const key = `${low}:${6-low}`;
  highLowReal[key] = (highLowReal[key] || 0) + 1;
});

tickets.forEach(t => {
  const low = t.filter(n => n <= 21).length;
  const key = `${low}:${6-low}`;
  highLowTicket[key] = (highLowTicket[key] || 0) + 1;
});

console.log('  저:고 | 실제  | 500장');
console.log('  ' + '-'.repeat(25));
['0:6', '1:5', '2:4', '3:3', '4:2', '5:1', '6:0'].forEach(pattern => {
  const real = ((highLowReal[pattern] || 0) / draws.length * 100).toFixed(1);
  const ticket = ((highLowTicket[pattern] || 0) / tickets.length * 100).toFixed(1);
  console.log(`  ${pattern.padStart(5)} | ${real.padStart(4)}% | ${ticket.padStart(4)}%`);
});
console.log();

// 4. 핵심 번호 포함률
console.log('[4] 핵심 번호 포함률');
const mustHave = [33, 20, 29, 36, 35, 24, 6, 10];
const shouldHave = [11, 19, 5, 23, 26, 43, 22, 1];

let mustHave3 = 0, mustHave4 = 0;
tickets.forEach(t => {
  const count = t.filter(n => mustHave.includes(n)).length;
  if (count >= 3) mustHave3++;
  if (count >= 4) mustHave4++;
});

console.log(`  필수번호(${mustHave.join(',')}) 3개+ 포함: ${mustHave3}/500 (${(mustHave3/5).toFixed(1)}%)`);
console.log(`  필수번호 4개+ 포함: ${mustHave4}/500 (${(mustHave4/5).toFixed(1)}%)`);

let shouldHave2 = 0;
tickets.forEach(t => {
  const count = t.filter(n => shouldHave.includes(n)).length;
  if (count >= 2) shouldHave2++;
});
console.log(`  권장번호(${shouldHave.join(',')}) 2개+ 포함: ${shouldHave2}/500 (${(shouldHave2/5).toFixed(1)}%)\n`);

// 5. 상승 트렌드 번호 포함
console.log('[5] 상승 트렌드 번호 포함');
const rising = [33, 36, 29, 35, 24, 10, 6, 23];
let risingCount = 0;
tickets.forEach(t => {
  if (t.some(n => rising.includes(n))) risingCount++;
});
console.log(`  상승 트렌드 번호 1개+ 포함: ${risingCount}/500 (${(risingCount/5).toFixed(1)}%)`);

let rising3 = 0;
tickets.forEach(t => {
  const count = t.filter(n => rising.includes(n)).length;
  if (count >= 3) rising3++;
});
console.log(`  상승 트렌드 번호 3개+ 포함: ${rising3}/500 (${(rising3/5).toFixed(1)}%)\n`);

// 6. 과거 매칭 검증
console.log('[6] 과거 당첨번호 매칭 (백테스트)');
const matchResults = { 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };

draws.forEach(d => {
  const drawSet = new Set(d.numbers);
  let best = 0;
  tickets.forEach(t => {
    const match = t.filter(n => drawSet.has(n)).length;
    if (match > best) best = match;
  });
  matchResults[best]++;
});

console.log('  일치 | 횟수 | 비율');
console.log('  ' + '-'.repeat(20));
[6, 5, 4, 3, 2, 1, 0].forEach(m => {
  if (matchResults[m] > 0) {
    console.log(`    ${m}개 | ${matchResults[m].toString().padStart(3)} | ${(matchResults[m]/draws.length*100).toFixed(1)}%`);
  }
});

// 4개 이상 일치 비율
const match4plus = matchResults[4] + matchResults[5] + matchResults[6];
console.log(`\n  4개+ 일치: ${match4plus}/${draws.length}회 (${(match4plus/draws.length*100).toFixed(1)}%)`);
console.log(`  5개+ 일치: ${matchResults[5] + matchResults[6]}/${draws.length}회 (${((matchResults[5]+matchResults[6])/draws.length*100).toFixed(1)}%)\n`);

// 7. 유사 조합 체크
console.log('[7] 조합 다양성 체크');
let duplicatePairs = 0;
for (let i = 0; i < tickets.length; i++) {
  for (let j = i + 1; j < tickets.length; j++) {
    const overlap = tickets[i].filter(n => tickets[j].includes(n)).length;
    if (overlap >= 5) duplicatePairs++;
  }
}
console.log(`  5개 이상 겹치는 쌍: ${duplicatePairs}쌍`);
console.log(`  결과: ${duplicatePairs < 50 ? '✓ PASS (다양성 확보)' : '△ 주의 (유사 조합 다소 많음)'}\n`);

// 최종 판정
console.log('=' .repeat(70));
console.log('📋 최종 판정');
console.log('=' .repeat(70));

const checks = [
  { name: '합계 분포', pass: sumPass },
  { name: '핵심번호 포함', pass: mustHave3 >= 450 },
  { name: '상승트렌드 포함', pass: risingCount >= 450 },
  { name: '4개+ 매칭률', pass: match4plus >= 40 },
  { name: '조합 다양성', pass: duplicatePairs < 100 }
];

let allPass = true;
checks.forEach(c => {
  console.log(`  ${c.pass ? '✓' : '✗'} ${c.name}: ${c.pass ? 'PASS' : 'FAIL'}`);
  if (!c.pass) allPass = false;
});

console.log('\n' + '=' .repeat(70));
if (allPass) {
  console.log('🎉 모든 검증 통과! 최종 전략으로 확정합니다.');
} else {
  console.log('⚠️ 일부 항목 미통과. 추가 조정이 필요할 수 있습니다.');
}
console.log('=' .repeat(70));
