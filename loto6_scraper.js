const https = require('https');
const fs = require('fs');

// 3년치 월별 URL 생성 (202401 ~ 202601)
function generateMonthlyUrls() {
  const urls = [];
  for (let year = 2024; year <= 2026; year++) {
    const endMonth = year === 2026 ? 1 : 12;
    for (let month = 1; month <= endMonth; month++) {
      const monthStr = String(month).padStart(2, '0');
      urls.push(`https://takarakuji.rakuten.co.jp/backnumber/loto6/${year}${monthStr}/`);
    }
  }
  return urls;
}

// HTML에서 당첨번호 추출
function extractLotoData(html, url) {
  const results = [];

  // 각 테이블 블록 추출 (tblNumberGuid 클래스)
  const tableRegex = /<table class="tblType02 tblNumberGuid">([\s\S]*?)<\/table>/gi;
  let tableMatch;

  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableContent = tableMatch[1];

    // 회차 추출 (第XXXX回)
    const roundMatch = tableContent.match(/第(\d+)回/);
    if (!roundMatch) continue;
    const round = parseInt(roundMatch[1]);

    // 날짜 추출 (YYYY/MM/DD)
    const dateMatch = tableContent.match(/>(\d{4}\/\d{2}\/\d{2})</);
    const date = dateMatch ? dateMatch[1] : 'unknown';

    // 본수자 6개 추출 (loto-font-large 클래스)
    const numbersMatch = tableContent.match(/<th>本数字<\/th>([\s\S]*?)<\/tr>/i);
    if (!numbersMatch) continue;

    const numberRegex = /<span class="loto-font-large">(\d+)<\/span>/g;
    const numbers = [];
    let numMatch;
    while ((numMatch = numberRegex.exec(numbersMatch[1])) !== null) {
      numbers.push(parseInt(numMatch[1]));
    }

    // 보너스 번호 추출 (괄호 안의 숫자)
    const bonusMatch = tableContent.match(/<th>ボーナス数字<\/th>[\s\S]*?<span class="loto-highlight loto-font-large">\((\d+)\)<\/span>/i);
    const bonus = bonusMatch ? parseInt(bonusMatch[1]) : null;

    if (numbers.length === 6) {
      results.push({
        round,
        date,
        numbers,
        bonus
      });
    }
  }

  return results;
}

// URL에서 HTML 가져오기
function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// 딜레이 함수
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 메인 실행
async function main() {
  const urls = generateMonthlyUrls();
  const allResults = [];

  console.log(`총 ${urls.length}개 페이지 스크래핑 시작...`);
  console.log('대상 기간: 2024년 1월 ~ 2026년 1월\n');

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const monthMatch = url.match(/(\d{6})/);
    const month = monthMatch ? monthMatch[1] : 'unknown';

    try {
      console.log(`[${i + 1}/${urls.length}] ${month} 페이지 처리 중...`);
      const html = await fetchPage(url);
      const data = extractLotoData(html, url);

      if (data.length > 0) {
        allResults.push(...data);
        console.log(`  → ${data.length}개 회차 추출 (第${data[0].round}回 ~ 第${data[data.length-1].round}回)`);
      } else {
        console.log(`  → 데이터 없음`);
      }

      // 서버 부하 방지를 위한 딜레이
      await delay(800);

    } catch (error) {
      console.error(`  → 에러: ${error.message}`);
    }
  }

  // 회차 순으로 정렬
  allResults.sort((a, b) => a.round - b.round);

  // 결과 저장 (JSON)
  const outputPath = 'C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_results.json';
  fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2), 'utf8');

  console.log(`\n========== 완료 ==========`);
  console.log(`총 ${allResults.length}개 회차 데이터 추출`);
  console.log(`저장 위치: ${outputPath}`);

  // CSV 형식으로도 저장
  const csvPath = 'C:\\Users\\user\\Desktop\\work\\casino\\myple\\loto6_results.csv';
  const csvHeader = '회차,추첨일,번호1,번호2,번호3,번호4,번호5,번호6,보너스\n';
  const csvData = allResults.map(r =>
    `${r.round},${r.date},${r.numbers.join(',')},${r.bonus}`
  ).join('\n');
  fs.writeFileSync(csvPath, csvHeader + csvData, 'utf8');
  console.log(`CSV 저장: ${csvPath}`);

  // 샘플 출력
  if (allResults.length > 0) {
    console.log('\n========== 샘플 데이터 ==========');
    console.log('처음 3개:');
    allResults.slice(0, 3).forEach(r => {
      console.log(`  第${r.round}回 (${r.date}): ${r.numbers.join(', ')} + (${r.bonus})`);
    });
    console.log('마지막 3개:');
    allResults.slice(-3).forEach(r => {
      console.log(`  第${r.round}回 (${r.date}): ${r.numbers.join(', ')} + (${r.bonus})`);
    });
  }
}

main().catch(console.error);
