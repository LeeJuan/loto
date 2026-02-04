const fs = require('fs');

// CSV 읽기
const csv = fs.readFileSync('C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_numbers_only.csv', 'utf8');
const draws = csv.trim().split('\n').map(line => line.split(',').map(Number));

console.log('🎯 로또6 500장 최적 전략 수립\n');
console.log('=' .repeat(70));

// ==================== 핵심 분석 데이터 ====================

// 1. 전체 빈도
const frequency = {};
for (let i = 1; i <= 43; i++) frequency[i] = 0;
draws.forEach(draw => draw.forEach(num => frequency[num]++));

// 2. 최근 트렌드 (최근 30회)
const recent30 = draws.slice(-30);
const recentFreq = {};
for (let i = 1; i <= 43; i++) recentFreq[i] = 0;
recent30.forEach(draw => draw.forEach(num => recentFreq[num]++));

// 3. 미출현 기간
const lastAppearance = {};
for (let i = 1; i <= 43; i++) lastAppearance[i] = -1;
draws.forEach((draw, idx) => draw.forEach(num => lastAppearance[num] = idx));
const gapFromLast = {};
for (let i = 1; i <= 43; i++) {
  gapFromLast[i] = draws.length - 1 - lastAppearance[i];
}

// 4. 번호 쌍 빈도
const pairs = {};
draws.forEach(draw => {
  for (let i = 0; i < draw.length; i++) {
    for (let j = i + 1; j < draw.length; j++) {
      const key = [draw[i], draw[j]].sort((a, b) => a - b).join('-');
      pairs[key] = (pairs[key] || 0) + 1;
    }
  }
});

// ==================== 번호 점수 계산 ====================
console.log('\n📊 번호별 종합 점수 산출');
console.log('-'.repeat(70));

const numberScores = {};

for (let num = 1; num <= 43; num++) {
  // 전체 빈도 점수 (0-25점)
  const freqScore = (frequency[num] / draws.length) * 100;

  // 최근 트렌드 점수 (0-30점) - 가중치 높임
  const recentScore = (recentFreq[num] / 30) * 150;

  // 미출현 기간 점수 (너무 오래되면 출현 가능성 높음)
  // 적정 미출현 기간(5-15회)에 보너스
  let gapScore = 0;
  const gap = gapFromLast[num];
  if (gap >= 10 && gap <= 20) gapScore = 20; // 곧 나올 가능성
  else if (gap >= 5 && gap < 10) gapScore = 15;
  else if (gap > 20) gapScore = 25; // 오래 미출현 = 출현 기대
  else if (gap < 3) gapScore = 5; // 최근 출현 = 연속 출현 가능성 낮음
  else gapScore = 10;

  numberScores[num] = {
    num,
    freqScore: freqScore.toFixed(1),
    recentScore: recentScore.toFixed(1),
    gapScore,
    gap,
    totalScore: (freqScore + recentScore + gapScore).toFixed(1)
  };
}

const rankedNumbers = Object.values(numberScores).sort((a, b) => parseFloat(b.totalScore) - parseFloat(a.totalScore));

console.log('\n[번호별 종합 순위 TOP 20]');
console.log('순위 | 번호 | 전체빈도 | 최근빈도 | 미출현갭 | 총점');
console.log('-'.repeat(55));
rankedNumbers.slice(0, 20).forEach((item, i) => {
  console.log(`${(i+1).toString().padStart(3)}위 | ${item.num.toString().padStart(4)} | ${item.freqScore.padStart(8)} | ${item.recentScore.padStart(8)} | ${item.gap.toString().padStart(8)} | ${item.totalScore.padStart(6)}`);
});

// ==================== 그룹 분류 ====================
console.log('\n' + '=' .repeat(70));
console.log('📌 전략적 번호 그룹 분류');
console.log('=' .repeat(70));

// A그룹: 핵심 번호 (TOP 15 - 반드시 포함)
const groupA = rankedNumbers.slice(0, 15).map(n => n.num);
console.log(`\n[A그룹 - 핵심번호 15개] (모든 조합에 최소 2개 포함)`);
console.log(`  ${groupA.join(', ')}`);

// B그룹: 준핵심 번호 (16-25위)
const groupB = rankedNumbers.slice(15, 25).map(n => n.num);
console.log(`\n[B그룹 - 준핵심번호 10개] (조합당 1-2개 포함)`);
console.log(`  ${groupB.join(', ')}`);

// C그룹: 보조 번호 (26-35위)
const groupC = rankedNumbers.slice(25, 35).map(n => n.num);
console.log(`\n[C그룹 - 보조번호 10개] (조합당 0-2개 포함)`);
console.log(`  ${groupC.join(', ')}`);

// 특별 그룹: 오래 미출현 번호 (출현 기대)
const overdueNumbers = Object.entries(gapFromLast)
  .filter(([_, gap]) => gap >= 12)
  .sort((a, b) => b[1] - a[1])
  .map(([num, _]) => parseInt(num));
console.log(`\n[특별그룹 - 미출현 12회 이상] (반전 기대)`);
console.log(`  ${overdueNumbers.join(', ')}`);

// ==================== 조합 생성 전략 ====================
console.log('\n' + '=' .repeat(70));
console.log('🎰 500장 구매 전략 (5만엔)');
console.log('=' .repeat(70));

// 조합 검증 함수
function isValidCombination(nums) {
  const sorted = [...nums].sort((a, b) => a - b);

  // 1. 합계 검사 (100-170)
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum < 100 || sum > 170) return false;

  // 2. 홀짝 비율 (2:4 ~ 4:2)
  const oddCount = sorted.filter(n => n % 2 === 1).length;
  if (oddCount < 2 || oddCount > 4) return false;

  // 3. 고저 비율 (2:4 ~ 4:2)
  const lowCount = sorted.filter(n => n <= 21).length;
  if (lowCount < 2 || lowCount > 4) return false;

  // 4. 연속번호 3쌍 이상 제외
  let consecutive = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] - sorted[i] === 1) consecutive++;
  }
  if (consecutive >= 3) return false;

  // 5. AC값 검사 (6 이상)
  const differences = new Set();
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      differences.add(sorted[j] - sorted[i]);
    }
  }
  const ac = differences.size - (sorted.length - 1);
  if (ac < 6) return false;

  // 6. 각 구간에서 최소 1개
  const ranges = [
    sorted.filter(n => n <= 10).length,
    sorted.filter(n => n >= 11 && n <= 20).length,
    sorted.filter(n => n >= 21 && n <= 30).length,
    sorted.filter(n => n >= 31 && n <= 43).length
  ];
  if (ranges.filter(r => r === 0).length > 1) return false;

  return true;
}

// 조합 점수 계산
function scoreCombination(nums) {
  let score = 0;

  // A그룹 번호 포함 점수
  const aCount = nums.filter(n => groupA.includes(n)).length;
  score += aCount * 15;

  // B그룹 번호 포함 점수
  const bCount = nums.filter(n => groupB.includes(n)).length;
  score += bCount * 10;

  // 미출현 번호 포함 보너스
  const overdueCount = nums.filter(n => overdueNumbers.includes(n)).length;
  score += overdueCount * 8;

  // 인기 쌍 포함 보너스
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      const key = [nums[i], nums[j]].sort((a, b) => a - b).join('-');
      if (pairs[key] >= 7) score += 3;
    }
  }

  return score;
}

// 조합 생성
console.log('\n조합 생성 중...');

const allCombinations = [];

// 전략 1: A그룹 중심 조합 (200장)
// A그룹에서 3-4개 + B그룹에서 1-2개 + C그룹/기타에서 1개
function generateType1() {
  const combos = [];
  for (let a1 = 0; a1 < groupA.length; a1++) {
    for (let a2 = a1 + 1; a2 < groupA.length; a2++) {
      for (let a3 = a2 + 1; a3 < groupA.length; a3++) {
        for (let b1 = 0; b1 < groupB.length; b1++) {
          for (let b2 = b1 + 1; b2 < groupB.length; b2++) {
            for (let c1 = 0; c1 < groupC.length; c1++) {
              const combo = [groupA[a1], groupA[a2], groupA[a3], groupB[b1], groupB[b2], groupC[c1]];
              if (isValidCombination(combo)) {
                combos.push({ nums: combo.sort((a,b)=>a-b), score: scoreCombination(combo), type: 1 });
              }
              if (combos.length > 50000) return combos;
            }
          }
        }
      }
    }
  }
  return combos;
}

// 전략 2: 미출현 번호 중심 조합 (100장)
function generateType2() {
  const combos = [];
  const pool = [...groupA, ...groupB, ...overdueNumbers].filter((v, i, a) => a.indexOf(v) === i);

  for (let i = 0; i < overdueNumbers.length; i++) {
    for (let a1 = 0; a1 < groupA.length; a1++) {
      for (let a2 = a1 + 1; a2 < groupA.length; a2++) {
        for (let a3 = a2 + 1; a3 < groupA.length; a3++) {
          for (let b1 = 0; b1 < groupB.length; b1++) {
            const combo = [overdueNumbers[i], groupA[a1], groupA[a2], groupA[a3], groupB[b1]];
            // 6번째 번호 추가
            for (let x = 1; x <= 43; x++) {
              if (!combo.includes(x)) {
                const full = [...combo, x];
                if (isValidCombination(full)) {
                  combos.push({ nums: full.sort((a,b)=>a-b), score: scoreCombination(full) + 10, type: 2 });
                }
                if (combos.length > 30000) return combos;
              }
            }
          }
        }
      }
    }
  }
  return combos;
}

// 전략 3: 균형 조합 (150장)
function generateType3() {
  const combos = [];
  // 각 구간에서 균등하게 선택
  const range1 = [1,2,3,4,5,6,7,8,9,10].filter(n => groupA.includes(n) || groupB.includes(n));
  const range2 = [11,12,13,14,15,16,17,18,19,20].filter(n => groupA.includes(n) || groupB.includes(n));
  const range3 = [21,22,23,24,25,26,27,28,29,30].filter(n => groupA.includes(n) || groupB.includes(n));
  const range4 = [31,32,33,34,35,36,37,38,39,40,41,42,43].filter(n => groupA.includes(n) || groupB.includes(n));

  for (let r1 of range1) {
    for (let r2 of range2) {
      for (let r31 = 0; r31 < range3.length; r31++) {
        for (let r32 = r31 + 1; r32 < range3.length; r32++) {
          for (let r41 = 0; r41 < range4.length; r41++) {
            for (let r42 = r41 + 1; r42 < range4.length; r42++) {
              const combo = [r1, r2, range3[r31], range3[r32], range4[r41], range4[r42]];
              if (isValidCombination(combo)) {
                combos.push({ nums: combo.sort((a,b)=>a-b), score: scoreCombination(combo), type: 3 });
              }
              if (combos.length > 30000) return combos;
            }
          }
        }
      }
    }
  }
  return combos;
}

// 전략 4: 핫 페어 중심 (50장)
function generateType4() {
  const combos = [];
  const topPairs = Object.entries(pairs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([pair]) => pair.split('-').map(Number));

  for (const [p1, p2] of topPairs) {
    for (let a1 = 0; a1 < groupA.length; a1++) {
      if (groupA[a1] === p1 || groupA[a1] === p2) continue;
      for (let a2 = a1 + 1; a2 < groupA.length; a2++) {
        if (groupA[a2] === p1 || groupA[a2] === p2) continue;
        for (let x = 1; x <= 43; x++) {
          if ([p1, p2, groupA[a1], groupA[a2]].includes(x)) continue;
          for (let y = x + 1; y <= 43; y++) {
            if ([p1, p2, groupA[a1], groupA[a2]].includes(y)) continue;
            const combo = [p1, p2, groupA[a1], groupA[a2], x, y];
            if (isValidCombination(combo)) {
              combos.push({ nums: combo.sort((a,b)=>a-b), score: scoreCombination(combo) + 15, type: 4 });
            }
            if (combos.length > 20000) return combos;
          }
        }
      }
    }
  }
  return combos;
}

console.log('  전략1 생성 중...');
const type1 = generateType1();
console.log(`    → ${type1.length}개 후보`);

console.log('  전략2 생성 중...');
const type2 = generateType2();
console.log(`    → ${type2.length}개 후보`);

console.log('  전략3 생성 중...');
const type3 = generateType3();
console.log(`    → ${type3.length}개 후보`);

console.log('  전략4 생성 중...');
const type4 = generateType4();
console.log(`    → ${type4.length}개 후보`);

// 중복 제거 및 점수순 정렬
const allUnique = new Map();
[...type1, ...type2, ...type3, ...type4].forEach(c => {
  const key = c.nums.join('-');
  if (!allUnique.has(key) || allUnique.get(key).score < c.score) {
    allUnique.set(key, c);
  }
});

const sortedCombos = Array.from(allUnique.values()).sort((a, b) => b.score - a.score);
console.log(`\n총 ${sortedCombos.length}개 유효 조합 생성`);

// 최종 500개 선택 (다양성 확보)
const final500 = [];
const usedKeys = new Set();

// 상위 점수에서 우선 선택하되, 너무 비슷한 조합 제외
for (const combo of sortedCombos) {
  if (final500.length >= 500) break;

  const key = combo.nums.join('-');

  // 4개 이상 겹치는 조합 제한
  let tooSimilar = false;
  for (const selected of final500) {
    const overlap = combo.nums.filter(n => selected.nums.includes(n)).length;
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
if (final500.length < 500) {
  for (const combo of sortedCombos) {
    if (final500.length >= 500) break;
    const key = combo.nums.join('-');
    if (!final500.find(c => c.nums.join('-') === key)) {
      final500.push(combo);
    }
  }
}

console.log(`\n최종 ${final500.length}개 조합 선정 완료`);

// ==================== 결과 출력 ====================
console.log('\n' + '=' .repeat(70));
console.log('🏆 최종 500장 구매 목록');
console.log('=' .repeat(70));

console.log('\n[상위 50개 조합 미리보기]');
console.log('순위 | 번호조합              | 점수 | 타입');
console.log('-'.repeat(55));
final500.slice(0, 50).forEach((combo, i) => {
  const numsStr = combo.nums.map(n => n.toString().padStart(2)).join(' ');
  console.log(`${(i+1).toString().padStart(3)}  | ${numsStr} | ${combo.score.toString().padStart(4)} | 전략${combo.type}`);
});

// 통계 분석
console.log('\n' + '=' .repeat(70));
console.log('📈 500장 통계 분석');
console.log('=' .repeat(70));

const numberCoverage = {};
for (let i = 1; i <= 43; i++) numberCoverage[i] = 0;
final500.forEach(c => c.nums.forEach(n => numberCoverage[n]++));

const coverageSorted = Object.entries(numberCoverage)
  .map(([num, count]) => ({ num: parseInt(num), count }))
  .sort((a, b) => b.count - a.count);

console.log('\n[500장에서 각 번호 출현 횟수]');
console.log('가장 많이 포함된 번호 TOP 15:');
coverageSorted.slice(0, 15).forEach((item, i) => {
  const bar = '█'.repeat(Math.round(item.count / 10));
  console.log(`  ${item.num.toString().padStart(2)}: ${item.count.toString().padStart(3)}회 ${bar}`);
});

console.log('\n가장 적게 포함된 번호 (참고):');
coverageSorted.slice(-10).forEach(item => {
  console.log(`  ${item.num.toString().padStart(2)}: ${item.count}회`);
});

// 타입별 분포
const typeCount = { 1: 0, 2: 0, 3: 0, 4: 0 };
final500.forEach(c => typeCount[c.type]++);
console.log('\n[전략 타입별 분포]');
console.log(`  전략1 (A그룹 중심): ${typeCount[1]}장`);
console.log(`  전략2 (미출현 중심): ${typeCount[2]}장`);
console.log(`  전략3 (균형 분배): ${typeCount[3]}장`);
console.log(`  전략4 (핫페어 중심): ${typeCount[4]}장`);

// 파일 저장
const outputLines = final500.map((c, i) => `${i+1},${c.nums.join(',')},${c.score},전략${c.type}`);
fs.writeFileSync(
  'C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_500_tickets.csv',
  '순번,번호1,번호2,번호3,번호4,번호5,번호6,점수,전략\n' + outputLines.join('\n'),
  'utf8'
);

// 번호만 있는 간단한 버전
const simpleOutput = final500.map(c => c.nums.join(','));
fs.writeFileSync(
  'C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_500_simple.csv',
  simpleOutput.join('\n'),
  'utf8'
);

console.log('\n' + '=' .repeat(70));
console.log('💾 파일 저장 완료');
console.log('=' .repeat(70));
console.log('  - loto6_500_tickets.csv (상세 정보 포함)');
console.log('  - loto6_500_simple.csv (번호만)');

// ==================== 핵심 추천 ====================
console.log('\n' + '=' .repeat(70));
console.log('⭐ 핵심 추천 조합 TOP 10 (가장 높은 점수)');
console.log('=' .repeat(70));
final500.slice(0, 10).forEach((combo, i) => {
  console.log(`\n${i+1}위: ${combo.nums.join(', ')}`);
  console.log(`    점수: ${combo.score}, 전략: ${combo.type}`);
});
