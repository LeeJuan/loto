const https = require('https');
const fs = require('fs');

console.log('🎰 로또7 3년치 데이터 스크래핑');
console.log('=' .repeat(60));

// 2024년 1월 ~ 2026년 1월 (3년치)
const months = [];
for (let year = 2024; year <= 2026; year++) {
  const endMonth = year === 2026 ? 1 : 12;
  for (let month = 1; month <= endMonth; month++) {
    months.push(`${year}${month.toString().padStart(2, '0')}`);
  }
}

console.log(`총 ${months.length}개월 스크래핑 예정`);

const allDraws = [];

function fetchMonth(monthStr) {
  return new Promise((resolve, reject) => {
    const url = `https://takarakuji.rakuten.co.jp/backnumber/loto7/${monthStr}/`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // 회차 추출
        const roundMatches = data.match(/第(\d+)回/g) || [];
        const rounds = roundMatches.map(m => parseInt(m.match(/\d+/)[0]));

        // 날짜 추출
        const dateMatches = data.match(/\d{4}\/\d{2}\/\d{2}/g) || [];

        // 번호 추출 (loto-font-large 클래스)
        const numberMatches = data.match(/<span class="loto-font-large">(\d+)<\/span>/g) || [];
        const numbers = numberMatches.map(m => parseInt(m.match(/\d+/)[0]));

        // 로또7은 본번호 7개 + 보너스 2개 = 9개/회차
        const drawCount = Math.floor(numbers.length / 9);

        for (let i = 0; i < drawCount; i++) {
          const mainNums = numbers.slice(i * 9, i * 9 + 7);
          const bonusNums = numbers.slice(i * 9 + 7, i * 9 + 9);

          if (mainNums.length === 7 && rounds[i]) {
            allDraws.push({
              round: rounds[i],
              date: dateMatches[i] || '',
              numbers: mainNums,
              bonus: bonusNums
            });
          }
        }

        console.log(`  ${monthStr}: ${drawCount}회차 추출`);
        resolve();
      });
    }).on('error', reject);
  });
}

async function scrapeAll() {
  for (const month of months) {
    try {
      await fetchMonth(month);
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.log(`  ${month}: 오류 - ${e.message}`);
    }
  }

  // 정렬
  allDraws.sort((a, b) => a.round - b.round);

  console.log(`\n총 ${allDraws.length}회차 스크래핑 완료`);

  // CSV 저장
  const csv = '회차,날짜,번호1,번호2,번호3,번호4,번호5,번호6,번호7,보너스1,보너스2\n' +
    allDraws.map(d =>
      `${d.round},${d.date},${d.numbers.join(',')},${d.bonus.join(',')}`
    ).join('\n');

  fs.writeFileSync('C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto7_results.csv', csv, 'utf8');

  // JSON 저장
  fs.writeFileSync('C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto7_results.json',
    JSON.stringify(allDraws, null, 2), 'utf8');

  console.log('💾 loto7_results.csv, loto7_results.json 저장 완료');

  // 요약
  if (allDraws.length > 0) {
    console.log(`\n첫 회차: 제${allDraws[0].round}회 (${allDraws[0].date})`);
    console.log(`마지막: 제${allDraws[allDraws.length-1].round}회 (${allDraws[allDraws.length-1].date})`);
  }
}

scrapeAll();
