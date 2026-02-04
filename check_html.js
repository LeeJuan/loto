const https = require('https');
const fs = require('fs');

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

async function main() {
  const url = 'https://takarakuji.rakuten.co.jp/backnumber/loto6/202401/';
  console.log('Fetching:', url);
  const html = await fetchPage(url);

  // HTML 파일로 저장
  fs.writeFileSync('C:\\Users\\user\\Desktop\\work\\casino\\myple\\sample.html', html, 'utf8');
  console.log('HTML saved to sample.html');
  console.log('HTML length:', html.length);

  // 주요 패턴 확인
  console.log('\n=== 회차 패턴 확인 ===');
  const rounds = html.match(/第\d+回/g);
  console.log('회차 매치:', rounds ? rounds.slice(0, 10) : 'none');

  console.log('\n=== 숫자 패턴 확인 ===');
  // 1-43 범위의 2자리 숫자 연속
  const numPattern = html.match(/\d{1,2}/g);
  console.log('숫자 개수:', numPattern ? numPattern.length : 0);

  console.log('\n=== 테이블 확인 ===');
  const tables = html.match(/<table[^>]*>/gi);
  console.log('테이블 개수:', tables ? tables.length : 0);

  console.log('\n=== td 태그 확인 ===');
  const tds = html.match(/<td[^>]*>[^<]*<\/td>/gi);
  console.log('TD 태그 샘플:', tds ? tds.slice(0, 20) : 'none');
}

main().catch(console.error);
