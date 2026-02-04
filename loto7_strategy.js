const fs = require('fs');

console.log('🎰 로또7 일본 전문가 기준 150장 전략');
console.log('=' .repeat(70));

// 데이터 로드
const csv = fs.readFileSync('C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto7_results.csv', 'utf8');
const lines = csv.trim().split('\n').slice(1);
const draws = lines.map(line => {
  const parts = line.split(',');
  return {
    round: parseInt(parts[0]),
    date: parts[1],
    numbers: [parts[2], parts[3], parts[4], parts[5], parts[6], parts[7], parts[8]].map(Number)
  };
});

console.log(`데이터: ${draws.length}회차 (${draws[0].date} ~ ${draws[draws.length-1].date})\n`);

// ==================== 분석 ====================
console.log('=' .repeat(70));
console.log('📊 로또7 데이터 분석');
console.log('=' .repeat(70));

// 1. 번호별 빈도
const freq = {};
for (let i = 1; i <= 37; i++) freq[i] = 0;
draws.forEach(d => d.numbers.forEach(n => freq[n]++));

const sortedFreq = Object.entries(freq)
  .map(([num, count]) => ({ num: parseInt(num), count, rate: (count / draws.length * 100 / 7 * 37).toFixed(1) }))
  .sort((a, b) => b.count - a.count);

console.log('\n[번호별 빈도 TOP 15]');
sortedFreq.slice(0, 15).forEach((f, i) => {
  console.log(`  ${(i+1).toString().padStart(2)}위: ${f.num.toString().padStart(2)}번 - ${f.count}회`);
});

// Tier 분류 (로또7: 1~37)
const tier1 = sortedFreq.slice(0, 10).map(f => f.num);  // 상위 10개
const tier2 = sortedFreq.slice(10, 20).map(f => f.num); // 중위 10개
const tier3 = sortedFreq.slice(20).map(f => f.num);     // 하위 17개

console.log(`\nTier1 (고빈도): ${tier1.join(', ')}`);
console.log(`Tier2 (중빈도): ${tier2.join(', ')}`);
console.log(`Tier3 (저빈도): ${tier3.join(', ')}`);

// 2. 합계 분석 (로또7: 7개 번호, 1~37)
// 이론 평균: 7 * (1+37)/2 = 133
const sums = draws.map(d => d.numbers.reduce((a, b) => a + b, 0));
const avgSum = (sums.reduce((a, b) => a + b, 0) / sums.length).toFixed(1);
const minSum = Math.min(...sums);
const maxSum = Math.max(...sums);

console.log(`\n[합계 분석]`);
console.log(`  평균: ${avgSum}, 최소: ${minSum}, 최대: ${maxSum}`);

// 합계 분포
const sumRanges = { '80-109': 0, '110-139': 0, '140-169': 0, '170-199': 0, '200+': 0 };
sums.forEach(s => {
  if (s < 110) sumRanges['80-109']++;
  else if (s < 140) sumRanges['110-139']++;
  else if (s < 170) sumRanges['140-169']++;
  else if (s < 200) sumRanges['170-199']++;
  else sumRanges['200+']++;
});

console.log('  합계 분포:');
Object.entries(sumRanges).forEach(([range, count]) => {
  console.log(`    ${range}: ${count}회 (${(count/draws.length*100).toFixed(1)}%)`);
});

// 3. 홀짝 분석 (7개 중)
const oddEvenDist = {};
draws.forEach(d => {
  const odd = d.numbers.filter(n => n % 2 === 1).length;
  const key = `${odd}:${7-odd}`;
  oddEvenDist[key] = (oddEvenDist[key] || 0) + 1;
});

console.log('\n[홀짝 분포]');
Object.entries(oddEvenDist).sort((a, b) => b[1] - a[1]).forEach(([pattern, count]) => {
  console.log(`  ${pattern}: ${count}회 (${(count/draws.length*100).toFixed(1)}%)`);
});

// 4. 이월 번호 (引っ張り)
let hippariCount = 0;
for (let i = 1; i < draws.length; i++) {
  const prev = new Set(draws[i-1].numbers);
  const curr = draws[i].numbers;
  if (curr.some(n => prev.has(n))) hippariCount++;
}
console.log(`\n[이월 번호] ${hippariCount}/${draws.length-1}회 (${(hippariCount/(draws.length-1)*100).toFixed(1)}%)`);

// 5. 연속 번호
let consecCount = 0;
draws.forEach(d => {
  const sorted = [...d.numbers].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i+1] - sorted[i] === 1) {
      consecCount++;
      break;
    }
  }
});
console.log(`[연속 번호] ${consecCount}/${draws.length}회 (${(consecCount/draws.length*100).toFixed(1)}%)`);

// 6. 끝자리 같은 번호
let lastDigitCount = 0;
draws.forEach(d => {
  const lastDigits = d.numbers.map(n => n % 10);
  const digitCounts = {};
  lastDigits.forEach(digit => digitCounts[digit] = (digitCounts[digit] || 0) + 1);
  if (Object.values(digitCounts).some(c => c >= 2)) lastDigitCount++;
});
console.log(`[끝자리 같은 번호] ${lastDigitCount}/${draws.length}회 (${(lastDigitCount/draws.length*100).toFixed(1)}%)`);

// 최근 당첨번호
const lastDraw = draws[draws.length - 1].numbers;
console.log(`\n[최근 당첨번호] 제${draws[draws.length-1].round}회: ${lastDraw.join(', ')}`);

// ==================== 150장 전략 생성 ====================
console.log('\n' + '=' .repeat(70));
console.log('🎯 150장 전략 생성');
console.log('=' .repeat(70));

// 쌍 빈도 계산
const pairs = {};
draws.forEach(d => {
  for (let i = 0; i < d.numbers.length; i++) {
    for (let j = i + 1; j < d.numbers.length; j++) {
      const key = [d.numbers[i], d.numbers[j]].sort((a, b) => a - b).join('-');
      pairs[key] = (pairs[key] || 0) + 1;
    }
  }
});

function hasConsecutive(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i+1] - sorted[i] === 1) return true;
  }
  return false;
}

function hasLastDigitMatch(nums) {
  const lastDigits = nums.map(n => n % 10);
  const digitCounts = {};
  lastDigits.forEach(d => digitCounts[d] = (digitCounts[d] || 0) + 1);
  return Object.values(digitCounts).some(c => c >= 2);
}

function isValid(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);

  // 합계 범위 (로또7 기준: 100-180)
  if (sum < 100 || sum > 185) return false;

  // 홀짝 균형 (2:5 ~ 5:2)
  const odd = sorted.filter(n => n % 2 === 1).length;
  if (odd < 2 || odd > 5) return false;

  // 고저 균형 (1-18: 저, 19-37: 고)
  const low = sorted.filter(n => n <= 18).length;
  if (low < 2 || low > 5) return false;

  // 연속 3개 이상 제외
  let consecCount = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i+1] - sorted[i] === 1) consecCount++;
  }
  if (consecCount >= 3) return false;

  // 이전 당첨번호 4개 이상 포함 제외
  const lastCount = sorted.filter(n => lastDraw.includes(n)).length;
  if (lastCount >= 4) return false;

  return true;
}

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
      if (pairs[key] >= 3) score += pairs[key] * 2;
    }
  }

  // 합계 보너스 (최적 범위)
  const sum = nums.reduce((a, b) => a + b, 0);
  if (sum >= 120 && sum < 160) score += 25;
  else if (sum >= 100 && sum <= 185) score += 10;

  // 연속번호 포함 보너스
  if (hasConsecutive(nums)) score += 15;

  // 끝자리 같은 번호 보너스
  if (hasLastDigitMatch(nums)) score += 15;

  // 이월 번호 보너스
  if (nums.some(n => lastDraw.includes(n))) score += 20;

  return score;
}

console.log('조합 생성 중...');
const allCombos = [];

// 전략 1: T1×4 + T2×2 + T3×1
for (let a = 0; a < tier1.length; a++) {
  for (let b = a+1; b < tier1.length; b++) {
    for (let c = b+1; c < tier1.length; c++) {
      for (let d = c+1; d < tier1.length; d++) {
        for (let e = 0; e < tier2.length; e++) {
          for (let f = e+1; f < tier2.length; f++) {
            for (let g = 0; g < tier3.length; g++) {
              const combo = [tier1[a], tier1[b], tier1[c], tier1[d], tier2[e], tier2[f], tier3[g]];
              if (new Set(combo).size === 7 && isValid(combo)) {
                allCombos.push({ nums: combo.sort((a,b)=>a-b), score: scoreCombo(combo), type: 1, hasConsec: hasConsecutive(combo) });
              }
            }
          }
        }
      }
    }
  }
}

// 전략 2: T1×3 + T2×3 + T3×1
for (let a = 0; a < tier1.length; a++) {
  for (let b = a+1; b < tier1.length; b++) {
    for (let c = b+1; c < tier1.length; c++) {
      for (let d = 0; d < tier2.length; d++) {
        for (let e = d+1; e < tier2.length; e++) {
          for (let f = e+1; f < tier2.length; f++) {
            for (let g = 0; g < tier3.length; g++) {
              const combo = [tier1[a], tier1[b], tier1[c], tier2[d], tier2[e], tier2[f], tier3[g]];
              if (new Set(combo).size === 7 && isValid(combo)) {
                allCombos.push({ nums: combo.sort((a,b)=>a-b), score: scoreCombo(combo), type: 2, hasConsec: hasConsecutive(combo) });
              }
            }
          }
        }
      }
    }
  }
}

// 전략 3: T1×3 + T2×2 + T3×2
for (let a = 0; a < tier1.length; a++) {
  for (let b = a+1; b < tier1.length; b++) {
    for (let c = b+1; c < tier1.length; c++) {
      for (let d = 0; d < tier2.length; d++) {
        for (let e = d+1; e < tier2.length; e++) {
          for (let f = 0; f < tier3.length; f++) {
            for (let g = f+1; g < tier3.length; g++) {
              const combo = [tier1[a], tier1[b], tier1[c], tier2[d], tier2[e], tier3[f], tier3[g]];
              if (new Set(combo).size === 7 && isValid(combo)) {
                allCombos.push({ nums: combo.sort((a,b)=>a-b), score: scoreCombo(combo), type: 3, hasConsec: hasConsecutive(combo) });
              }
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

// 연속번호 분리
const withConsec = Array.from(unique.values()).filter(c => c.hasConsec).sort((a, b) => b.score - a.score);
const withoutConsec = Array.from(unique.values()).filter(c => !c.hasConsec).sort((a, b) => b.score - a.score);

console.log(`고유 조합: ${unique.size}개 (연속O: ${withConsec.length}, 연속X: ${withoutConsec.length})`);

// 150장 선택 (연속번호 55% 목표 = 83개)
const final150 = [];
const targetConsec = 83;
const targetNonConsec = 67;

function getJpSumRange(sum) {
  if (sum >= 100 && sum < 125) return '100-124';
  if (sum >= 125 && sum < 145) return '125-144';
  if (sum >= 145 && sum < 165) return '145-164';
  if (sum >= 165 && sum <= 185) return '165-185';
  return null;
}

const targetDist = { '100-124': 25, '125-144': 55, '145-164': 50, '165-185': 20 };
const currentDist = { '100-124': 0, '125-144': 0, '145-164': 0, '165-185': 0 };

function isTooSimilar(combo, existing, threshold = 5) {
  for (const sel of existing) {
    const overlap = combo.nums.filter(n => sel.nums.includes(n)).length;
    if (overlap >= threshold) return true;
  }
  return false;
}

let currentConsec = 0;
let currentNonConsec = 0;

// 1단계: 연속번호 미포함 먼저
for (const combo of withoutConsec) {
  if (currentNonConsec >= targetNonConsec) break;

  const sum = combo.nums.reduce((a, b) => a + b, 0);
  const range = getJpSumRange(sum);
  if (!range) continue;

  if (currentDist[range] < targetDist[range]) {
    if (!isTooSimilar(combo, final150)) {
      final150.push(combo);
      currentDist[range]++;
      currentNonConsec++;
    }
  }
}

// 2단계: 연속번호 포함
for (const combo of withConsec) {
  if (currentConsec >= targetConsec) break;

  const sum = combo.nums.reduce((a, b) => a + b, 0);
  const range = getJpSumRange(sum);
  if (!range) continue;

  if (!isTooSimilar(combo, final150)) {
    final150.push(combo);
    currentDist[range]++;
    currentConsec++;
  }
}

// 3단계: 부족분 채우기
if (final150.length < 150) {
  const all = [...withoutConsec, ...withConsec].sort((a, b) => b.score - a.score);
  for (const combo of all) {
    if (final150.length >= 150) break;
    if (final150.find(c => c.nums.join('-') === combo.nums.join('-'))) continue;

    const sum = combo.nums.reduce((a, b) => a + b, 0);
    const range = getJpSumRange(sum);
    if (!range) continue;

    if (!isTooSimilar(combo, final150.slice(-50), 6)) {
      final150.push(combo);
    }
  }
}

console.log(`최종 ${final150.length}장 선정\n`);

// ==================== 검증 ====================
console.log('=' .repeat(70));
console.log('📊 일본 전문가 기준 검증');
console.log('=' .repeat(70));

// 1. 합계 100-185
let sum100_185 = 0;
let sum125_160 = 0;
final150.forEach(c => {
  const sum = c.nums.reduce((a, b) => a + b, 0);
  if (sum >= 100 && sum <= 185) sum100_185++;
  if (sum >= 125 && sum < 160) sum125_160++;
});
console.log(`\n[1] 合計 100-185: ${sum100_185}/150 (${(sum100_185/1.5).toFixed(1)}%) - 목표: 90%+`);
console.log(`    125-159 (최적): ${sum125_160}/150 (${(sum125_160/1.5).toFixed(1)}%)`);

// 2. 홀짝 2:5~5:2
let oddEven = 0;
final150.forEach(c => {
  const odd = c.nums.filter(n => n % 2 === 1).length;
  if (odd >= 2 && odd <= 5) oddEven++;
});
console.log(`[2] 偶奇 2:5~5:2: ${oddEven}/150 (${(oddEven/1.5).toFixed(1)}%) - 목표: 80%+`);

// 3. 이월
let hippari = 0;
const lastDrawSet = new Set(lastDraw);
final150.forEach(c => {
  if (c.nums.some(n => lastDrawSet.has(n))) hippari++;
});
console.log(`[3] 引っ張り: ${hippari}/150 (${(hippari/1.5).toFixed(1)}%) - 목표: 65%+`);

// 4. 연속번호
let consec = 0;
final150.forEach(c => {
  if (hasConsecutive(c.nums)) consec++;
});
const consecRate = consec / 1.5;
console.log(`[4] 連続数字: ${consec}/150 (${consecRate.toFixed(1)}%) - 목표: 50-60%`);

// 5. 끝자리
let lastDigitMatch = 0;
final150.forEach(c => {
  if (hasLastDigitMatch(c.nums)) lastDigitMatch++;
});
console.log(`[5] 下一桁共通: ${lastDigitMatch}/150 (${(lastDigitMatch/1.5).toFixed(1)}%) - 목표: 80%+`);

// 합계 분포
console.log('\n[합계 분포]');
const finalDist = { '100-124': 0, '125-144': 0, '145-164': 0, '165-185': 0 };
final150.forEach(c => {
  const sum = c.nums.reduce((a, b) => a + b, 0);
  const range = getJpSumRange(sum);
  if (range) finalDist[range]++;
});
Object.entries(finalDist).forEach(([range, count]) => {
  console.log(`  ${range}: ${count}장 (${(count/1.5).toFixed(1)}%)`);
});

// 다양성
let similarPairs = 0;
for (let i = 0; i < final150.length; i++) {
  for (let j = i + 1; j < final150.length; j++) {
    const overlap = final150[i].nums.filter(n => final150[j].nums.includes(n)).length;
    if (overlap >= 6) similarPairs++;
  }
}
console.log(`\n[다양성] 6개+ 겹치는 쌍: ${similarPairs}쌍`);

// 백테스트
const matchResults = { 7: 0, 6: 0, 5: 0, 4: 0, 3: 0 };
draws.forEach(d => {
  const drawSet = new Set(d.numbers);
  let best = 0;
  final150.forEach(t => {
    const match = t.nums.filter(n => drawSet.has(n)).length;
    if (match > best) best = match;
  });
  if (matchResults[best] !== undefined) matchResults[best]++;
});
console.log(`\n[백테스트] 6개일치: ${matchResults[6]}회, 5개일치: ${matchResults[5]}회, 4개일치: ${matchResults[4]}회`);

// TOP 20
console.log('\n' + '=' .repeat(70));
console.log('TOP 20 추천');
console.log('=' .repeat(70));
final150.slice(0, 20).forEach((c, i) => {
  const sum = c.nums.reduce((a, b) => a + b, 0);
  const consec = hasConsecutive(c.nums) ? '연속O' : '연속X';
  console.log(`${(i+1).toString().padStart(2)}위: ${c.nums.map(n=>n.toString().padStart(2)).join(', ')} (점수:${c.score}, 합계:${sum}, ${consec})`);
});

// 저장
fs.writeFileSync(
  'C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto7_150.csv',
  '순번,번호1,번호2,번호3,번호4,번호5,번호6,번호7,점수,합계,연속\n' +
  final150.map((c, i) => `${i+1},${c.nums.join(',')},${c.score},${c.nums.reduce((a,b)=>a+b,0)},${c.hasConsec ? 'O' : 'X'}`).join('\n'),
  'utf8'
);

fs.writeFileSync(
  'C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto7_150_numbers.txt',
  final150.map(c => c.nums.join(',')).join('\n'),
  'utf8'
);

console.log('\n💾 loto7_150.csv, loto7_150_numbers.txt 저장 완료');
