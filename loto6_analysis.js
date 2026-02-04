const fs = require('fs');

// CSV 읽기
const csv = fs.readFileSync('C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_numbers_only.csv', 'utf8');
const draws = csv.trim().split('\n').map(line => line.split(',').map(Number));

console.log(`총 ${draws.length}회 데이터 분석 시작...\n`);

// ==================== 1. 번호별 출현 빈도 분석 ====================
console.log('=' .repeat(60));
console.log('1. 번호별 출현 빈도 분석');
console.log('=' .repeat(60));

const frequency = {};
for (let i = 1; i <= 43; i++) frequency[i] = 0;

draws.forEach(draw => {
  draw.forEach(num => frequency[num]++);
});

const sortedByFreq = Object.entries(frequency)
  .map(([num, count]) => ({ num: parseInt(num), count, rate: (count / draws.length * 100).toFixed(1) }))
  .sort((a, b) => b.count - a.count);

console.log('\n[HOT 번호 TOP 15]');
sortedByFreq.slice(0, 15).forEach((item, i) => {
  console.log(`  ${i+1}위: ${item.num.toString().padStart(2)} - ${item.count}회 (${item.rate}%)`);
});

console.log('\n[COLD 번호 TOP 10]');
sortedByFreq.slice(-10).reverse().forEach((item, i) => {
  console.log(`  ${i+1}위: ${item.num.toString().padStart(2)} - ${item.count}회 (${item.rate}%)`);
});

// ==================== 2. 최근 20회 트렌드 분석 ====================
console.log('\n' + '=' .repeat(60));
console.log('2. 최근 20회 트렌드 분석 (핫/콜드 변화)');
console.log('=' .repeat(60));

const recent20 = draws.slice(-20);
const recentFreq = {};
for (let i = 1; i <= 43; i++) recentFreq[i] = 0;

recent20.forEach(draw => {
  draw.forEach(num => recentFreq[num]++);
});

const recentHot = Object.entries(recentFreq)
  .map(([num, count]) => ({ num: parseInt(num), count }))
  .sort((a, b) => b.count - a.count);

console.log('\n[최근 20회 HOT 번호 TOP 15]');
recentHot.slice(0, 15).forEach((item, i) => {
  console.log(`  ${i+1}위: ${item.num.toString().padStart(2)} - ${item.count}회`);
});

console.log('\n[최근 20회 미출현 번호]');
const notAppeared = recentHot.filter(item => item.count === 0).map(item => item.num);
console.log(`  ${notAppeared.join(', ') || '없음'}`);

// ==================== 3. 합계 범위 분석 ====================
console.log('\n' + '=' .repeat(60));
console.log('3. 당첨번호 합계 분석');
console.log('=' .repeat(60));

const sums = draws.map(draw => draw.reduce((a, b) => a + b, 0));
const sumStats = {
  min: Math.min(...sums),
  max: Math.max(...sums),
  avg: (sums.reduce((a, b) => a + b, 0) / sums.length).toFixed(1),
};

// 합계 구간별 분포
const sumRanges = {};
sums.forEach(sum => {
  const range = Math.floor(sum / 20) * 20;
  const key = `${range}-${range + 19}`;
  sumRanges[key] = (sumRanges[key] || 0) + 1;
});

console.log(`\n최소: ${sumStats.min}, 최대: ${sumStats.max}, 평균: ${sumStats.avg}`);
console.log('\n[합계 구간별 분포]');
Object.entries(sumRanges).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).forEach(([range, count]) => {
  const bar = '█'.repeat(Math.round(count / 2));
  console.log(`  ${range.padStart(7)}: ${count.toString().padStart(3)}회 ${bar}`);
});

// ==================== 4. 홀짝 분석 ====================
console.log('\n' + '=' .repeat(60));
console.log('4. 홀짝 패턴 분석');
console.log('=' .repeat(60));

const oddEvenPatterns = {};
draws.forEach(draw => {
  const oddCount = draw.filter(n => n % 2 === 1).length;
  const pattern = `홀${oddCount}:짝${6-oddCount}`;
  oddEvenPatterns[pattern] = (oddEvenPatterns[pattern] || 0) + 1;
});

console.log('\n[홀짝 비율 분포]');
Object.entries(oddEvenPatterns)
  .sort((a, b) => b[1] - a[1])
  .forEach(([pattern, count]) => {
    const rate = (count / draws.length * 100).toFixed(1);
    console.log(`  ${pattern}: ${count}회 (${rate}%)`);
  });

// ==================== 5. 고저 분석 (1-21 vs 22-43) ====================
console.log('\n' + '=' .repeat(60));
console.log('5. 고저 패턴 분석 (1-21: 저, 22-43: 고)');
console.log('=' .repeat(60));

const highLowPatterns = {};
draws.forEach(draw => {
  const lowCount = draw.filter(n => n <= 21).length;
  const pattern = `저${lowCount}:고${6-lowCount}`;
  highLowPatterns[pattern] = (highLowPatterns[pattern] || 0) + 1;
});

console.log('\n[고저 비율 분포]');
Object.entries(highLowPatterns)
  .sort((a, b) => b[1] - a[1])
  .forEach(([pattern, count]) => {
    const rate = (count / draws.length * 100).toFixed(1);
    console.log(`  ${pattern}: ${count}회 (${rate}%)`);
  });

// ==================== 6. 연속번호 분석 ====================
console.log('\n' + '=' .repeat(60));
console.log('6. 연속번호 패턴 분석');
console.log('=' .repeat(60));

const consecutivePatterns = {};
draws.forEach(draw => {
  const sorted = [...draw].sort((a, b) => a - b);
  let consecutiveCount = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] - sorted[i] === 1) consecutiveCount++;
  }
  consecutivePatterns[consecutiveCount] = (consecutivePatterns[consecutiveCount] || 0) + 1;
});

console.log('\n[연속번호 쌍 개수 분포]');
Object.entries(consecutivePatterns)
  .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
  .forEach(([count, freq]) => {
    const rate = (freq / draws.length * 100).toFixed(1);
    console.log(`  ${count}쌍: ${freq}회 (${rate}%)`);
  });

// ==================== 7. 끝수 분석 ====================
console.log('\n' + '=' .repeat(60));
console.log('7. 끝수(일의 자리) 분석');
console.log('=' .repeat(60));

const lastDigits = {};
for (let i = 0; i <= 9; i++) lastDigits[i] = 0;

draws.forEach(draw => {
  draw.forEach(num => {
    lastDigits[num % 10]++;
  });
});

console.log('\n[끝수별 출현 빈도]');
Object.entries(lastDigits)
  .sort((a, b) => b[1] - a[1])
  .forEach(([digit, count]) => {
    const bar = '█'.repeat(Math.round(count / 5));
    console.log(`  끝수 ${digit}: ${count.toString().padStart(3)}회 ${bar}`);
  });

// ==================== 8. 10단위 구간 분석 ====================
console.log('\n' + '=' .repeat(60));
console.log('8. 10단위 구간별 분석');
console.log('=' .repeat(60));

const decadeRanges = { '1-10': 0, '11-20': 0, '21-30': 0, '31-40': 0, '41-43': 0 };
draws.forEach(draw => {
  draw.forEach(num => {
    if (num <= 10) decadeRanges['1-10']++;
    else if (num <= 20) decadeRanges['11-20']++;
    else if (num <= 30) decadeRanges['21-30']++;
    else if (num <= 40) decadeRanges['31-40']++;
    else decadeRanges['41-43']++;
  });
});

console.log('\n[구간별 출현 빈도]');
Object.entries(decadeRanges).forEach(([range, count]) => {
  const rate = (count / (draws.length * 6) * 100).toFixed(1);
  const bar = '█'.repeat(Math.round(count / 10));
  console.log(`  ${range.padStart(6)}: ${count.toString().padStart(3)}회 (${rate}%) ${bar}`);
});

// ==================== 9. 번호 간격 분석 ====================
console.log('\n' + '=' .repeat(60));
console.log('9. 번호 간격 패턴 분석');
console.log('=' .repeat(60));

const gaps = [];
draws.forEach(draw => {
  const sorted = [...draw].sort((a, b) => a - b);
  const drawGaps = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    drawGaps.push(sorted[i + 1] - sorted[i]);
  }
  gaps.push(drawGaps);
});

const avgGaps = [];
for (let i = 0; i < 5; i++) {
  const sum = gaps.reduce((acc, g) => acc + g[i], 0);
  avgGaps.push((sum / gaps.length).toFixed(1));
}

console.log('\n[번호 간 평균 간격]');
console.log(`  1번째→2번째: ${avgGaps[0]}`);
console.log(`  2번째→3번째: ${avgGaps[1]}`);
console.log(`  3번째→4번째: ${avgGaps[2]}`);
console.log(`  4번째→5번째: ${avgGaps[3]}`);
console.log(`  5번째→6번째: ${avgGaps[4]}`);

// ==================== 10. 이월 번호 분석 ====================
console.log('\n' + '=' .repeat(60));
console.log('10. 이월 번호 분석 (이전 회차 번호 재출현)');
console.log('=' .repeat(60));

const carryOverCounts = {};
for (let i = 1; i < draws.length; i++) {
  const prev = new Set(draws[i - 1]);
  const curr = draws[i];
  const carryOver = curr.filter(n => prev.has(n)).length;
  carryOverCounts[carryOver] = (carryOverCounts[carryOver] || 0) + 1;
}

console.log('\n[이월 번호 개수 분포]');
Object.entries(carryOverCounts)
  .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
  .forEach(([count, freq]) => {
    const rate = (freq / (draws.length - 1) * 100).toFixed(1);
    console.log(`  ${count}개 이월: ${freq}회 (${rate}%)`);
  });

// ==================== 11. AC값 분석 ====================
console.log('\n' + '=' .repeat(60));
console.log('11. AC값 (Arithmetic Complexity) 분석');
console.log('=' .repeat(60));

function calculateAC(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const differences = new Set();
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      differences.add(sorted[j] - sorted[i]);
    }
  }
  return differences.size - (sorted.length - 1);
}

const acValues = {};
draws.forEach(draw => {
  const ac = calculateAC(draw);
  acValues[ac] = (acValues[ac] || 0) + 1;
});

console.log('\n[AC값 분포] (높을수록 번호가 고르게 분산)');
Object.entries(acValues)
  .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
  .forEach(([ac, count]) => {
    const rate = (count / draws.length * 100).toFixed(1);
    console.log(`  AC ${ac.toString().padStart(2)}: ${count.toString().padStart(3)}회 (${rate}%)`);
  });

// ==================== 12. 최근 미출현 기간 분석 ====================
console.log('\n' + '=' .repeat(60));
console.log('12. 최근 미출현 기간 분석 (마지막 출현 후 경과 회차)');
console.log('=' .repeat(60));

const lastAppearance = {};
for (let i = 1; i <= 43; i++) lastAppearance[i] = -1;

draws.forEach((draw, idx) => {
  draw.forEach(num => {
    lastAppearance[num] = idx;
  });
});

const gapFromLast = Object.entries(lastAppearance)
  .map(([num, lastIdx]) => ({
    num: parseInt(num),
    gap: draws.length - 1 - lastIdx
  }))
  .sort((a, b) => b.gap - a.gap);

console.log('\n[오랫동안 미출현 번호 TOP 15]');
gapFromLast.slice(0, 15).forEach((item, i) => {
  console.log(`  ${i+1}위: ${item.num.toString().padStart(2)} - ${item.gap}회 미출현`);
});

// ==================== 13. 쌍 번호 분석 ====================
console.log('\n' + '=' .repeat(60));
console.log('13. 자주 함께 출현하는 번호 쌍 분석');
console.log('=' .repeat(60));

const pairs = {};
draws.forEach(draw => {
  for (let i = 0; i < draw.length; i++) {
    for (let j = i + 1; j < draw.length; j++) {
      const key = [draw[i], draw[j]].sort((a, b) => a - b).join('-');
      pairs[key] = (pairs[key] || 0) + 1;
    }
  }
});

const sortedPairs = Object.entries(pairs)
  .map(([pair, count]) => ({ pair, count }))
  .sort((a, b) => b.count - a.count);

console.log('\n[자주 함께 출현하는 번호 쌍 TOP 20]');
sortedPairs.slice(0, 20).forEach((item, i) => {
  console.log(`  ${(i+1).toString().padStart(2)}위: (${item.pair}) - ${item.count}회`);
});

// ==================== SUMMARY ====================
console.log('\n' + '=' .repeat(60));
console.log('📊 분석 결과 요약');
console.log('=' .repeat(60));

const hotNumbers = sortedByFreq.slice(0, 10).map(item => item.num);
const coldNumbers = sortedByFreq.slice(-10).map(item => item.num);
const recentHotNumbers = recentHot.slice(0, 10).map(item => item.num);
const overdueNumbers = gapFromLast.slice(0, 10).map(item => item.num);

console.log('\n[전체 HOT 번호 TOP 10]:', hotNumbers.join(', '));
console.log('[전체 COLD 번호 TOP 10]:', coldNumbers.join(', '));
console.log('[최근 20회 HOT 번호]:', recentHotNumbers.join(', '));
console.log('[오래 미출현 번호 TOP 10]:', overdueNumbers.join(', '));
console.log(`\n[권장 합계 범위]: ${Math.round(sumStats.avg - 30)} ~ ${Math.round(parseFloat(sumStats.avg) + 30)}`);
console.log('[가장 많은 홀짝 비율]: 홀3:짝3');
console.log('[가장 많은 고저 비율]: 저3:고3');

// 결과 저장
const analysisResult = {
  totalDraws: draws.length,
  frequency: sortedByFreq,
  recentHot: recentHot.slice(0, 15),
  sumStats,
  hotNumbers,
  coldNumbers,
  recentHotNumbers,
  overdueNumbers,
  topPairs: sortedPairs.slice(0, 30)
};

fs.writeFileSync(
  'C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_analysis_result.json',
  JSON.stringify(analysisResult, null, 2),
  'utf8'
);

console.log('\n분석 결과가 loto6_analysis_result.json에 저장되었습니다.');
