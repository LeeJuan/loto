const fs = require('fs');

console.log('🇯🇵 일본 전문가 룰 적용 검증');
console.log('=' .repeat(70));

// 데이터 로드
const csv = fs.readFileSync('C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_results.csv', 'utf8');
const lines = csv.trim().split('\n').slice(1);
const draws = lines.map(line => {
  const parts = line.split(',');
  return {
    round: parseInt(parts[0]),
    numbers: [parts[2], parts[3], parts[4], parts[5], parts[6], parts[7]].map(Number),
    bonus: parseInt(parts[8])
  };
});

console.log(`\n데이터: ${draws.length}회차\n`);

// ==================== 일본 전문가 룰 검증 ====================

console.log('=' .repeat(70));
console.log('📊 일본 전문가 룰 검증 (실제 데이터 기반)');
console.log('=' .repeat(70));

// 1. 引っ張り数字 (이월 번호) - 전회 당첨번호 재출현
console.log('\n[1] 引っ張り数字 (이월 번호) 검증');
let hippariCount = 0;
let hippariTotal = 0;
for (let i = 1; i < draws.length; i++) {
  const prev = new Set(draws[i - 1].numbers);
  const curr = draws[i].numbers;
  const overlap = curr.filter(n => prev.has(n)).length;
  if (overlap >= 1) hippariCount++;
  hippariTotal += overlap;
}
const hippariRate = (hippariCount / (draws.length - 1) * 100).toFixed(1);
const avgHippari = (hippariTotal / (draws.length - 1)).toFixed(2);
console.log(`  1개 이상 이월: ${hippariCount}/${draws.length - 1}회 (${hippariRate}%)`);
console.log(`  평균 이월 개수: ${avgHippari}개`);
console.log(`  → 일본 기준 65% vs 실제 ${hippariRate}% ${parseFloat(hippariRate) >= 60 ? '✓ 일치' : '△ 차이있음'}`);

// 2. 連続数字 (연속 번호) 검증
console.log('\n[2] 連続数字 (연속 번호) 검증');
let consecCount = 0;
draws.forEach(d => {
  const sorted = [...d.numbers].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] - sorted[i] === 1) {
      consecCount++;
      break;
    }
  }
});
const consecRate = (consecCount / draws.length * 100).toFixed(1);
console.log(`  연속번호 1쌍 이상: ${consecCount}/${draws.length}회 (${consecRate}%)`);
console.log(`  → 일본 기준 54.9% vs 실제 ${consecRate}% ${Math.abs(parseFloat(consecRate) - 54.9) < 5 ? '✓ 일치' : '△ 차이있음'}`);

// 3. 下一桁共通 (끝자리 같은 번호 2개 이상) 검증
console.log('\n[3] 下一桁共通 (끝자리 같은 번호) 검증');
let lastDigitCount = 0;
draws.forEach(d => {
  const lastDigits = d.numbers.map(n => n % 10);
  const digitCounts = {};
  lastDigits.forEach(digit => {
    digitCounts[digit] = (digitCounts[digit] || 0) + 1;
  });
  if (Object.values(digitCounts).some(c => c >= 2)) {
    lastDigitCount++;
  }
});
const lastDigitRate = (lastDigitCount / draws.length * 100).toFixed(1);
console.log(`  끝자리 같은 번호 2개+: ${lastDigitCount}/${draws.length}회 (${lastDigitRate}%)`);
console.log(`  → 일본 기준 79.6% vs 실제 ${lastDigitRate}% ${Math.abs(parseFloat(lastDigitRate) - 79.6) < 5 ? '✓ 일치' : '△ 차이있음'}`);

// 4. 합계값 검증
console.log('\n[4] 合計値 (합계) 검증');
const sums = draws.map(d => d.numbers.reduce((a, b) => a + b, 0));
const avgSum = (sums.reduce((a, b) => a + b, 0) / sums.length).toFixed(1);
const in120_149 = sums.filter(s => s >= 120 && s < 150).length;
const in95_170 = sums.filter(s => s >= 95 && s <= 170).length;
console.log(`  평균 합계: ${avgSum}`);
console.log(`  120-149 범위: ${in120_149}/${draws.length}회 (${(in120_149/draws.length*100).toFixed(1)}%)`);
console.log(`  95-170 범위: ${in95_170}/${draws.length}회 (${(in95_170/draws.length*100).toFixed(1)}%)`);
console.log(`  → 일본 기준 평균 132~133 vs 실제 ${avgSum} ${Math.abs(parseFloat(avgSum) - 133) < 5 ? '✓ 일치' : '△ 차이있음'}`);

// 5. 偶数奇数 (홀짝) 검증
console.log('\n[5] 偶数奇数 (홀짝) 검증');
const oddEvenDist = {};
draws.forEach(d => {
  const odd = d.numbers.filter(n => n % 2 === 1).length;
  const key = `${odd}:${6-odd}`;
  oddEvenDist[key] = (oddEvenDist[key] || 0) + 1;
});

const core234 = (oddEvenDist['2:4'] || 0) + (oddEvenDist['3:3'] || 0) + (oddEvenDist['4:2'] || 0);
const coreRate = (core234 / draws.length * 100).toFixed(1);
console.log(`  2:4 ~ 4:2 비율: ${core234}/${draws.length}회 (${coreRate}%)`);
console.log(`  → 일본 기준 80% vs 실제 ${coreRate}% ${parseFloat(coreRate) >= 75 ? '✓ 일치' : '△ 차이있음'}`);

// 6. ゾーン分析 (구간 분석) - 低(1-9), 中(10-29), 高(30-43)
console.log('\n[6] ゾーン分析 (구간 분석) 검증');
const zoneDist = {};
draws.forEach(d => {
  const low = d.numbers.filter(n => n <= 9).length;
  const mid = d.numbers.filter(n => n >= 10 && n <= 29).length;
  const high = d.numbers.filter(n => n >= 30).length;
  const key = `${low}-${mid}-${high}`;
  zoneDist[key] = (zoneDist[key] || 0) + 1;
});

const topZones = Object.entries(zoneDist).sort((a, b) => b[1] - a[1]).slice(0, 10);
console.log('  [구간 패턴 TOP 10]');
topZones.forEach(([pattern, count], i) => {
  console.log(`    ${i+1}위: ${pattern} - ${count}회 (${(count/draws.length*100).toFixed(1)}%)`);
});

// 7. 최근 24회 분석 (船津式)
console.log('\n[7] 船津式 - 최근 24회 출현 3-4회 번호');
const recent24 = draws.slice(-24);
const recent24Freq = {};
for (let i = 1; i <= 43; i++) recent24Freq[i] = 0;
recent24.forEach(d => d.numbers.forEach(n => recent24Freq[n]++));

const appear3to4 = Object.entries(recent24Freq)
  .filter(([_, count]) => count >= 3 && count <= 4)
  .map(([num, count]) => ({ num: parseInt(num), count }))
  .sort((a, b) => b.count - a.count);

console.log(`  3-4회 출현 번호: ${appear3to4.map(x => x.num).join(', ')}`);

// 8. 飛び石出現 (한 회 건너뛰고 출현) 검증
console.log('\n[8] 飛び石出現 (한 회 건너뛴 출현) 검증');
let tobCount = 0;
for (let i = 2; i < draws.length; i++) {
  const prevPrev = new Set(draws[i - 2].numbers);
  const prev = new Set(draws[i - 1].numbers);
  const curr = draws[i].numbers;
  // 전전회에 있고 전회에는 없고 이번에 다시 나온 번호
  const tobi = curr.filter(n => prevPrev.has(n) && !prev.has(n));
  if (tobi.length >= 1) tobCount++;
}
const tobRate = (tobCount / (draws.length - 2) * 100).toFixed(1);
console.log(`  飛び石 1개 이상: ${tobCount}/${draws.length - 2}회 (${tobRate}%)`);

// ==================== 현재 전략과 비교 ====================
console.log('\n' + '=' .repeat(70));
console.log('📋 현재 전략 vs 일본 전문가 기준 비교');
console.log('=' .repeat(70));

const currentTickets = fs.readFileSync('C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_perfect_numbers.txt', 'utf8')
  .trim().split('\n').map(l => l.split(',').map(Number));

// 현재 전략 검증
let ticketHippari = 0; // 이월 번호 포함
let ticketConsec = 0;  // 연속 번호 포함
let ticketLastDigit = 0; // 끝자리 같은 번호 포함
let ticketSum95_170 = 0; // 합계 95-170
let ticketOddEven234 = 0; // 홀짝 2:4 ~ 4:2

const lastDrawNums = new Set(draws[draws.length - 1].numbers);

currentTickets.forEach(ticket => {
  // 이월 (마지막 회차 기준)
  if (ticket.some(n => lastDrawNums.has(n))) ticketHippari++;

  // 연속
  const sorted = [...ticket].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] - sorted[i] === 1) {
      ticketConsec++;
      break;
    }
  }

  // 끝자리
  const lastDigits = ticket.map(n => n % 10);
  const digitCounts = {};
  lastDigits.forEach(d => digitCounts[d] = (digitCounts[d] || 0) + 1);
  if (Object.values(digitCounts).some(c => c >= 2)) ticketLastDigit++;

  // 합계
  const sum = ticket.reduce((a, b) => a + b, 0);
  if (sum >= 95 && sum <= 170) ticketSum95_170++;

  // 홀짝
  const odd = ticket.filter(n => n % 2 === 1).length;
  if (odd >= 2 && odd <= 4) ticketOddEven234++;
});

console.log('\n[현재 500장 전략 검증]');
console.log(`  引っ張り (이월) 포함: ${ticketHippari}/500 (${(ticketHippari/5).toFixed(1)}%) - 권장: 65%+`);
console.log(`  連続数字 (연속) 포함: ${ticketConsec}/500 (${(ticketConsec/5).toFixed(1)}%) - 권장: 55%`);
console.log(`  下一桁共通 (끝자리): ${ticketLastDigit}/500 (${(ticketLastDigit/5).toFixed(1)}%) - 권장: 80%`);
console.log(`  合計 95-170: ${ticketSum95_170}/500 (${(ticketSum95_170/5).toFixed(1)}%) - 권장: 90%+`);
console.log(`  偶奇 2:4~4:2: ${ticketOddEven234}/500 (${(ticketOddEven234/5).toFixed(1)}%) - 권장: 80%+`);

// 개선 필요 여부 판단
const issues = [];
if (ticketHippari / 500 < 0.60) issues.push('引っ張り (이월) 포함률 부족');
if (ticketConsec / 500 < 0.50) issues.push('連続数字 (연속) 포함률 부족');
if (ticketLastDigit / 500 < 0.75) issues.push('下一桁共通 (끝자리) 포함률 부족');
if (ticketSum95_170 / 500 < 0.85) issues.push('合計 95-170 비율 부족');
if (ticketOddEven234 / 500 < 0.75) issues.push('偶奇 2:4~4:2 비율 부족');

console.log('\n' + '=' .repeat(70));
if (issues.length > 0) {
  console.log('⚠️ 일본 전문가 기준 미달 항목:');
  issues.forEach(issue => console.log(`  - ${issue}`));
  console.log('\n→ 전략 수정이 필요합니다.');
} else {
  console.log('✅ 일본 전문가 기준 모두 충족!');
  console.log('→ 현재 전략 유지해도 됩니다.');
}
console.log('=' .repeat(70));

// 저장
const result = {
  jpRules: {
    hippariRate: parseFloat(hippariRate),
    consecRate: parseFloat(consecRate),
    lastDigitRate: parseFloat(lastDigitRate),
    avgSum: parseFloat(avgSum),
    oddEvenCoreRate: parseFloat(coreRate)
  },
  currentStrategy: {
    hippariRate: (ticketHippari / 500 * 100).toFixed(1),
    consecRate: (ticketConsec / 500 * 100).toFixed(1),
    lastDigitRate: (ticketLastDigit / 500 * 100).toFixed(1),
    sum95_170Rate: (ticketSum95_170 / 500 * 100).toFixed(1),
    oddEvenCoreRate: (ticketOddEven234 / 500 * 100).toFixed(1)
  },
  issues
};

fs.writeFileSync('C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_jp_rules_check.json',
  JSON.stringify(result, null, 2), 'utf8');

console.log('\n💾 분석 결과가 loto6_jp_rules_check.json에 저장되었습니다.');
