const fs = require('fs');

// CSV 읽기
const csv = fs.readFileSync('C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_numbers_only.csv', 'utf8');
const draws = csv.trim().split('\n').map(line => line.split(',').map(Number));

console.log('🎯 로또6 최종 500장 전략 (보완판)\n');
console.log('=' .repeat(70));

// ==================== 핵심 분석 ====================
const frequency = {};
for (let i = 1; i <= 43; i++) frequency[i] = 0;
draws.forEach(draw => draw.forEach(num => frequency[num]++));

const recent30 = draws.slice(-30);
const recentFreq = {};
for (let i = 1; i <= 43; i++) recentFreq[i] = 0;
recent30.forEach(draw => draw.forEach(num => recentFreq[num]++));

const lastAppearance = {};
for (let i = 1; i <= 43; i++) lastAppearance[i] = -1;
draws.forEach((draw, idx) => draw.forEach(num => lastAppearance[num] = idx));
const gapFromLast = {};
for (let i = 1; i <= 43; i++) {
  gapFromLast[i] = draws.length - 1 - lastAppearance[i];
}

// 번호 쌍 빈도
const pairs = {};
draws.forEach(draw => {
  for (let i = 0; i < draw.length; i++) {
    for (let j = i + 1; j < draw.length; j++) {
      const key = [draw[i], draw[j]].sort((a, b) => a - b).join('-');
      pairs[key] = (pairs[key] || 0) + 1;
    }
  }
});

// ==================== 번호 점수 ====================
const numberScores = {};
for (let num = 1; num <= 43; num++) {
  const freqScore = (frequency[num] / draws.length) * 100;
  const recentScore = (recentFreq[num] / 30) * 150;
  const gap = gapFromLast[num];
  let gapScore = 0;
  if (gap >= 10 && gap <= 20) gapScore = 20;
  else if (gap >= 5 && gap < 10) gapScore = 15;
  else if (gap > 20) gapScore = 25;
  else if (gap < 3) gapScore = 5;
  else gapScore = 10;

  numberScores[num] = {
    num,
    freqScore: freqScore,
    recentScore: recentScore,
    gapScore,
    gap,
    totalScore: freqScore + recentScore + gapScore
  };
}

const rankedNumbers = Object.values(numberScores).sort((a, b) => b.totalScore - a.totalScore);

// 그룹 분류
const groupA = rankedNumbers.slice(0, 12).map(n => n.num);
const groupB = rankedNumbers.slice(12, 22).map(n => n.num);
const groupC = rankedNumbers.slice(22, 32).map(n => n.num);
const groupD = rankedNumbers.slice(32).map(n => n.num);

const overdueNumbers = Object.entries(gapFromLast)
  .filter(([_, gap]) => gap >= 10)
  .sort((a, b) => b[1] - a[1])
  .map(([num, _]) => parseInt(num));

console.log('\n[번호 그룹 분류]');
console.log(`A그룹 (핵심): ${groupA.join(', ')}`);
console.log(`B그룹 (준핵심): ${groupB.join(', ')}`);
console.log(`C그룹 (보조): ${groupC.join(', ')}`);
console.log(`D그룹 (기타): ${groupD.join(', ')}`);
console.log(`미출현 10회+: ${overdueNumbers.join(', ')}`);

// 조합 검증
function isValidCombination(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum < 95 || sum > 175) return false;

  const oddCount = sorted.filter(n => n % 2 === 1).length;
  if (oddCount < 2 || oddCount > 4) return false;

  const lowCount = sorted.filter(n => n <= 21).length;
  if (lowCount < 1 || lowCount > 5) return false;

  let consecutive = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] - sorted[i] === 1) consecutive++;
  }
  if (consecutive >= 3) return false;

  const differences = new Set();
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      differences.add(sorted[j] - sorted[i]);
    }
  }
  const ac = differences.size - 5;
  if (ac < 5) return false;

  return true;
}

function scoreCombination(nums) {
  let score = 0;
  nums.forEach(n => {
    score += numberScores[n].totalScore / 5;
  });

  // 인기 쌍 보너스
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      const key = [nums[i], nums[j]].sort((a, b) => a - b).join('-');
      if (pairs[key] >= 7) score += 3;
    }
  }

  // 미출현 번호 보너스
  const overdueCount = nums.filter(n => overdueNumbers.includes(n)).length;
  score += overdueCount * 5;

  return Math.round(score);
}

// 조합 생성
console.log('\n조합 생성 중...');
const allCombinations = [];

// 전략 1: A+B 조합 (핫 넘버 중심)
function genStrategy1() {
  const combos = [];
  const pool = [...groupA, ...groupB];
  for (let i = 0; i < 15000; i++) {
    const shuffled = pool.sort(() => Math.random() - 0.5);
    const combo = shuffled.slice(0, 6).sort((a, b) => a - b);
    if (isValidCombination(combo)) {
      combos.push({ nums: combo, score: scoreCombination(combo), type: 1 });
    }
  }
  return combos;
}

// 전략 2: 균형 분배 (각 구간에서 선택)
function genStrategy2() {
  const combos = [];
  const r1 = [...Array(10)].map((_, i) => i + 1);
  const r2 = [...Array(11)].map((_, i) => i + 11);
  const r3 = [...Array(10)].map((_, i) => i + 22);
  const r4 = [...Array(12)].map((_, i) => i + 32);

  for (let i = 0; i < 20000; i++) {
    const n1 = r1[Math.floor(Math.random() * r1.length)];
    const n2 = r2[Math.floor(Math.random() * r2.length)];
    const n3 = r3[Math.floor(Math.random() * r3.length)];
    const n4 = r3[Math.floor(Math.random() * r3.length)];
    const n5 = r4[Math.floor(Math.random() * r4.length)];
    const n6 = r4[Math.floor(Math.random() * r4.length)];

    const combo = [...new Set([n1, n2, n3, n4, n5, n6])];
    if (combo.length === 6 && isValidCombination(combo)) {
      combos.push({ nums: combo.sort((a, b) => a - b), score: scoreCombination(combo), type: 2 });
    }
  }
  return combos;
}

// 전략 3: 미출현 번호 포함
function genStrategy3() {
  const combos = [];
  const pool = [...groupA, ...groupB, ...groupC];

  for (let i = 0; i < 15000; i++) {
    const overdue = overdueNumbers[Math.floor(Math.random() * Math.min(overdueNumbers.length, 8))];
    const shuffled = pool.filter(n => n !== overdue).sort(() => Math.random() - 0.5);
    const combo = [overdue, ...shuffled.slice(0, 5)].sort((a, b) => a - b);

    if (isValidCombination(combo)) {
      combos.push({ nums: combo, score: scoreCombination(combo) + 5, type: 3 });
    }
  }
  return combos;
}

// 전략 4: 핫 페어 중심
function genStrategy4() {
  const combos = [];
  const topPairs = Object.entries(pairs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([pair]) => pair.split('-').map(Number));

  const pool = [...groupA, ...groupB, ...groupC];

  for (let i = 0; i < 15000; i++) {
    const [p1, p2] = topPairs[Math.floor(Math.random() * topPairs.length)];
    const filtered = pool.filter(n => n !== p1 && n !== p2);
    const shuffled = filtered.sort(() => Math.random() - 0.5);
    const combo = [p1, p2, ...shuffled.slice(0, 4)].sort((a, b) => a - b);

    if (isValidCombination(combo)) {
      combos.push({ nums: combo, score: scoreCombination(combo) + 8, type: 4 });
    }
  }
  return combos;
}

// 전략 5: 전체 풀에서 랜덤 (다양성)
function genStrategy5() {
  const combos = [];
  const pool = [...Array(43)].map((_, i) => i + 1);

  for (let i = 0; i < 20000; i++) {
    const shuffled = pool.sort(() => Math.random() - 0.5);
    const combo = shuffled.slice(0, 6).sort((a, b) => a - b);

    if (isValidCombination(combo)) {
      combos.push({ nums: combo, score: scoreCombination(combo), type: 5 });
    }
  }
  return combos;
}

const s1 = genStrategy1();
const s2 = genStrategy2();
const s3 = genStrategy3();
const s4 = genStrategy4();
const s5 = genStrategy5();

console.log(`전략1: ${s1.length}개, 전략2: ${s2.length}개, 전략3: ${s3.length}개, 전략4: ${s4.length}개, 전략5: ${s5.length}개`);

// 중복 제거
const allUnique = new Map();
[...s1, ...s2, ...s3, ...s4, ...s5].forEach(c => {
  const key = c.nums.join('-');
  if (!allUnique.has(key) || allUnique.get(key).score < c.score) {
    allUnique.set(key, c);
  }
});

const sorted = Array.from(allUnique.values()).sort((a, b) => b.score - a.score);
console.log(`총 ${sorted.length}개 고유 조합`);

// 500개 선택 (다양성 확보)
const final500 = [];
for (const combo of sorted) {
  if (final500.length >= 500) break;

  let tooSimilar = false;
  for (const sel of final500.slice(-100)) {
    const overlap = combo.nums.filter(n => sel.nums.includes(n)).length;
    if (overlap >= 5) {
      tooSimilar = true;
      break;
    }
  }

  if (!tooSimilar) {
    final500.push(combo);
  }
}

// 부족하면 추가
while (final500.length < 500 && sorted.length > final500.length) {
  for (const combo of sorted) {
    const key = combo.nums.join('-');
    if (!final500.find(c => c.nums.join('-') === key)) {
      final500.push(combo);
      if (final500.length >= 500) break;
    }
  }
}

console.log(`최종 ${final500.length}개 선정`);

// ==================== 결과 분석 ====================
console.log('\n' + '=' .repeat(70));
console.log('📊 최종 500장 분석');
console.log('=' .repeat(70));

// 번호별 커버리지
const coverage = {};
for (let i = 1; i <= 43; i++) coverage[i] = 0;
final500.forEach(c => c.nums.forEach(n => coverage[n]++));

const coverageSorted = Object.entries(coverage)
  .map(([num, count]) => ({ num: parseInt(num), count }))
  .sort((a, b) => b.count - a.count);

console.log('\n[번호별 출현 횟수 TOP 20]');
coverageSorted.slice(0, 20).forEach(item => {
  const bar = '█'.repeat(Math.round(item.count / 5));
  console.log(`  ${item.num.toString().padStart(2)}: ${item.count.toString().padStart(3)}회 ${bar}`);
});

console.log('\n[번호별 출현 횟수 하위 10]');
coverageSorted.slice(-10).forEach(item => {
  console.log(`  ${item.num.toString().padStart(2)}: ${item.count}회`);
});

// 전략별 분포
const typeCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
final500.forEach(c => typeCount[c.type]++);
console.log('\n[전략별 분포]');
console.log(`  전략1 (핫넘버 중심): ${typeCount[1]}장`);
console.log(`  전략2 (균형 분배): ${typeCount[2]}장`);
console.log(`  전략3 (미출현 포함): ${typeCount[3]}장`);
console.log(`  전략4 (핫페어 중심): ${typeCount[4]}장`);
console.log(`  전략5 (다양성): ${typeCount[5]}장`);

// 합계 분포
const sumDist = {};
final500.forEach(c => {
  const sum = c.nums.reduce((a, b) => a + b, 0);
  const range = Math.floor(sum / 20) * 20;
  const key = `${range}-${range + 19}`;
  sumDist[key] = (sumDist[key] || 0) + 1;
});
console.log('\n[합계 분포]');
Object.entries(sumDist).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).forEach(([range, count]) => {
  console.log(`  ${range}: ${count}장`);
});

// ==================== TOP 30 조합 ====================
console.log('\n' + '=' .repeat(70));
console.log('⭐ TOP 30 추천 조합');
console.log('=' .repeat(70));
console.log('\n순위 | 번호                   | 점수 | 합계 | 전략');
console.log('-'.repeat(55));
final500.slice(0, 30).forEach((c, i) => {
  const numsStr = c.nums.map(n => n.toString().padStart(2)).join(' ');
  const sum = c.nums.reduce((a, b) => a + b, 0);
  console.log(`${(i+1).toString().padStart(3)}  | ${numsStr} | ${c.score.toString().padStart(3)} | ${sum.toString().padStart(3)} | ${c.type}`);
});

// ==================== 파일 저장 ====================
const outputFull = final500.map((c, i) => {
  const sum = c.nums.reduce((a, b) => a + b, 0);
  return `${i+1},${c.nums.join(',')},${c.score},${sum},전략${c.type}`;
});
fs.writeFileSync(
  'C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_500_final.csv',
  '순번,번호1,번호2,번호3,번호4,번호5,번호6,점수,합계,전략\n' + outputFull.join('\n'),
  'utf8'
);

const outputSimple = final500.map(c => c.nums.join(','));
fs.writeFileSync(
  'C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_500_numbers.txt',
  outputSimple.join('\n'),
  'utf8'
);

console.log('\n' + '=' .repeat(70));
console.log('💾 저장 완료');
console.log('  - loto6_500_final.csv (상세)');
console.log('  - loto6_500_numbers.txt (번호만)');
console.log('=' .repeat(70));

// ==================== 최종 요약 ====================
console.log('\n' + '=' .repeat(70));
console.log('📋 구매 가이드 요약');
console.log('=' .repeat(70));

console.log(`
┌─────────────────────────────────────────────────────────────────────┐
│ 🎯 핵심 추천 번호 (가장 많이 포함)                                   │
├─────────────────────────────────────────────────────────────────────┤
│ ${coverageSorted.slice(0, 10).map(n => n.num.toString().padStart(2)).join(', ')}                                │
├─────────────────────────────────────────────────────────────────────┤
│ 📊 적용된 룰                                                         │
├─────────────────────────────────────────────────────────────────────┤
│ ✓ 합계 범위: 95 ~ 175                                               │
│ ✓ 홀짝 비율: 2:4 ~ 4:2                                              │
│ ✓ 고저 비율: 1:5 ~ 5:1 (21 기준)                                    │
│ ✓ 연속번호: 최대 2쌍                                                │
│ ✓ AC값: 5 이상 (분산도)                                             │
├─────────────────────────────────────────────────────────────────────┤
│ 💡 전략 배분                                                         │
├─────────────────────────────────────────────────────────────────────┤
│ 핫넘버 중심: ${typeCount[1]}장 | 균형분배: ${typeCount[2]}장 | 미출현포함: ${typeCount[3]}장   │
│ 핫페어 중심: ${typeCount[4]}장 | 다양성: ${typeCount[5]}장                              │
├─────────────────────────────────────────────────────────────────────┤
│ 🔥 최고 추천 TOP 5                                                   │
├─────────────────────────────────────────────────────────────────────┤`);

final500.slice(0, 5).forEach((c, i) => {
  const numsStr = c.nums.map(n => n.toString().padStart(2)).join(', ');
  console.log(`│ ${i+1}위: ${numsStr}   (점수: ${c.score})                     │`);
});

console.log(`└─────────────────────────────────────────────────────────────────────┘`);
