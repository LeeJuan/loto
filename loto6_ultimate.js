const fs = require('fs');

console.log('🏆 로또6 최종 완벽 전략 생성');
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

// 최종 분석 결과 반영한 번호 그룹 (종합 점수 기반)
// Z점수 + 트렌드 + 빈도 + 쌍빈도 종합
const tier1 = [33, 20, 29, 36, 35, 24, 6, 10]; // 필수 (종합 점수 TOP 8)
const tier2 = [11, 19, 5, 23, 26, 43, 22, 1];  // 권장 (Z점수 높음)
const tier3 = [2, 27, 16, 17, 8, 32, 18, 13, 7, 37, 28, 42]; // 보조 + 기존 핫번호

// 마지막 회차 (피할 번호)
const lastDraw = [8, 18, 24, 36, 40, 42];

console.log(`\nTier1 (필수): ${tier1.join(', ')}`);
console.log(`Tier2 (권장): ${tier2.join(', ')}`);
console.log(`Tier3 (보조): ${tier3.join(', ')}`);

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

// 실제 당첨 합계 분포
const realSumDist = { '80-99': 10.2, '100-119': 21.4, '120-139': 25.6, '140-159': 25.1, '160-179': 10.2, '180+': 7.4 };

function getSumRange(sum) {
  if (sum < 100) return '80-99';
  if (sum < 120) return '100-119';
  if (sum < 140) return '120-139';
  if (sum < 160) return '140-159';
  if (sum < 180) return '160-179';
  return '180+';
}

function isValid(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);

  // 합계 범위 확장 (실제 분포 반영)
  if (sum < 80 || sum > 200) return false;

  // 홀짝 1:5 ~ 5:1 허용 (최근 트렌드 반영)
  const odd = sorted.filter(n => n % 2 === 1).length;
  if (odd < 1 || odd > 5) return false;

  // 고저 1:5 ~ 5:1 허용
  const low = sorted.filter(n => n <= 21).length;
  if (low < 1 || low > 5) return false;

  // 연속 2쌍 이하
  let consec = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i+1] - sorted[i] === 1) consec++;
  }
  if (consec >= 3) return false;

  // AC값 5 이상
  const diffs = new Set();
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      diffs.add(sorted[j] - sorted[i]);
    }
  }
  if (diffs.size - 5 < 5) return false;

  // 마지막 회차 번호 3개 이상 금지
  const lastCount = sorted.filter(n => lastDraw.includes(n)).length;
  if (lastCount >= 3) return false;

  return true;
}

function scoreCombo(nums) {
  let score = 0;

  // Tier 점수
  nums.forEach(n => {
    if (tier1.includes(n)) score += 30;
    else if (tier2.includes(n)) score += 20;
    else if (tier3.includes(n)) score += 10;
  });

  // 쌍 보너스
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      const key = [nums[i], nums[j]].sort((a, b) => a - b).join('-');
      if (pairs[key] >= 5) score += pairs[key];
    }
  }

  // 상승 트렌드 번호 보너스
  const risingNums = [33, 36, 29, 35, 24, 10, 6, 23, 32, 2];
  const risingCount = nums.filter(n => risingNums.includes(n)).length;
  score += risingCount * 10;

  // Z점수 1.5+ 번호(20) 포함 보너스
  if (nums.includes(20)) score += 15;

  return score;
}

console.log('\n조합 생성 중...');
const allCombos = [];

// 전략 1: Tier1 중심 (T1×3 + T2×2 + T3×1)
for (let a = 0; a < tier1.length; a++) {
  for (let b = a+1; b < tier1.length; b++) {
    for (let c = b+1; c < tier1.length; c++) {
      for (let d = 0; d < tier2.length; d++) {
        for (let e = d+1; e < tier2.length; e++) {
          for (let f = 0; f < tier3.length; f++) {
            const combo = [tier1[a], tier1[b], tier1[c], tier2[d], tier2[e], tier3[f]];
            if (new Set(combo).size === 6 && isValid(combo)) {
              allCombos.push({ nums: combo.sort((a,b)=>a-b), score: scoreCombo(combo), type: 1 });
            }
          }
        }
      }
    }
  }
}
console.log(`전략1: ${allCombos.length}개`);

// 전략 2: Tier1 × 4 + Tier2 × 2
const s2Start = allCombos.length;
for (let a = 0; a < tier1.length; a++) {
  for (let b = a+1; b < tier1.length; b++) {
    for (let c = b+1; c < tier1.length; c++) {
      for (let d = c+1; d < tier1.length; d++) {
        for (let e = 0; e < tier2.length; e++) {
          for (let f = e+1; f < tier2.length; f++) {
            const combo = [tier1[a], tier1[b], tier1[c], tier1[d], tier2[e], tier2[f]];
            if (new Set(combo).size === 6 && isValid(combo)) {
              allCombos.push({ nums: combo.sort((a,b)=>a-b), score: scoreCombo(combo), type: 2 });
            }
          }
        }
      }
    }
  }
}
console.log(`전략2: ${allCombos.length - s2Start}개`);

// 전략 3: Tier1 × 3 + Tier2 × 3
const s3Start = allCombos.length;
for (let a = 0; a < tier1.length; a++) {
  for (let b = a+1; b < tier1.length; b++) {
    for (let c = b+1; c < tier1.length; c++) {
      for (let d = 0; d < tier2.length; d++) {
        for (let e = d+1; e < tier2.length; e++) {
          for (let f = e+1; f < tier2.length; f++) {
            const combo = [tier1[a], tier1[b], tier1[c], tier2[d], tier2[e], tier2[f]];
            if (new Set(combo).size === 6 && isValid(combo)) {
              allCombos.push({ nums: combo.sort((a,b)=>a-b), score: scoreCombo(combo), type: 3 });
            }
          }
        }
      }
    }
  }
}
console.log(`전략3: ${allCombos.length - s3Start}개`);

// 전략 4: Tier2 중심 + Tier3 (균형)
const s4Start = allCombos.length;
for (let a = 0; a < tier1.length; a++) {
  for (let b = a+1; b < tier1.length; b++) {
    for (let c = 0; c < tier2.length; c++) {
      for (let d = c+1; d < tier2.length; d++) {
        for (let e = 0; e < tier3.length; e++) {
          for (let f = e+1; f < tier3.length; f++) {
            const combo = [tier1[a], tier1[b], tier2[c], tier2[d], tier3[e], tier3[f]];
            if (new Set(combo).size === 6 && isValid(combo)) {
              allCombos.push({ nums: combo.sort((a,b)=>a-b), score: scoreCombo(combo), type: 4 });
            }
          }
        }
      }
    }
  }
}
console.log(`전략4: ${allCombos.length - s4Start}개`);

// 전략 5: 높은 합계 조합 (160-200)
const s5Start = allCombos.length;
const highPool = [...tier1, ...tier2, ...tier3].filter(n => n >= 25);
for (let a = 0; a < highPool.length; a++) {
  for (let b = a+1; b < highPool.length; b++) {
    for (let c = b+1; c < highPool.length; c++) {
      for (let d = c+1; d < highPool.length; d++) {
        // 낮은 번호 2개 추가
        for (let e = 1; e <= 15; e++) {
          for (let f = e+1; f <= 20; f++) {
            const combo = [highPool[a], highPool[b], highPool[c], highPool[d], e, f];
            if (new Set(combo).size === 6 && isValid(combo)) {
              const sum = combo.reduce((x, y) => x + y, 0);
              if (sum >= 160 && sum <= 200) {
                allCombos.push({ nums: combo.sort((x,y)=>x-y), score: scoreCombo(combo) + 10, type: 5 });
              }
            }
          }
        }
      }
    }
  }
}
console.log(`전략5 (고합계): ${allCombos.length - s5Start}개`);

// 전략 6: 낮은 합계 조합 (80-100)
const s6Start = allCombos.length;
const lowPool = [...tier1, ...tier2, ...tier3].filter(n => n <= 25);
for (let a = 0; a < lowPool.length; a++) {
  for (let b = a+1; b < lowPool.length; b++) {
    for (let c = b+1; c < lowPool.length; c++) {
      for (let d = c+1; d < lowPool.length; d++) {
        for (let e = d+1; e < lowPool.length; e++) {
          for (let f = e+1; f < lowPool.length; f++) {
            const combo = [lowPool[a], lowPool[b], lowPool[c], lowPool[d], lowPool[e], lowPool[f]];
            if (new Set(combo).size === 6 && isValid(combo)) {
              const sum = combo.reduce((x, y) => x + y, 0);
              if (sum >= 80 && sum <= 100) {
                allCombos.push({ nums: combo.sort((x,y)=>x-y), score: scoreCombo(combo) + 10, type: 6 });
              }
            }
          }
        }
      }
    }
  }
}
console.log(`전략6 (저합계): ${allCombos.length - s6Start}개`);

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

// 합계 분포에 맞춰 500개 선택
const final500 = [];
const targetDist = {
  '80-99': Math.round(500 * 0.10),      // 50장
  '100-119': Math.round(500 * 0.21),    // 105장
  '120-139': Math.round(500 * 0.26),    // 130장
  '140-159': Math.round(500 * 0.25),    // 125장
  '160-179': Math.round(500 * 0.10),    // 50장
  '180+': Math.round(500 * 0.08)        // 40장
};
const currentDist = { '80-99': 0, '100-119': 0, '120-139': 0, '140-159': 0, '160-179': 0, '180+': 0 };

// 각 합계 범위별로 선택
for (const combo of sorted) {
  if (final500.length >= 500) break;

  const sum = combo.nums.reduce((a, b) => a + b, 0);
  const range = getSumRange(sum);

  // 해당 범위가 아직 목표에 도달하지 않았으면 선택
  if (currentDist[range] < targetDist[range]) {
    // 유사성 체크
    let tooSimilar = false;
    for (const sel of final500.slice(-30)) {
      const overlap = combo.nums.filter(n => sel.nums.includes(n)).length;
      if (overlap >= 5) {
        tooSimilar = true;
        break;
      }
    }

    if (!tooSimilar) {
      final500.push(combo);
      currentDist[range]++;
    }
  }
}

// 부족한 범위 채우기
for (const combo of sorted) {
  if (final500.length >= 500) break;
  if (!final500.find(c => c.nums.join('-') === combo.nums.join('-'))) {
    final500.push(combo);
  }
}

console.log(`최종 ${final500.length}개 선정\n`);

// ==================== 분석 ====================
console.log('=' .repeat(70));
console.log('📊 최종 500장 분석');
console.log('=' .repeat(70));

// 합계 분포
const finalSumDist = { '80-99': 0, '100-119': 0, '120-139': 0, '140-159': 0, '160-179': 0, '180+': 0 };
final500.forEach(c => {
  const sum = c.nums.reduce((a, b) => a + b, 0);
  finalSumDist[getSumRange(sum)]++;
});

console.log('\n[합계 분포 (실제 vs 500장)]');
console.log('범위     | 실제 | 목표 | 500장 | OK?');
console.log('-'.repeat(45));
Object.keys(realSumDist).forEach(range => {
  const real = realSumDist[range].toFixed(1);
  const target = (targetDist[range] / 500 * 100).toFixed(1);
  const actual = (finalSumDist[range] / 500 * 100).toFixed(1);
  const ok = Math.abs(parseFloat(actual) - parseFloat(real)) <= 5 ? '✓' : '△';
  console.log(`${range.padStart(8)} | ${real.padStart(4)}% | ${target.padStart(4)}% | ${actual.padStart(5)}% | ${ok}`);
});

// 번호 커버리지
const coverage = {};
for (let i = 1; i <= 43; i++) coverage[i] = 0;
final500.forEach(c => c.nums.forEach(n => coverage[n]++));

const coverSorted = Object.entries(coverage)
  .map(([num, count]) => ({ num: parseInt(num), count }))
  .sort((a, b) => b.count - a.count);

console.log('\n[번호별 포함 횟수 TOP 20]');
coverSorted.slice(0, 20).forEach(item => {
  const tier = tier1.includes(item.num) ? '★' : tier2.includes(item.num) ? '◆' : tier3.includes(item.num) ? '○' : ' ';
  const bar = '█'.repeat(Math.round(item.count / 10));
  console.log(`  ${tier} ${item.num.toString().padStart(2)}: ${item.count.toString().padStart(3)}회 ${bar}`);
});

// 상승 트렌드 포함률
const risingNums = [33, 36, 29, 35, 24, 10, 6, 23, 32, 2];
let risingCoverage = 0;
final500.forEach(t => {
  if (t.nums.some(n => risingNums.includes(n))) risingCoverage++;
});
console.log(`\n상승 트렌드 번호 포함: ${risingCoverage}/500장 (${(risingCoverage/5).toFixed(1)}%)`);

// Z점수 1.5+ (20) 포함률
let z15Coverage = 0;
final500.forEach(t => { if (t.nums.includes(20)) z15Coverage++; });
console.log(`Z점수 1.5+ (20) 포함: ${z15Coverage}/500장 (${(z15Coverage/5).toFixed(1)}%)`);

// 전략 분포
const typeCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
final500.forEach(c => typeCounts[c.type]++);
console.log('\n[전략 분포]');
console.log(`  전략1 (T1×3+T2×2+T3×1): ${typeCounts[1]}장`);
console.log(`  전략2 (T1×4+T2×2): ${typeCounts[2]}장`);
console.log(`  전략3 (T1×3+T2×3): ${typeCounts[3]}장`);
console.log(`  전략4 (균형): ${typeCounts[4]}장`);
console.log(`  전략5 (고합계): ${typeCounts[5]}장`);
console.log(`  전략6 (저합계): ${typeCounts[6]}장`);

// 과거 매칭 시뮬레이션
console.log('\n[과거 당첨번호 매칭 시뮬레이션]');
const matchCounts = { 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };
draws.forEach(d => {
  const drawSet = new Set(d.numbers);
  let bestMatch = 0;
  final500.forEach(ticket => {
    const match = ticket.nums.filter(n => drawSet.has(n)).length;
    if (match > bestMatch) bestMatch = match;
  });
  matchCounts[bestMatch]++;
});

Object.entries(matchCounts).sort((a, b) => parseInt(b[0]) - parseInt(a[0])).forEach(([match, count]) => {
  if (count > 0) {
    console.log(`  ${match}개 일치: ${count}회 (${(count/draws.length*100).toFixed(1)}%)`);
  }
});

// TOP 50 출력
console.log('\n' + '=' .repeat(70));
console.log('⭐ TOP 50 추천 조합');
console.log('=' .repeat(70));
console.log('\n순위 | 번호                   | 점수 | 합계 | 전략');
console.log('-'.repeat(55));
final500.slice(0, 50).forEach((c, i) => {
  const numsStr = c.nums.map(n => n.toString().padStart(2)).join(' ');
  const sum = c.nums.reduce((a, b) => a + b, 0);
  console.log(`${(i+1).toString().padStart(3)}  | ${numsStr} | ${c.score.toString().padStart(4)} | ${sum.toString().padStart(3)} | ${c.type}`);
});

// 파일 저장
fs.writeFileSync(
  'C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_ultimate_500.csv',
  '순번,번호1,번호2,번호3,번호4,번호5,번호6,점수,합계,전략\n' +
  final500.map((c, i) => `${i+1},${c.nums.join(',')},${c.score},${c.nums.reduce((a,b)=>a+b,0)},전략${c.type}`).join('\n'),
  'utf8'
);

fs.writeFileSync(
  'C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_ultimate_numbers.txt',
  final500.map(c => c.nums.join(',')).join('\n'),
  'utf8'
);

// 최종 요약
console.log('\n' + '=' .repeat(70));
console.log('📋 최종 구매 가이드');
console.log('=' .repeat(70));

console.log(`
┌─────────────────────────────────────────────────────────────────────┐
│ 🎯 핵심 번호 (종합 분석 TOP 8)                                       │
├─────────────────────────────────────────────────────────────────────┤
│ 33(트렌드↑), 20(Z점수↑), 29(트렌드↑), 36(트렌드↑)                    │
│ 35(트렌드↑), 24(트렌드↑), 6(트렌드↑), 10(트렌드↑)                    │
├─────────────────────────────────────────────────────────────────────┤
│ 📊 적용 룰                                                           │
├─────────────────────────────────────────────────────────────────────┤
│ ✓ 합계: 80~200 (실제 분포 반영)                                     │
│ ✓ 홀짝: 1:5 ~ 5:1 (최근 트렌드 반영)                                │
│ ✓ 고저: 1:5 ~ 5:1                                                   │
│ ✓ 연속번호: 최대 2쌍                                                │
│ ✓ AC값: 5 이상                                                      │
│ ✓ 마지막회차(8,18,24,36,40,42) 3개 이상 금지                        │
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
│ • loto6_ultimate_500.csv (상세)                                     │
│ • loto6_ultimate_numbers.txt (번호만)                               │
└─────────────────────────────────────────────────────────────────────┘`);
