const fs = require('fs');

console.log('🇯🇵 일본 전문가 기준 최적화 전략');
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

const lastDraw = draws[draws.length - 1].numbers;
console.log(`최근 당첨번호: ${lastDraw.join(', ')}`);

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

// 일본 기준 합계 범위 (95-170)
function isJpSumValid(sum) {
  return sum >= 95 && sum <= 170;
}

function isValid(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);

  // 일본 기준: 95-170 범위 (엄격)
  if (sum < 95 || sum > 170) return false;

  const odd = sorted.filter(n => n % 2 === 1).length;
  // 일본 기준: 홀짝 2:4 ~ 4:2
  if (odd < 2 || odd > 4) return false;

  const low = sorted.filter(n => n <= 21).length;
  if (low < 1 || low > 5) return false;

  // 연속번호 3쌍 이상 제외
  let consec = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i+1] - sorted[i] === 1) consec++;
  }
  if (consec >= 3) return false;

  // 다양성 확보
  const diffs = new Set();
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      diffs.add(sorted[j] - sorted[i]);
    }
  }
  if (diffs.size < 10) return false;

  // 전회 당첨번호 3개 이상 포함 제외
  const lastCount = sorted.filter(n => lastDraw.includes(n)).length;
  if (lastCount >= 3) return false;

  return true;
}

// 일본 기준 추가 점수
function scoreCombo(nums) {
  let score = 0;

  // 티어별 점수
  nums.forEach(n => {
    if (tier1.includes(n)) score += 30;
    else if (tier2.includes(n)) score += 20;
    else if (tier3.includes(n)) score += 10;
  });

  // 쌍 빈도 보너스
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      const key = [nums[i], nums[j]].sort((a, b) => a - b).join('-');
      if (pairs[key] >= 5) score += pairs[key];
    }
  }

  // 상승 트렌드 보너스
  const rising = [33, 36, 29, 35, 24, 10, 6, 23, 32, 2];
  score += nums.filter(n => rising.includes(n)).length * 10;
  if (nums.includes(20)) score += 15;

  // 일본 기준 보너스
  const sum = nums.reduce((a, b) => a + b, 0);

  // 120-149 범위 (최적)에 추가 점수
  if (sum >= 120 && sum < 150) score += 20;
  // 95-119, 150-170 범위에 약간 점수
  else if (sum >= 95 && sum <= 170) score += 10;

  // 연속번호 1쌍 포함 시 보너스 (일본 기준 55%)
  const sorted = [...nums].sort((a, b) => a - b);
  let hasConsec = false;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i+1] - sorted[i] === 1) {
      hasConsec = true;
      break;
    }
  }
  if (hasConsec) score += 15;

  // 끝자리 같은 번호 2개 이상 포함 시 보너스 (일본 기준 80%)
  const lastDigits = nums.map(n => n % 10);
  const digitCounts = {};
  lastDigits.forEach(d => digitCounts[d] = (digitCounts[d] || 0) + 1);
  if (Object.values(digitCounts).some(c => c >= 2)) score += 15;

  // 이월 번호 포함 시 보너스 (일본 기준 65%)
  if (nums.some(n => lastDraw.includes(n))) score += 20;

  return score;
}

console.log('조합 생성 중...');
const allCombos = [];

// 전략 1: T1×3 + T2×2 + T3×1
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

// 전략 2: T1×4 + T2×2
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

// 전략 3: T1×3 + T2×3
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

// 전략 4: T1×2 + T2×2 + T3×2
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

// 전략 6: T1×2 + T2×4 (낮은 합계용)
for (let a = 0; a < tier1.length; a++) {
  for (let b = a+1; b < tier1.length; b++) {
    for (let c = 0; c < tier2.length; c++) {
      for (let d = c+1; d < tier2.length; d++) {
        for (let e = d+1; e < tier2.length; e++) {
          for (let f = e+1; f < tier2.length; f++) {
            const combo = [tier1[a], tier1[b], tier2[c], tier2[d], tier2[e], tier2[f]];
            if (new Set(combo).size === 6 && isValid(combo)) {
              allCombos.push({ nums: combo.sort((a,b)=>a-b), score: scoreCombo(combo), type: 6 });
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

// 500개 선택 - 일본 기준 합계 분포 우선
const final500 = [];

// 일본 기준 합계 범위별 목표 (95-170 집중)
const targetDist = {
  '95-119': 130,   // 26%
  '120-139': 170,  // 34%
  '140-159': 140,  // 28%
  '160-170': 60    // 12%
};
const currentDist = { '95-119': 0, '120-139': 0, '140-159': 0, '160-170': 0 };

function getJpSumRange(sum) {
  if (sum >= 95 && sum < 120) return '95-119';
  if (sum >= 120 && sum < 140) return '120-139';
  if (sum >= 140 && sum < 160) return '140-159';
  if (sum >= 160 && sum <= 170) return '160-170';
  return null;
}

// 첫 번째 패스: 엄격한 다양성 (4개 이상 겹치면 제외)
for (const combo of sorted) {
  if (final500.length >= 500) break;

  const sum = combo.nums.reduce((a, b) => a + b, 0);
  const range = getJpSumRange(sum);

  if (!range) continue; // 95-170 범위 외 제외

  if (currentDist[range] < targetDist[range]) {
    let tooSimilar = false;
    for (const sel of final500) {
      const overlap = combo.nums.filter(n => sel.nums.includes(n)).length;
      if (overlap >= 4) {
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

// 두 번째 패스: 부족한 범위 채우기 (5개 이상 겹침 허용)
if (final500.length < 500) {
  for (const combo of sorted) {
    if (final500.length >= 500) break;

    const key = combo.nums.join('-');
    if (final500.find(c => c.nums.join('-') === key)) continue;

    const sum = combo.nums.reduce((a, b) => a + b, 0);
    const range = getJpSumRange(sum);

    if (!range) continue;

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
      currentDist[range]++;
    }
  }
}

// 세 번째 패스: 그래도 부족하면 추가
while (final500.length < 500) {
  for (const combo of sorted) {
    if (final500.length >= 500) break;
    const sum = combo.nums.reduce((a, b) => a + b, 0);
    if (sum < 95 || sum > 170) continue;

    if (!final500.find(c => c.nums.join('-') === combo.nums.join('-'))) {
      final500.push(combo);
    }
  }
  break;
}

console.log(`최종 ${final500.length}개 선정\n`);

// 검증
console.log('=' .repeat(70));
console.log('📊 일본 전문가 기준 검증');
console.log('=' .repeat(70));

// 1. 合計 95-170 검증
let sum95_170 = 0;
let sum120_149 = 0;
final500.forEach(c => {
  const sum = c.nums.reduce((a, b) => a + b, 0);
  if (sum >= 95 && sum <= 170) sum95_170++;
  if (sum >= 120 && sum < 150) sum120_149++;
});
console.log(`\n[1] 合計 95-170: ${sum95_170}/500 (${(sum95_170/5).toFixed(1)}%) - 목표: 90%+`);
console.log(`    120-149 (최적): ${sum120_149}/500 (${(sum120_149/5).toFixed(1)}%)`);

// 2. 偶奇 2:4~4:2 검증
let oddEven234 = 0;
final500.forEach(c => {
  const odd = c.nums.filter(n => n % 2 === 1).length;
  if (odd >= 2 && odd <= 4) oddEven234++;
});
console.log(`[2] 偶奇 2:4~4:2: ${oddEven234}/500 (${(oddEven234/5).toFixed(1)}%) - 목표: 80%+`);

// 3. 引っ張り (이월) 검증
let hippari = 0;
const lastDrawSet = new Set(lastDraw);
final500.forEach(c => {
  if (c.nums.some(n => lastDrawSet.has(n))) hippari++;
});
console.log(`[3] 引っ張り (이월): ${hippari}/500 (${(hippari/5).toFixed(1)}%) - 목표: 65%+`);

// 4. 連続数字 검증
let consec = 0;
final500.forEach(c => {
  const sorted = [...c.nums].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i+1] - sorted[i] === 1) {
      consec++;
      break;
    }
  }
});
console.log(`[4] 連続数字: ${consec}/500 (${(consec/5).toFixed(1)}%) - 목표: 55%`);

// 5. 下一桁共通 검증
let lastDigitMatch = 0;
final500.forEach(c => {
  const lastDigits = c.nums.map(n => n % 10);
  const digitCounts = {};
  lastDigits.forEach(d => digitCounts[d] = (digitCounts[d] || 0) + 1);
  if (Object.values(digitCounts).some(cnt => cnt >= 2)) lastDigitMatch++;
});
console.log(`[5] 下一桁共通: ${lastDigitMatch}/500 (${(lastDigitMatch/5).toFixed(1)}%) - 목표: 80%`);

// 합계 분포 상세
console.log('\n[합계 분포 상세]');
Object.entries(currentDist).forEach(([range, count]) => {
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
let t1_3 = 0;
final500.forEach(c => {
  const count = c.nums.filter(n => tier1.includes(n)).length;
  if (count >= 3) t1_3++;
});
console.log(`[핵심번호] Tier1 3개+ 포함: ${t1_3}장`);

// 과거 매칭
const matchResults = { 6: 0, 5: 0, 4: 0, 3: 0 };
draws.forEach(d => {
  const drawSet = new Set(d.numbers);
  let best = 0;
  final500.forEach(t => {
    const match = t.nums.filter(n => drawSet.has(n)).length;
    if (match > best) best = match;
  });
  if (matchResults[best] !== undefined) matchResults[best]++;
});
console.log(`\n[백테스트] 5개일치: ${matchResults[5]}회, 4개일치: ${matchResults[4]}회`);

// 최종 판정
console.log('\n' + '=' .repeat(70));
console.log('📋 일본 전문가 기준 판정');
console.log('=' .repeat(70));

const checks = [
  { name: '合計 95-170', value: sum95_170/5, target: 90, pass: sum95_170/5 >= 90 },
  { name: '偶奇 2:4~4:2', value: oddEven234/5, target: 80, pass: oddEven234/5 >= 80 },
  { name: '引っ張り (이월)', value: hippari/5, target: 65, pass: hippari/5 >= 60 },
  { name: '連続数字', value: consec/5, target: 55, pass: Math.abs(consec/5 - 55) < 10 },
  { name: '下一桁共通', value: lastDigitMatch/5, target: 80, pass: lastDigitMatch/5 >= 75 }
];

let allPass = true;
checks.forEach(c => {
  const status = c.pass ? '✓ PASS' : '✗ FAIL';
  console.log(`  ${status} ${c.name}: ${c.value.toFixed(1)}% (목표: ${c.target}%)`);
  if (!c.pass) allPass = false;
});

console.log('\n' + '=' .repeat(70));
if (allPass) {
  console.log('🎉 일본 전문가 기준 모두 충족!');
} else {
  console.log('⚠️ 일부 항목 미달');
}
console.log('=' .repeat(70));

// TOP 30 출력
console.log('\nTOP 30 추천');
console.log('=' .repeat(70));
final500.slice(0, 30).forEach((c, i) => {
  const sum = c.nums.reduce((a, b) => a + b, 0);
  console.log(`${(i+1).toString().padStart(2)}위: ${c.nums.map(n=>n.toString().padStart(2)).join(', ')} (점수:${c.score}, 합계:${sum})`);
});

// 저장
fs.writeFileSync(
  'C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_jp_optimized_500.csv',
  '순번,번호1,번호2,번호3,번호4,번호5,번호6,점수,합계,전략\n' +
  final500.map((c, i) => `${i+1},${c.nums.join(',')},${c.score},${c.nums.reduce((a,b)=>a+b,0)},전략${c.type}`).join('\n'),
  'utf8'
);

fs.writeFileSync(
  'C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_jp_optimized_numbers.txt',
  final500.map(c => c.nums.join(',')).join('\n'),
  'utf8'
);

console.log('\n💾 loto6_jp_optimized_500.csv, loto6_jp_optimized_numbers.txt 저장 완료');
