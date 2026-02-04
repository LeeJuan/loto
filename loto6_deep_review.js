const fs = require('fs');

console.log('🔬 로또6 심층 검토 및 최종 검증');
console.log('=' .repeat(70));

// 데이터 로드
const csv = fs.readFileSync('C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_results.csv', 'utf8');
const lines = csv.trim().split('\n').slice(1);
const draws = lines.map(line => {
  const parts = line.split(',');
  return {
    round: parseInt(parts[0]),
    date: parts[1],
    numbers: [parts[2], parts[3], parts[4], parts[5], parts[6], parts[7]].map(Number),
    bonus: parseInt(parts[8])
  };
});

console.log(`데이터: ${draws.length}회차 (${draws[0].date} ~ ${draws[draws.length-1].date})\n`);

// ==================== 1. 과거 당첨 패턴과 전략 매칭 검증 ====================
console.log('=' .repeat(70));
console.log('1️⃣ 과거 당첨번호 패턴 재검증');
console.log('=' .repeat(70));

// 합계 분포 재확인
const sums = draws.map(d => d.numbers.reduce((a, b) => a + b, 0));
const sumRanges = { '80-99': 0, '100-119': 0, '120-139': 0, '140-159': 0, '160-179': 0, '180+': 0 };
sums.forEach(s => {
  if (s < 100) sumRanges['80-99']++;
  else if (s < 120) sumRanges['100-119']++;
  else if (s < 140) sumRanges['120-139']++;
  else if (s < 160) sumRanges['140-159']++;
  else if (s < 180) sumRanges['160-179']++;
  else sumRanges['180+']++;
});

console.log('\n[합계 분포]');
let sumTotal = 0;
Object.entries(sumRanges).forEach(([range, count]) => {
  const pct = (count / draws.length * 100).toFixed(1);
  sumTotal += count;
  console.log(`  ${range}: ${count}회 (${pct}%) - 누적 ${(sumTotal/draws.length*100).toFixed(1)}%`);
});

const avgSum = sums.reduce((a, b) => a + b, 0) / sums.length;
const minSum = Math.min(...sums);
const maxSum = Math.max(...sums);
console.log(`\n  평균: ${avgSum.toFixed(1)}, 최소: ${minSum}, 최대: ${maxSum}`);

// ==================== 2. 최근 트렌드 세밀 분석 ====================
console.log('\n' + '=' .repeat(70));
console.log('2️⃣ 최근 트렌드 세밀 분석');
console.log('=' .repeat(70));

// 최근 5, 10, 20, 30회 빈도 비교
const periods = [5, 10, 20, 30];
const periodFreqs = {};

periods.forEach(p => {
  periodFreqs[p] = {};
  for (let i = 1; i <= 43; i++) periodFreqs[p][i] = 0;
  draws.slice(-p).forEach(d => d.numbers.forEach(n => periodFreqs[p][n]++));
});

// 트렌드 상승/하락 번호 찾기
const trendAnalysis = [];
for (let num = 1; num <= 43; num++) {
  const r5 = periodFreqs[5][num] / 5;
  const r10 = periodFreqs[10][num] / 10;
  const r20 = periodFreqs[20][num] / 20;
  const r30 = periodFreqs[30][num] / 30;

  // 트렌드 점수: 최근으로 올수록 빈도 증가 = 양수
  const trend = (r5 - r30) * 10 + (r10 - r30) * 5;

  trendAnalysis.push({ num, r5, r10, r20, r30, trend });
}

trendAnalysis.sort((a, b) => b.trend - a.trend);

console.log('\n[상승 트렌드 번호 TOP 10]');
console.log('번호 | 최근5회 | 최근10회 | 최근20회 | 최근30회 | 트렌드');
console.log('-'.repeat(60));
trendAnalysis.slice(0, 10).forEach(t => {
  console.log(`  ${t.num.toString().padStart(2)} |  ${(t.r5*100).toFixed(0).padStart(3)}%  |   ${(t.r10*100).toFixed(0).padStart(3)}%  |   ${(t.r20*100).toFixed(0).padStart(3)}%  |   ${(t.r30*100).toFixed(0).padStart(3)}%  | ${t.trend > 0 ? '+' : ''}${t.trend.toFixed(1)}`);
});

console.log('\n[하락 트렌드 번호 (주의)]');
trendAnalysis.slice(-10).forEach(t => {
  console.log(`  ${t.num.toString().padStart(2)} |  ${(t.r5*100).toFixed(0).padStart(3)}%  |   ${(t.r10*100).toFixed(0).padStart(3)}%  |   ${(t.r20*100).toFixed(0).padStart(3)}%  |   ${(t.r30*100).toFixed(0).padStart(3)}%  | ${t.trend > 0 ? '+' : ''}${t.trend.toFixed(1)}`);
});

// ==================== 3. 번호별 출현 주기 정밀 분석 ====================
console.log('\n' + '=' .repeat(70));
console.log('3️⃣ 번호별 출현 주기 정밀 분석');
console.log('=' .repeat(70));

const cycleAnalysis = [];
for (let num = 1; num <= 43; num++) {
  const appearances = [];
  draws.forEach((d, idx) => {
    if (d.numbers.includes(num)) appearances.push(idx);
  });

  if (appearances.length >= 3) {
    const gaps = [];
    for (let i = 1; i < appearances.length; i++) {
      gaps.push(appearances[i] - appearances[i - 1]);
    }

    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const maxGap = Math.max(...gaps);
    const minGap = Math.min(...gaps);
    const currentGap = draws.length - 1 - appearances[appearances.length - 1];

    // 표준편차
    const variance = gaps.reduce((sum, g) => sum + Math.pow(g - avgGap, 2), 0) / gaps.length;
    const stdDev = Math.sqrt(variance);

    // 예상 출현 확률 (정규분포 기반)
    const zScore = (currentGap - avgGap) / (stdDev || 1);

    cycleAnalysis.push({
      num,
      avgGap: avgGap.toFixed(1),
      stdDev: stdDev.toFixed(1),
      currentGap,
      maxGap,
      minGap,
      zScore: zScore.toFixed(2),
      appearances: appearances.length,
      // 높은 zScore = 평균보다 오래 미출현 = 출현 예상
      priority: zScore > 1 ? 'HIGH' : zScore > 0.5 ? 'MED' : 'LOW'
    });
  }
}

cycleAnalysis.sort((a, b) => parseFloat(b.zScore) - parseFloat(a.zScore));

console.log('\n[출현 예정 번호 (통계적 분석)]');
console.log('번호 | 평균주기 | 표준편차 | 현재갭 | 최대갭 | Z점수 | 우선순위');
console.log('-'.repeat(70));
cycleAnalysis.slice(0, 15).forEach(c => {
  console.log(`  ${c.num.toString().padStart(2)} |   ${c.avgGap.padStart(4)}  |   ${c.stdDev.padStart(4)}  |  ${c.currentGap.toString().padStart(3)}  |  ${c.maxGap.toString().padStart(3)}  | ${c.zScore.padStart(5)} |  ${c.priority}`);
});

// ==================== 4. 번호 조합 상관관계 분석 ====================
console.log('\n' + '=' .repeat(70));
console.log('4️⃣ 번호 조합 상관관계 분석');
console.log('=' .repeat(70));

// 번호 쌍 빈도
const pairFreq = {};
draws.forEach(d => {
  for (let i = 0; i < d.numbers.length; i++) {
    for (let j = i + 1; j < d.numbers.length; j++) {
      const key = [d.numbers[i], d.numbers[j]].sort((a, b) => a - b).join('-');
      pairFreq[key] = (pairFreq[key] || 0) + 1;
    }
  }
});

// 출현 예정 번호들 간의 조합 확인
const highPriorityNums = cycleAnalysis.filter(c => c.priority === 'HIGH').map(c => c.num);
console.log(`\n출현 예정 고우선순위 번호: ${highPriorityNums.join(', ')}`);

console.log('\n[고우선순위 번호들의 과거 조합 빈도]');
for (let i = 0; i < highPriorityNums.length; i++) {
  for (let j = i + 1; j < highPriorityNums.length; j++) {
    const key = [highPriorityNums[i], highPriorityNums[j]].sort((a, b) => a - b).join('-');
    const freq = pairFreq[key] || 0;
    if (freq >= 2) {
      console.log(`  (${key}): ${freq}회`);
    }
  }
}

// ==================== 5. 홀짝/고저 패턴 정밀 분석 ====================
console.log('\n' + '=' .repeat(70));
console.log('5️⃣ 홀짝/고저 패턴 정밀 분석');
console.log('=' .repeat(70));

// 최근 30회 패턴
const recent30 = draws.slice(-30);
const oddEvenRecent = {};
const highLowRecent = {};

recent30.forEach(d => {
  const odd = d.numbers.filter(n => n % 2 === 1).length;
  const low = d.numbers.filter(n => n <= 21).length;
  const oeKey = `${odd}:${6-odd}`;
  const hlKey = `${low}:${6-low}`;
  oddEvenRecent[oeKey] = (oddEvenRecent[oeKey] || 0) + 1;
  highLowRecent[hlKey] = (highLowRecent[hlKey] || 0) + 1;
});

console.log('\n[최근 30회 홀짝 분포]');
Object.entries(oddEvenRecent).sort((a, b) => b[1] - a[1]).forEach(([pattern, count]) => {
  console.log(`  홀${pattern}: ${count}회 (${(count/30*100).toFixed(1)}%)`);
});

console.log('\n[최근 30회 고저 분포]');
Object.entries(highLowRecent).sort((a, b) => b[1] - a[1]).forEach(([pattern, count]) => {
  console.log(`  저${pattern}: ${count}회 (${(count/30*100).toFixed(1)}%)`);
});

// ==================== 6. 구간별 출현 패턴 ====================
console.log('\n' + '=' .repeat(70));
console.log('6️⃣ 구간별 출현 패턴 (최근 30회)');
console.log('=' .repeat(70));

const rangePatterns = {};
recent30.forEach(d => {
  const r1 = d.numbers.filter(n => n <= 10).length;
  const r2 = d.numbers.filter(n => n >= 11 && n <= 21).length;
  const r3 = d.numbers.filter(n => n >= 22 && n <= 32).length;
  const r4 = d.numbers.filter(n => n >= 33).length;
  const pattern = `${r1}-${r2}-${r3}-${r4}`;
  rangePatterns[pattern] = (rangePatterns[pattern] || 0) + 1;
});

console.log('\n[구간 패턴 (1-10 / 11-21 / 22-32 / 33-43)]');
Object.entries(rangePatterns).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([pattern, count]) => {
  console.log(`  ${pattern}: ${count}회`);
});

// ==================== 7. 현재 전략 검증 ====================
console.log('\n' + '=' .repeat(70));
console.log('7️⃣ 현재 전략 (loto6_best_500.csv) 검증');
console.log('=' .repeat(70));

const bestTickets = fs.readFileSync('C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_best_500.csv', 'utf8')
  .trim().split('\n').slice(1)
  .map(line => {
    const parts = line.split(',');
    return [parts[1], parts[2], parts[3], parts[4], parts[5], parts[6]].map(Number);
  });

// 과거 당첨번호와 몇 개 일치하는지 시뮬레이션
console.log('\n[과거 당첨번호와 매칭 시뮬레이션]');
const matchCounts = { 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };

draws.forEach(d => {
  const drawSet = new Set(d.numbers);
  let bestMatch = 0;
  bestTickets.forEach(ticket => {
    const match = ticket.filter(n => drawSet.has(n)).length;
    if (match > bestMatch) bestMatch = match;
  });
  matchCounts[bestMatch]++;
});

console.log('500장 중 최고 매칭:');
Object.entries(matchCounts).sort((a, b) => parseInt(b[0]) - parseInt(a[0])).forEach(([match, count]) => {
  if (count > 0) {
    console.log(`  ${match}개 일치: ${count}회 (${(count/draws.length*100).toFixed(1)}%)`);
  }
});

// 고우선순위 번호 포함률
const highPrioritySet = new Set(highPriorityNums);
let hpCoverage = 0;
let hp3plus = 0;
bestTickets.forEach(ticket => {
  const hpCount = ticket.filter(n => highPrioritySet.has(n)).length;
  if (hpCount >= 1) hpCoverage++;
  if (hpCount >= 3) hp3plus++;
});

console.log(`\n고우선순위 번호 포함: ${hpCoverage}/500장 (${(hpCoverage/5).toFixed(1)}%)`);
console.log(`고우선순위 3개 이상: ${hp3plus}/500장 (${(hp3plus/5).toFixed(1)}%)`);

// ==================== 8. 개선 필요 사항 도출 ====================
console.log('\n' + '=' .repeat(70));
console.log('8️⃣ 개선 필요 사항 분석');
console.log('=' .repeat(70));

const issues = [];

// 1. Z점수 높은 번호 포함 확인
const veryHighZ = cycleAnalysis.filter(c => parseFloat(c.zScore) > 1.5).map(c => c.num);
console.log(`\n[Z점수 1.5 이상 번호]: ${veryHighZ.join(', ')}`);

let veryHighZCoverage = 0;
bestTickets.forEach(ticket => {
  if (ticket.some(n => veryHighZ.includes(n))) veryHighZCoverage++;
});
console.log(`  현재 포함률: ${veryHighZCoverage}/500장 (${(veryHighZCoverage/5).toFixed(1)}%)`);
if (veryHighZCoverage < 450) {
  issues.push(`Z점수 1.5+ 번호 포함 부족 (${veryHighZ.join(', ')})`);
}

// 2. 상승 트렌드 번호 포함 확인
const risingNums = trendAnalysis.filter(t => t.trend > 0.5).map(t => t.num);
console.log(`\n[상승 트렌드 번호]: ${risingNums.join(', ')}`);

let risingCoverage = 0;
bestTickets.forEach(ticket => {
  if (ticket.some(n => risingNums.includes(n))) risingCoverage++;
});
console.log(`  현재 포함률: ${risingCoverage}/500장 (${(risingCoverage/5).toFixed(1)}%)`);

// 3. 합계 분포 확인
const ticketSums = bestTickets.map(t => t.reduce((a, b) => a + b, 0));
const ticketSumRanges = { '80-99': 0, '100-119': 0, '120-139': 0, '140-159': 0, '160-179': 0, '180+': 0 };
ticketSums.forEach(s => {
  if (s < 100) ticketSumRanges['80-99']++;
  else if (s < 120) ticketSumRanges['100-119']++;
  else if (s < 140) ticketSumRanges['120-139']++;
  else if (s < 160) ticketSumRanges['140-159']++;
  else if (s < 180) ticketSumRanges['160-179']++;
  else ticketSumRanges['180+']++;
});

console.log('\n[500장 합계 분포 vs 실제 당첨 분포]');
console.log('범위     | 실제 | 500장 | 차이');
console.log('-'.repeat(40));
Object.keys(sumRanges).forEach(range => {
  const actual = (sumRanges[range] / draws.length * 100).toFixed(1);
  const tickets = (ticketSumRanges[range] / 500 * 100).toFixed(1);
  const diff = (parseFloat(tickets) - parseFloat(actual)).toFixed(1);
  console.log(`${range.padStart(8)} | ${actual.padStart(4)}% | ${tickets.padStart(5)}% | ${diff > 0 ? '+' : ''}${diff}%`);

  if (Math.abs(parseFloat(diff)) > 10) {
    issues.push(`합계 ${range} 분포 불균형 (차이: ${diff}%)`);
  }
});

// ==================== 9. 최종 권장 번호 도출 ====================
console.log('\n' + '=' .repeat(70));
console.log('9️⃣ 최종 권장 번호 (종합 분석)');
console.log('=' .repeat(70));

// 종합 점수 계산
const finalScore = {};
for (let i = 1; i <= 43; i++) {
  let score = 0;

  // Z점수 반영 (40%)
  const cycle = cycleAnalysis.find(c => c.num === i);
  if (cycle) {
    score += Math.max(0, parseFloat(cycle.zScore)) * 40;
  }

  // 트렌드 반영 (20%)
  const trend = trendAnalysis.find(t => t.num === i);
  if (trend && trend.trend > 0) {
    score += trend.trend * 20;
  }

  // 전체 빈도 반영 (20%)
  let totalFreq = 0;
  draws.forEach(d => { if (d.numbers.includes(i)) totalFreq++; });
  score += (totalFreq / draws.length) * 20;

  // 쌍 빈도 반영 (20%)
  let pairScore = 0;
  Object.entries(pairFreq).forEach(([pair, freq]) => {
    if (pair.split('-').map(Number).includes(i) && freq >= 5) {
      pairScore += freq;
    }
  });
  score += Math.min(pairScore / 10, 20);

  finalScore[i] = score;
}

const finalRanked = Object.entries(finalScore)
  .map(([num, score]) => ({ num: parseInt(num), score }))
  .sort((a, b) => b.score - a.score);

console.log('\n[종합 순위 TOP 20]');
finalRanked.slice(0, 20).forEach((item, i) => {
  const cycle = cycleAnalysis.find(c => c.num === item.num);
  const trend = trendAnalysis.find(t => t.num === item.num);
  const zScore = cycle ? cycle.zScore : 'N/A';
  const trendVal = trend ? trend.trend.toFixed(1) : 'N/A';
  console.log(`  ${(i+1).toString().padStart(2)}위: ${item.num.toString().padStart(2)} (점수: ${item.score.toFixed(1)}, Z: ${zScore}, 트렌드: ${trendVal})`);
});

// 최종 그룹
const mustHave = finalRanked.slice(0, 8).map(n => n.num);
const shouldHave = finalRanked.slice(8, 16).map(n => n.num);
const mayHave = finalRanked.slice(16, 25).map(n => n.num);

console.log(`\n🥇 필수 포함 (8개): ${mustHave.join(', ')}`);
console.log(`🥈 권장 포함 (8개): ${shouldHave.join(', ')}`);
console.log(`🥉 보조 (9개): ${mayHave.join(', ')}`);

// ==================== 10. 문제점 및 결론 ====================
console.log('\n' + '=' .repeat(70));
console.log('🔍 검토 결과');
console.log('=' .repeat(70));

if (issues.length > 0) {
  console.log('\n[발견된 문제점]');
  issues.forEach((issue, i) => console.log(`  ${i+1}. ${issue}`));
} else {
  console.log('\n✅ 특별한 문제점 없음');
}

// 현재 전략과 최종 권장 번호 비교
const currentTier1 = [11, 43, 20, 22, 19, 5, 26, 1];
const overlap = mustHave.filter(n => currentTier1.includes(n));
console.log(`\n[현재 Tier1과 최종 필수번호 일치]: ${overlap.length}/8개`);
console.log(`  현재: ${currentTier1.join(', ')}`);
console.log(`  최종: ${mustHave.join(', ')}`);

if (overlap.length < 6) {
  console.log('\n⚠️ 전략 수정 필요: Tier1 번호 조정 권장');
} else {
  console.log('\n✅ 현재 전략 적절함');
}

// 저장
fs.writeFileSync(
  'C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_final_numbers.json',
  JSON.stringify({
    mustHave,
    shouldHave,
    mayHave,
    veryHighZ,
    risingNums,
    analysisDate: new Date().toISOString()
  }, null, 2),
  'utf8'
);

console.log('\n💾 분석 결과가 loto6_final_numbers.json에 저장되었습니다.');
