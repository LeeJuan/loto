const fs = require('fs');

console.log('🎯 로또6 최종 개선 500장 전략');
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

// 분석 결과 기반 번호 그룹 (검증 분석에서 도출)
const tier1 = [11, 43, 20, 22, 19, 5, 26, 1];   // 필수 포함 (미출현+주기 분석)
const tier2 = [16, 7, 21, 37, 9, 28, 41, 31];   // 권장
const tier3 = [38, 39, 42, 33, 4, 6, 30, 24, 3]; // 보조

// 마지막 회차 (피해야 할 번호 - 연속 출현 확률 낮음)
const lastDrawNumbers = [8, 18, 24, 36, 40, 42];

console.log(`\nTier1 (필수): ${tier1.join(', ')}`);
console.log(`Tier2 (권장): ${tier2.join(', ')}`);
console.log(`Tier3 (보조): ${tier3.join(', ')}`);
console.log(`피할 번호: ${lastDrawNumbers.join(', ')}`);

// 쌍 빈도
const pairs = {};
draws.forEach(d => {
  for (let i = 0; i < d.numbers.length; i++) {
    for (let j = i + 1; j < d.numbers.length; j++) {
      const key = [d.numbers[i], d.numbers[j]].sort((a, b) => a - b).join('-');
      pairs[key] = (pairs[key] || 0) + 1;
    }
  }
});

// 점수 계산
const scores = {};
for (let i = 1; i <= 43; i++) {
  let score = 0;
  if (tier1.includes(i)) score = 30;
  else if (tier2.includes(i)) score = 20;
  else if (tier3.includes(i)) score = 10;
  else score = 5;

  // 마지막 회차 번호 감점
  if (lastDrawNumbers.includes(i)) score -= 10;

  scores[i] = score;
}

function isValid(nums) {
  const sorted = [...nums].sort((a, b) => a - b);

  // 합계 100-170
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum < 100 || sum > 170) return false;

  // 홀짝 2:4 ~ 4:2
  const odd = sorted.filter(n => n % 2 === 1).length;
  if (odd < 2 || odd > 4) return false;

  // 고저 2:4 ~ 4:2
  const low = sorted.filter(n => n <= 21).length;
  if (low < 2 || low > 4) return false;

  // 연속 2쌍 이하
  let consec = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i+1] - sorted[i] === 1) consec++;
  }
  if (consec >= 3) return false;

  // AC값 6 이상
  const diffs = new Set();
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      diffs.add(sorted[j] - sorted[i]);
    }
  }
  if (diffs.size - 5 < 6) return false;

  // 마지막 회차 번호 3개 이상 포함 금지
  const lastCount = sorted.filter(n => lastDrawNumbers.includes(n)).length;
  if (lastCount >= 3) return false;

  return true;
}

function scoreCombo(nums) {
  let total = 0;
  nums.forEach(n => total += scores[n]);

  // 쌍 보너스
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      const key = [nums[i], nums[j]].sort((a, b) => a - b).join('-');
      if (pairs[key] >= 5) total += pairs[key];
    }
  }

  // Tier1 3개 이상 보너스
  const t1Count = nums.filter(n => tier1.includes(n)).length;
  if (t1Count >= 3) total += 20;
  if (t1Count >= 4) total += 20;

  return total;
}

console.log('\n조합 생성 중...');

const allCombos = [];

// 전략 1: Tier1 4개 + Tier2 2개 (핵심)
for (let a = 0; a < tier1.length; a++) {
  for (let b = a+1; b < tier1.length; b++) {
    for (let c = b+1; c < tier1.length; c++) {
      for (let d = c+1; d < tier1.length; d++) {
        for (let e = 0; e < tier2.length; e++) {
          for (let f = e+1; f < tier2.length; f++) {
            const combo = [tier1[a], tier1[b], tier1[c], tier1[d], tier2[e], tier2[f]];
            if (isValid(combo)) {
              allCombos.push({ nums: combo.sort((a,b)=>a-b), score: scoreCombo(combo), type: 1 });
            }
          }
        }
      }
    }
  }
}
console.log(`전략1: ${allCombos.length}개`);

// 전략 2: Tier1 3개 + Tier2 2개 + Tier3 1개
const s2Start = allCombos.length;
for (let a = 0; a < tier1.length; a++) {
  for (let b = a+1; b < tier1.length; b++) {
    for (let c = b+1; c < tier1.length; c++) {
      for (let d = 0; d < tier2.length; d++) {
        for (let e = d+1; e < tier2.length; e++) {
          for (let f = 0; f < tier3.length; f++) {
            const combo = [tier1[a], tier1[b], tier1[c], tier2[d], tier2[e], tier3[f]];
            if (isValid(combo)) {
              allCombos.push({ nums: combo.sort((a,b)=>a-b), score: scoreCombo(combo), type: 2 });
            }
          }
        }
      }
    }
  }
}
console.log(`전략2: ${allCombos.length - s2Start}개`);

// 전략 3: Tier1 3개 + Tier2 3개
const s3Start = allCombos.length;
for (let a = 0; a < tier1.length; a++) {
  for (let b = a+1; b < tier1.length; b++) {
    for (let c = b+1; c < tier1.length; c++) {
      for (let d = 0; d < tier2.length; d++) {
        for (let e = d+1; e < tier2.length; e++) {
          for (let f = e+1; f < tier2.length; f++) {
            const combo = [tier1[a], tier1[b], tier1[c], tier2[d], tier2[e], tier2[f]];
            if (isValid(combo)) {
              allCombos.push({ nums: combo.sort((a,b)=>a-b), score: scoreCombo(combo), type: 3 });
            }
          }
        }
      }
    }
  }
}
console.log(`전략3: ${allCombos.length - s3Start}개`);

// 전략 4: Tier1 2개 + Tier2 2개 + Tier3 2개 (균형)
const s4Start = allCombos.length;
for (let a = 0; a < tier1.length; a++) {
  for (let b = a+1; b < tier1.length; b++) {
    for (let c = 0; c < tier2.length; c++) {
      for (let d = c+1; d < tier2.length; d++) {
        for (let e = 0; e < tier3.length; e++) {
          for (let f = e+1; f < tier3.length; f++) {
            const combo = [tier1[a], tier1[b], tier2[c], tier2[d], tier3[e], tier3[f]];
            if (isValid(combo)) {
              allCombos.push({ nums: combo.sort((a,b)=>a-b), score: scoreCombo(combo), type: 4 });
            }
          }
        }
      }
    }
  }
}
console.log(`전략4: ${allCombos.length - s4Start}개`);

// 중복 제거 및 정렬
const unique = new Map();
allCombos.forEach(c => {
  const key = c.nums.join('-');
  if (!unique.has(key) || unique.get(key).score < c.score) {
    unique.set(key, c);
  }
});

const sorted = Array.from(unique.values()).sort((a, b) => b.score - a.score);
console.log(`\n총 ${sorted.length}개 고유 조합`);

// 500개 선택 (다양성 확보)
const final500 = [];
for (const combo of sorted) {
  if (final500.length >= 500) break;

  // 5개 이상 겹치면 제외
  let tooSimilar = false;
  for (const sel of final500.slice(-50)) {
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
while (final500.length < 500) {
  for (const combo of sorted) {
    if (!final500.find(c => c.nums.join('-') === combo.nums.join('-'))) {
      final500.push(combo);
      if (final500.length >= 500) break;
    }
  }
}

console.log(`최종 ${final500.length}개 선정\n`);

// 분석
console.log('=' .repeat(70));
console.log('📊 최종 500장 분석');
console.log('=' .repeat(70));

// 번호 커버리지
const coverage = {};
for (let i = 1; i <= 43; i++) coverage[i] = 0;
final500.forEach(c => c.nums.forEach(n => coverage[n]++));

const coverSorted = Object.entries(coverage)
  .map(([num, count]) => ({ num: parseInt(num), count }))
  .sort((a, b) => b.count - a.count);

console.log('\n[번호별 포함 횟수]');
coverSorted.forEach(item => {
  const bar = '█'.repeat(Math.round(item.count / 10));
  const tier = tier1.includes(item.num) ? '★' : tier2.includes(item.num) ? '◆' : tier3.includes(item.num) ? '○' : ' ';
  console.log(`  ${tier} ${item.num.toString().padStart(2)}: ${item.count.toString().padStart(3)}회 ${bar}`);
});

// 전략 분포
const typeCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
final500.forEach(c => typeCounts[c.type]++);
console.log('\n[전략 분포]');
console.log(`  전략1 (T1×4 + T2×2): ${typeCounts[1]}장`);
console.log(`  전략2 (T1×3 + T2×2 + T3×1): ${typeCounts[2]}장`);
console.log(`  전략3 (T1×3 + T2×3): ${typeCounts[3]}장`);
console.log(`  전략4 (T1×2 + T2×2 + T3×2): ${typeCounts[4]}장`);

// Tier1 포함 통계
let t1_3plus = 0, t1_4plus = 0;
final500.forEach(c => {
  const t1Count = c.nums.filter(n => tier1.includes(n)).length;
  if (t1Count >= 3) t1_3plus++;
  if (t1Count >= 4) t1_4plus++;
});
console.log(`\n[Tier1 포함율]`);
console.log(`  3개 이상: ${t1_3plus}장 (${(t1_3plus/5).toFixed(1)}%)`);
console.log(`  4개 이상: ${t1_4plus}장 (${(t1_4plus/5).toFixed(1)}%)`);

// TOP 50 출력
console.log('\n' + '=' .repeat(70));
console.log('⭐ TOP 50 추천 조합');
console.log('=' .repeat(70));
console.log('\n순위 | 번호                   | 점수 | 합계 | Tier1개수');
console.log('-'.repeat(60));
final500.slice(0, 50).forEach((c, i) => {
  const numsStr = c.nums.map(n => n.toString().padStart(2)).join(' ');
  const sum = c.nums.reduce((a, b) => a + b, 0);
  const t1 = c.nums.filter(n => tier1.includes(n)).length;
  console.log(`${(i+1).toString().padStart(3)}  | ${numsStr} | ${c.score.toString().padStart(4)} | ${sum.toString().padStart(3)} |    ${t1}`);
});

// 파일 저장
fs.writeFileSync(
  'C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_best_500.csv',
  '순번,번호1,번호2,번호3,번호4,번호5,번호6,점수,합계,전략\n' +
  final500.map((c, i) => `${i+1},${c.nums.join(',')},${c.score},${c.nums.reduce((a,b)=>a+b,0)},전략${c.type}`).join('\n'),
  'utf8'
);

fs.writeFileSync(
  'C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_best_numbers.txt',
  final500.map(c => c.nums.join(',')).join('\n'),
  'utf8'
);

// 최종 요약
console.log('\n' + '=' .repeat(70));
console.log('📋 최종 구매 가이드');
console.log('=' .repeat(70));

console.log(`
┌─────────────────────────────────────────────────────────────────────┐
│ 🎯 핵심 번호 (미출현 주기 분석 기반)                                  │
├─────────────────────────────────────────────────────────────────────┤
│ 11(17회), 43(13회), 20(19회), 22(12회), 19(14회), 5(11회)          │
│ 26(13회), 1(10회)                                                   │
├─────────────────────────────────────────────────────────────────────┤
│ 📊 적용 룰                                                           │
├─────────────────────────────────────────────────────────────────────┤
│ ✓ 합계: 100~170 (평균 140)                                          │
│ ✓ 홀짝: 2:4 ~ 4:2                                                   │
│ ✓ 고저: 2:4 ~ 4:2                                                   │
│ ✓ 연속번호: 최대 2쌍                                                │
│ ✓ AC값: 6 이상                                                      │
│ ✓ 마지막회차(8,18,24,36,40,42) 3개 이상 포함 금지                   │
├─────────────────────────────────────────────────────────────────────┤
│ 🔥 최고 추천 TOP 5                                                   │
├─────────────────────────────────────────────────────────────────────┤`);

final500.slice(0, 5).forEach((c, i) => {
  const sum = c.nums.reduce((a, b) => a + b, 0);
  console.log(`│ ${i+1}위: ${c.nums.map(n=>n.toString().padStart(2)).join(', ')}  (점수: ${c.score}, 합계: ${sum})           │`);
});

console.log(`├─────────────────────────────────────────────────────────────────────┤
│ 💾 저장 파일                                                         │
├─────────────────────────────────────────────────────────────────────┤
│ • loto6_best_500.csv (상세)                                         │
│ • loto6_best_numbers.txt (번호만)                                   │
└─────────────────────────────────────────────────────────────────────┘`);
