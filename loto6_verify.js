const fs = require('fs');

// 데이터 로드
const csv = fs.readFileSync('C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_results.csv', 'utf8');
const lines = csv.trim().split('\n').slice(1); // 헤더 제외
const draws = lines.map(line => {
  const parts = line.split(',');
  return {
    round: parseInt(parts[0]),
    date: parts[1],
    numbers: [parts[2], parts[3], parts[4], parts[5], parts[6], parts[7]].map(Number),
    bonus: parseInt(parts[8])
  };
});

console.log('🔍 로또6 심층 검증 분석');
console.log('=' .repeat(70));
console.log(`총 ${draws.length}회차 데이터 (第${draws[0].round}回 ~ 第${draws[draws.length-1].round}回)\n`);

// ==================== 1. 시계열 트렌드 분석 ====================
console.log('=' .repeat(70));
console.log('1️⃣ 시계열 트렌드 분석 (최근 vs 과거)');
console.log('=' .repeat(70));

// 기간별 빈도 비교
const periods = [
  { name: '최근 10회', data: draws.slice(-10) },
  { name: '최근 30회', data: draws.slice(-30) },
  { name: '최근 50회', data: draws.slice(-50) },
  { name: '전체', data: draws }
];

const periodFreq = {};
periods.forEach(p => {
  periodFreq[p.name] = {};
  for (let i = 1; i <= 43; i++) periodFreq[p.name][i] = 0;
  p.data.forEach(d => d.numbers.forEach(n => periodFreq[p.name][n]++));
});

// 최근 10회에서 급상승한 번호 찾기
console.log('\n[최근 10회 출현 번호]');
const recent10Nums = {};
for (let i = 1; i <= 43; i++) recent10Nums[i] = 0;
draws.slice(-10).forEach(d => d.numbers.forEach(n => recent10Nums[n]++));
const hot10 = Object.entries(recent10Nums)
  .filter(([_, c]) => c >= 2)
  .sort((a, b) => b[1] - a[1]);
console.log(hot10.map(([n, c]) => `${n}(${c}회)`).join(', '));

// 최근 10회에서 미출현 번호
const cold10 = Object.entries(recent10Nums).filter(([_, c]) => c === 0).map(([n]) => parseInt(n));
console.log(`\n[최근 10회 미출현] ${cold10.join(', ')}`);

// ==================== 2. 번호별 출현 주기 분석 ====================
console.log('\n' + '=' .repeat(70));
console.log('2️⃣ 번호별 출현 주기 분석');
console.log('=' .repeat(70));

const numberCycles = {};
for (let num = 1; num <= 43; num++) {
  const appearances = [];
  draws.forEach((d, idx) => {
    if (d.numbers.includes(num)) appearances.push(idx);
  });

  if (appearances.length >= 2) {
    const gaps = [];
    for (let i = 1; i < appearances.length; i++) {
      gaps.push(appearances[i] - appearances[i - 1]);
    }
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const lastGap = draws.length - 1 - appearances[appearances.length - 1];

    numberCycles[num] = {
      avgGap: avgGap.toFixed(1),
      lastGap,
      appearances: appearances.length,
      dueSoon: lastGap >= avgGap * 0.8 // 평균 주기의 80% 이상 지남
    };
  }
}

// 출현 예정 번호 (평균 주기 대비 오래 미출현)
const dueNumbers = Object.entries(numberCycles)
  .filter(([_, data]) => data.dueSoon && data.lastGap >= 5)
  .sort((a, b) => (b[1].lastGap / parseFloat(b[1].avgGap)) - (a[1].lastGap / parseFloat(a[1].avgGap)))
  .slice(0, 15);

console.log('\n[출현 예정 번호 (주기 분석)]');
console.log('번호 | 평균주기 | 현재미출현 | 예상확률↑');
console.log('-'.repeat(45));
dueNumbers.forEach(([num, data]) => {
  const ratio = (data.lastGap / parseFloat(data.avgGap) * 100).toFixed(0);
  console.log(`  ${num.padStart(2)} |   ${data.avgGap.padStart(4)}회 |   ${data.lastGap.toString().padStart(2)}회    | ${ratio}%`);
});

// ==================== 3. 연속 출현 패턴 ====================
console.log('\n' + '=' .repeat(70));
console.log('3️⃣ 연속 출현 패턴 (2회 연속 출현 확률)');
console.log('=' .repeat(70));

const consecutiveAppear = {};
for (let i = 1; i <= 43; i++) consecutiveAppear[i] = { total: 0, consecutive: 0 };

for (let i = 1; i < draws.length; i++) {
  const prev = new Set(draws[i - 1].numbers);
  draws[i].numbers.forEach(n => {
    consecutiveAppear[n].total++;
    if (prev.has(n)) consecutiveAppear[n].consecutive++;
  });
}

const lastDraw = draws[draws.length - 1].numbers;
console.log(`\n[마지막 회차 번호]: ${lastDraw.join(', ')}`);
console.log('\n[이 번호들의 연속 출현 확률]');
lastDraw.forEach(n => {
  const rate = consecutiveAppear[n].total > 0
    ? (consecutiveAppear[n].consecutive / consecutiveAppear[n].total * 100).toFixed(1)
    : 0;
  console.log(`  ${n}: ${rate}% (${consecutiveAppear[n].consecutive}/${consecutiveAppear[n].total})`);
});

// ==================== 4. 번호 조합 패턴 ====================
console.log('\n' + '=' .repeat(70));
console.log('4️⃣ 3연번호 조합 분석 (자주 함께 출현)');
console.log('=' .repeat(70));

const triples = {};
draws.forEach(d => {
  const nums = d.numbers;
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      for (let k = j + 1; k < nums.length; k++) {
        const key = [nums[i], nums[j], nums[k]].sort((a, b) => a - b).join('-');
        triples[key] = (triples[key] || 0) + 1;
      }
    }
  }
});

const topTriples = Object.entries(triples)
  .filter(([_, c]) => c >= 3)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15);

console.log('\n[자주 출현하는 3개 조합]');
topTriples.forEach(([combo, count], i) => {
  console.log(`  ${(i+1).toString().padStart(2)}위: (${combo}) - ${count}회`);
});

// ==================== 5. 합계 트렌드 ====================
console.log('\n' + '=' .repeat(70));
console.log('5️⃣ 최근 합계 트렌드');
console.log('=' .repeat(70));

const recentSums = draws.slice(-20).map(d => ({
  round: d.round,
  sum: d.numbers.reduce((a, b) => a + b, 0)
}));

console.log('\n[최근 20회 합계]');
recentSums.forEach(s => {
  const bar = '█'.repeat(Math.round(s.sum / 10));
  console.log(`  ${s.round}: ${s.sum.toString().padStart(3)} ${bar}`);
});

const avgRecentSum = recentSums.reduce((a, b) => a + b.sum, 0) / recentSums.length;
console.log(`\n평균 합계: ${avgRecentSum.toFixed(1)}`);

// ==================== 6. 홀짝/고저 최근 트렌드 ====================
console.log('\n' + '=' .repeat(70));
console.log('6️⃣ 최근 10회 홀짝/고저 패턴');
console.log('=' .repeat(70));

const recent10 = draws.slice(-10);
console.log('\n회차   | 번호              | 홀:짝 | 저:고 | 합계');
console.log('-'.repeat(55));
recent10.forEach(d => {
  const oddCount = d.numbers.filter(n => n % 2 === 1).length;
  const lowCount = d.numbers.filter(n => n <= 21).length;
  const sum = d.numbers.reduce((a, b) => a + b, 0);
  const numsStr = d.numbers.map(n => n.toString().padStart(2)).join(' ');
  console.log(`${d.round} | ${numsStr} | ${oddCount}:${6-oddCount}   | ${lowCount}:${6-lowCount}   | ${sum}`);
});

// ==================== 7. 보너스 번호 분석 ====================
console.log('\n' + '=' .repeat(70));
console.log('7️⃣ 보너스 번호 → 다음회차 본번호 전환 분석');
console.log('=' .repeat(70));

let bonusToMain = 0;
for (let i = 1; i < draws.length; i++) {
  if (draws[i].numbers.includes(draws[i-1].bonus)) {
    bonusToMain++;
  }
}
console.log(`\n보너스→본번호 전환: ${bonusToMain}/${draws.length-1}회 (${(bonusToMain/(draws.length-1)*100).toFixed(1)}%)`);

const lastBonus = draws[draws.length - 1].bonus;
console.log(`마지막 보너스 번호: ${lastBonus}`);

// ==================== 8. 최종 추천 번호 도출 ====================
console.log('\n' + '=' .repeat(70));
console.log('🎯 최종 추천 번호 산출');
console.log('=' .repeat(70));

// 종합 점수 계산
const finalScores = {};
for (let i = 1; i <= 43; i++) {
  let score = 0;

  // 1. 전체 빈도 (가중치 15%)
  const totalFreq = periodFreq['전체'][i] / draws.length;
  score += totalFreq * 15;

  // 2. 최근 30회 빈도 (가중치 25%)
  const recent30Freq = periodFreq['최근 30회'][i] / 30;
  score += recent30Freq * 25;

  // 3. 최근 10회 빈도 (가중치 20%)
  const recent10Freq = periodFreq['최근 10회'][i] / 10;
  score += recent10Freq * 20;

  // 4. 출현 주기 분석 (가중치 25%)
  if (numberCycles[i] && numberCycles[i].dueSoon) {
    const ratio = numberCycles[i].lastGap / parseFloat(numberCycles[i].avgGap);
    score += Math.min(ratio * 15, 25);
  }

  // 5. 미출현 보너스 (가중치 15%)
  if (numberCycles[i]) {
    const gap = numberCycles[i].lastGap;
    if (gap >= 15) score += 15;
    else if (gap >= 10) score += 12;
    else if (gap >= 7) score += 8;
    else if (gap >= 5) score += 5;
  }

  // 마지막 보너스 번호 약간 가점
  if (i === lastBonus) score += 3;

  finalScores[i] = score;
}

const rankedFinal = Object.entries(finalScores)
  .map(([num, score]) => ({ num: parseInt(num), score }))
  .sort((a, b) => b.score - a.score);

console.log('\n[최종 번호 순위 TOP 20]');
console.log('순위 | 번호 | 점수  | 최근10회 | 미출현');
console.log('-'.repeat(45));
rankedFinal.slice(0, 20).forEach((item, i) => {
  const r10 = periodFreq['최근 10회'][item.num];
  const gap = numberCycles[item.num] ? numberCycles[item.num].lastGap : '?';
  console.log(`${(i+1).toString().padStart(3)}위 | ${item.num.toString().padStart(4)} | ${item.score.toFixed(1).padStart(5)} |    ${r10}회   |   ${gap}회`);
});

// 최종 추천 그룹
const tier1 = rankedFinal.slice(0, 8).map(n => n.num);   // 필수 포함
const tier2 = rankedFinal.slice(8, 16).map(n => n.num);  // 권장 포함
const tier3 = rankedFinal.slice(16, 25).map(n => n.num); // 보조

console.log('\n' + '=' .repeat(70));
console.log('⭐ 최종 추천 번호 그룹');
console.log('=' .repeat(70));
console.log(`\n🥇 Tier 1 (필수 포함 8개): ${tier1.join(', ')}`);
console.log(`🥈 Tier 2 (권장 포함 8개): ${tier2.join(', ')}`);
console.log(`🥉 Tier 3 (보조 9개): ${tier3.join(', ')}`);

// ==================== 9. 기존 500장 검증 ====================
console.log('\n' + '=' .repeat(70));
console.log('📋 기존 500장 전략 검증');
console.log('=' .repeat(70));

const existingTickets = fs.readFileSync('C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_500_numbers.txt', 'utf8')
  .trim().split('\n').map(line => line.split(',').map(Number));

// Tier1 번호 포함률 확인
let tier1Coverage = 0;
let tier1Min2 = 0;
let tier1Min3 = 0;
existingTickets.forEach(ticket => {
  const t1Count = ticket.filter(n => tier1.includes(n)).length;
  if (t1Count >= 1) tier1Coverage++;
  if (t1Count >= 2) tier1Min2++;
  if (t1Count >= 3) tier1Min3++;
});

console.log(`\nTier1 번호 1개 이상 포함: ${tier1Coverage}/500장 (${(tier1Coverage/5).toFixed(1)}%)`);
console.log(`Tier1 번호 2개 이상 포함: ${tier1Min2}/500장 (${(tier1Min2/5).toFixed(1)}%)`);
console.log(`Tier1 번호 3개 이상 포함: ${tier1Min3}/500장 (${(tier1Min3/5).toFixed(1)}%)`);

// 출현 예정 번호 포함률
const dueNums = dueNumbers.map(([n]) => parseInt(n));
let dueCoverage = 0;
existingTickets.forEach(ticket => {
  if (ticket.some(n => dueNums.includes(n))) dueCoverage++;
});
console.log(`\n출현예정 번호 포함: ${dueCoverage}/500장 (${(dueCoverage/5).toFixed(1)}%)`);

// ==================== 10. 개선된 TOP 조합 생성 ====================
console.log('\n' + '=' .repeat(70));
console.log('🔄 개선된 핵심 조합 생성');
console.log('=' .repeat(70));

function isValidCombo(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum < 100 || sum > 170) return false;

  const oddCount = sorted.filter(n => n % 2 === 1).length;
  if (oddCount < 2 || oddCount > 4) return false;

  const lowCount = sorted.filter(n => n <= 21).length;
  if (lowCount < 2 || lowCount > 4) return false;

  let consec = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] - sorted[i] === 1) consec++;
  }
  if (consec >= 3) return false;

  // AC값
  const diffs = new Set();
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      diffs.add(sorted[j] - sorted[i]);
    }
  }
  if (diffs.size - 5 < 6) return false;

  return true;
}

function scoreCombo(nums) {
  let score = 0;
  nums.forEach(n => score += finalScores[n]);

  // 인기 쌍 보너스
  const pairs = {};
  draws.forEach(d => {
    for (let i = 0; i < d.numbers.length; i++) {
      for (let j = i + 1; j < d.numbers.length; j++) {
        const key = [d.numbers[i], d.numbers[j]].sort((a, b) => a - b).join('-');
        pairs[key] = (pairs[key] || 0) + 1;
      }
    }
  });

  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      const key = [nums[i], nums[j]].sort((a, b) => a - b).join('-');
      if (pairs[key] >= 6) score += pairs[key];
    }
  }

  return score;
}

// Tier 기반 조합 생성
const improvedCombos = [];
const allPool = [...tier1, ...tier2, ...tier3];

// Tier1에서 3개 + Tier2에서 2개 + Tier3에서 1개
for (let a = 0; a < tier1.length; a++) {
  for (let b = a + 1; b < tier1.length; b++) {
    for (let c = b + 1; c < tier1.length; c++) {
      for (let d = 0; d < tier2.length; d++) {
        for (let e = d + 1; e < tier2.length; e++) {
          for (let f = 0; f < tier3.length; f++) {
            const combo = [tier1[a], tier1[b], tier1[c], tier2[d], tier2[e], tier3[f]];
            if (new Set(combo).size === 6 && isValidCombo(combo)) {
              improvedCombos.push({
                nums: combo.sort((a, b) => a - b),
                score: scoreCombo(combo)
              });
            }
          }
        }
      }
    }
  }
}

// 정렬
improvedCombos.sort((a, b) => b.score - a.score);

// 중복 제거
const uniqueImproved = [];
const seen = new Set();
for (const c of improvedCombos) {
  const key = c.nums.join('-');
  if (!seen.has(key)) {
    seen.add(key);
    uniqueImproved.push(c);
  }
  if (uniqueImproved.length >= 50) break;
}

console.log('\n[개선된 TOP 30 조합]');
console.log('순위 | 번호                   | 점수 | 합계');
console.log('-'.repeat(50));
uniqueImproved.slice(0, 30).forEach((c, i) => {
  const numsStr = c.nums.map(n => n.toString().padStart(2)).join(' ');
  const sum = c.nums.reduce((a, b) => a + b, 0);
  console.log(`${(i+1).toString().padStart(3)}  | ${numsStr} | ${c.score.toFixed(0).padStart(4)} | ${sum}`);
});

// 파일 저장
fs.writeFileSync(
  'C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_improved_top50.csv',
  '순위,번호1,번호2,번호3,번호4,번호5,번호6,점수,합계\n' +
  uniqueImproved.map((c, i) => `${i+1},${c.nums.join(',')},${c.score.toFixed(0)},${c.nums.reduce((a,b)=>a+b,0)}`).join('\n'),
  'utf8'
);

console.log('\n' + '=' .repeat(70));
console.log('📊 최종 요약');
console.log('=' .repeat(70));
console.log(`
┌──────────────────────────────────────────────────────────────────────┐
│ 🎯 핵심 추천 번호 (반드시 포함)                                       │
├──────────────────────────────────────────────────────────────────────┤
│ ${tier1.map(n => n.toString().padStart(2)).join(', ')}                                     │
├──────────────────────────────────────────────────────────────────────┤
│ 📈 출현 예정 번호 (주기 분석)                                         │
├──────────────────────────────────────────────────────────────────────┤
│ ${dueNums.slice(0, 8).map(n => n.toString().padStart(2)).join(', ')}                                     │
├──────────────────────────────────────────────────────────────────────┤
│ 🔥 최고 추천 조합 TOP 5                                               │
├──────────────────────────────────────────────────────────────────────┤`);
uniqueImproved.slice(0, 5).forEach((c, i) => {
  console.log(`│ ${i+1}위: ${c.nums.map(n => n.toString().padStart(2)).join(', ')}  (점수: ${c.score.toFixed(0)}, 합계: ${c.nums.reduce((a,b)=>a+b,0)})          │`);
});
console.log(`├──────────────────────────────────────────────────────────────────────┤
│ ⚠️  마지막 회차 번호 (연속 출현 가능성 낮음)                          │
├──────────────────────────────────────────────────────────────────────┤
│ ${lastDraw.map(n => n.toString().padStart(2)).join(', ')}                                        │
└──────────────────────────────────────────────────────────────────────┘`);

console.log('\n💾 개선된 조합이 loto6_improved_top50.csv에 저장되었습니다.');
