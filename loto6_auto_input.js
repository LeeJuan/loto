// 라쿠텐 로또6 자동 입력 스크립트
// 사용법: 라쿠텐 로또6 구매 페이지에서 브라우저 개발자도구(F12) > Console에 붙여넣기

// 500장 데이터 (loto6_jp_perfect_numbers.txt에서 복사)
const tickets = `
6,19,23,29,33,36
5,10,20,23,29,36
1,6,20,23,33,35
5,22,24,29,33,35
10,19,22,24,29,36
1,20,26,29,33,36
6,11,24,26,33,36
1,11,20,24,29,35
6,11,20,29,36,43
2,23,26,29,33,35
`.trim().split('\n').map(line => line.split(',').map(Number));

console.log(`총 ${tickets.length}장 로드됨`);

// 자동 입력 함수 (페이지 구조에 따라 수정 필요)
async function autoFillTicket(numbers, delay = 500) {
  // 번호 버튼 클릭 (예시 - 실제 페이지 구조에 맞게 수정 필요)
  for (const num of numbers) {
    const btn = document.querySelector(`[data-number="${num}"], .num-${num}, #num${num}`);
    if (btn) {
      btn.click();
      await new Promise(r => setTimeout(r, 100));
    }
  }
  await new Promise(r => setTimeout(r, delay));
}

// 안내 메시지
console.log('='.repeat(50));
console.log('라쿠텐 로또6 자동 입력 도우미');
console.log('='.repeat(50));
console.log('');
console.log('⚠️ 라쿠텐은 CSV 일괄 입력을 지원하지 않습니다.');
console.log('');
console.log('📋 대안 방법:');
console.log('1. 한 번에 최대 50장까지 구매 가능');
console.log('2. myナンバー에 자주 쓰는 조합 저장 가능');
console.log('3. 자동구매 설정으로 반복 구매 가능');
console.log('');
console.log('💡 500장 구매 시:');
console.log('   - 10회에 나눠서 구매 (50장 × 10회)');
console.log('   - 또는 자동구매 설정 활용');
console.log('');
