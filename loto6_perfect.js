const fs = require('fs');

console.log('🏆 로또6 완벽 최종 전략 (다양성 강화)');
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

// 번호 그룹
const tier1 = [33, 20, 29, 36, 35, 24, 6, 10];
const tier2 = [11, 19, 5, 23, 26, 43, 22, 1];
const tier3 = [2, 27, 16, 17, 8, 32, 18, 13, 7, 37, 28, 42, 3, 4, 14, 15, 30, 31, 38, 39, 40, 41];

const lastDraw = [8, 18, 24, 36, 40, 42];

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
  if (sum < 80 || sum > 200) return false;

  const odd = sorted.filter(n => n % 2 === 1).length;
  if (odd < 1 || odd > 5) return false;

  const low = sorted.filter(n => n <= 21).length;
  if (low < 1 || low > 5) return false;

  let consec = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i+1] - sorted[i] === 1) consec++;
  }
  if (consec >= 3) return false;

  const diffs = new Set();
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      diffs.add(sorted[j] - sorted[i]);
    }
  }
  if (diffs.size - 5 < 5) return false;

  const lastCount = sorted.filter(n => lastDraw.includes(n)).length;
  if (lastCount >= 3) return false;

  return true;
}

function scoreCombo(nums) {
  let score = 0;
  nums.forEach(n => {
    if (tier1.includes(n)) score += 30;
    else if (tier2.includes(n)) score += 20;
    else if (tier3.includes(n)) score += 10;
  });

  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      const key = [nums[i], nums[j]].sort((a, b) => a - b).join('-');
      if (pairs[key] >= 5) score += pairs[key];
    }
  }

  const rising = [33, 36, 29, 35, 24, 10, 6, 23, 32, 2];
  score += nums.filter(n => rising.includes(n)).length * 10;
  if (nums.includes(20)) score += 15;

  return score;
}

console.log('조합 생성 중...');
const allCombos = [];

// 모든 풀에서 다양하게 생성
const allPool = [...new Set([...tier1, ...tier2, ...tier3])];

// 전략 1-4: 기존과 동일
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

// 전략 4: 균형 (T1×2 + T2×2 + T3×2)
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

// 전략 5: T1×2 + T2×3 + T3×1
for (let a = 0; a < tier1.length; a++) {
  for (let b = a+1; b < tier1.length; b++) {
    for (let c = 0; c < tier2.length; c++) {
      for (let d = c+1; d < tier2.length; d++) {
        for (let e = d+1; e < tier2.length; e++) {
          for (let f = 0; f < tier3.length; f++) {
            const combo = [tier1[a], tier1[b], tier2[c], tier2[d], tier2[e], tier3[f]];
            if (new Set(combo).size === 6 && isValid(combo)) {
              allCombos.push({ nums: combo.sort((a,b)=>a-b), score: scoreCombo(combo), type: 5 });
            }
          }
        }
      }
    }
  }
}

console.log(`총 ${allCombos.length}개 조합 생성`);

// 중복 제거
const unique = new Map();
allCombos.forEach(c => {
  const key = c.nums.join('-');
  if (!unique.has(key) || unique.get(key).score < c.score) {
    unique.set(key, c);
  }
});

const sorted = Array.from(unique.values()).sort((a, b) => b.score - a.score);
console.log(`${sorted.length}개 고유 조합`);

// 500개 선택 - 다양성 강화
const final500 = [];
const targetDist = {
  '80-99': 50, '100-119': 105, '120-139': 130,
  '140-159': 125, '160-179': 50, '180+': 40
};
const currentDist = { '80-99': 0, '100-119': 0, '120-139': 0, '140-159': 0, '160-179': 0, '180+': 0 };

// 더 엄격한 유사성 체크 (4개 이상 겹치면 제외)
for (const combo of sorted) {
  if (final500.length >= 500) break;

  const sum = combo.nums.reduce((a, b) => a + b, 0);
  const range = getSumRange(sum);

  if (currentDist[range] < targetDist[range]) {
    // 모든 기존 조합과 비교 (엄격한 다양성)
    let tooSimilar = false;
    for (const sel of final500) {
      const overlap = combo.nums.filter(n => sel.nums.includes(n)).length;
      if (overlap >= 4) {  // 4개 이상 겹치면 제외 (더 엄격)
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

// 부족하면 완화된 기준으로 추가
if (final500.length < 500) {
  for (const combo of sorted) {
    if (final500.length >= 500) break;

    const key = combo.nums.join('-');
    if (final500.find(c => c.nums.join('-') === key)) continue;

    const sum = combo.nums.reduce((a, b) => a + b, 0);
    const range = getSumRange(sum);

    // 5개 이상 겹치면 제외 (완화)
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
      currentDist[range]++;
    }
  }
}

// 그래도 부족하면 그냥 추가
while (final500.length < 500) {
  for (const combo of sorted) {
    if (final500.length >= 500) break;
    if (!final500.find(c => c.nums.join('-') === combo.nums.join('-'))) {
      final500.push(combo);
    }
  }
}

console.log(`최종 ${final500.length}개 선정\n`);

// 검증
console.log('=' .repeat(70));
console.log('검증');
console.log('=' .repeat(70));

// 합계 분포
console.log('\n[합계 분포]');
const finalSumDist = { '80-99': 0, '100-119': 0, '120-139': 0, '140-159': 0, '160-179': 0, '180+': 0 };
final500.forEach(c => {
  finalSumDist[getSumRange(c.nums.reduce((a, b) => a + b, 0))]++;
});
Object.entries(finalSumDist).forEach(([range, count]) => {
  console.log(`  ${range}: ${count}장 (${(count/5).toFixed(1)}%)`);
});

// 다양성 체크
let similarPairs = 0;
for (let i = 0; i < final500.length; i++) {
  for (let j = i + 1; j < final500.length; j++) {
    const overlap = final500[i].nums.filter(n => final500[j].nums.includes(n)).length;
    if (overlap >= 5) similarPairs++;
  }
}
console.log(`\n[다양성] 5개+ 겹치는 쌍: ${similarPairs}쌍`);

// 핵심 번호 포함
let t1_3 = 0, t1_4 = 0;
final500.forEach(c => {
  const count = c.nums.filter(n => tier1.includes(n)).length;
  if (count >= 3) t1_3++;
  if (count >= 4) t1_4++;
});
console.log(`[핵심번호] 3개+ 포함: ${t1_3}장, 4개+ 포함: ${t1_4}장`);

// 상승 트렌드
const rising = [33, 36, 29, 35, 24, 10, 6, 23];
let risingCount = 0;
final500.forEach(c => {
  if (c.nums.some(n => rising.includes(n))) risingCount++;
});
console.log(`[상승트렌드] 1개+ 포함: ${risingCount}장`);

// 과거 매칭
const matchResults = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };
draws.forEach(d => {
  const drawSet = new Set(d.numbers);
  let best = 0;
  final500.forEach(t => {
    const match = t.nums.filter(n => drawSet.has(n)).length;
    if (match > best) best = match;
  });
  matchResults[best]++;
});
console.log(`\n[백테스트] 5개일치: ${matchResults[5]}회, 4개일치: ${matchResults[4]}회`);

// TOP 30 출력
console.log('\n' + '=' .repeat(70));
console.log('TOP 30 추천');
console.log('=' .repeat(70));
final500.slice(0, 30).forEach((c, i) => {
  const sum = c.nums.reduce((a, b) => a + b, 0);
  console.log(`${(i+1).toString().padStart(2)}위: ${c.nums.map(n=>n.toString().padStart(2)).join(', ')} (점수:${c.score}, 합계:${sum})`);
});

// 저장
fs.writeFileSync(
  'C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_perfect_500.csv',
  '순번,번호1,번호2,번호3,번호4,번호5,번호6,점수,합계,전략\n' +
  final500.map((c, i) => `${i+1},${c.nums.join(',')},${c.score},${c.nums.reduce((a,b)=>a+b,0)},전략${c.type}`).join('\n'),
  'utf8'
);

fs.writeFileSync(
  'C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_perfect_numbers.txt',
  final500.map(c => c.nums.join(',')).join('\n'),
  'utf8'
);

console.log('\n💾 loto6_perfect_500.csv, loto6_perfect_numbers.txt 저장 완료');
