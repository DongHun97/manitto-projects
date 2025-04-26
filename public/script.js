function showAdminLogin() {
    document.getElementById('adminLogin').style.display = 'block';
  }
  
  let adminInfo = {};
  
  async function register() {
    const team = document.getElementById('team').value;
    const name = document.getElementById('name').value.trim();
    const password = document.getElementById('pw').value;
  
    if (!team || !name || !password) {
      alert("모든 정보를 입력해주세요.");
      return;
    }
  
    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team, name, password })
    });
  
    const result = await res.json();
    if (res.ok) {
      document.getElementById('result').innerText = `🎉 마니또 추첨 완료!`;
    } else {
      document.getElementById('result').innerText = `❌ ${result.error}`;
    }
  }
  
  async function check() {
    const team = document.getElementById('team').value;
    const name = document.getElementById('name').value.trim();
    const password = document.getElementById('pw').value;
  
    if (!team || !name || !password) {
      alert("모든 정보를 입력해주세요.");
      return;
    }
  
    const res = await fetch('/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team, name, password })
    });
  
    const result = await res.json();
    if (res.ok) {
      document.getElementById('result').innerText = `🎁 ${name}님의 마니또는 👉 ${result.assigned}`;
    } else {
      document.getElementById('result').innerText = `❌ ${result.error}`;
    }
  }
  
  async function adminLogin() {
    const id = document.getElementById('adminId').value;
    const password = document.getElementById('adminPw').value;
    adminInfo = { id, password };
    const res = await fetch('/admin/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password, reveal: false })
    });
    const result = await res.json();
    if (res.ok) {
      renderResult(result.data, false);
    } else {
      alert("❌ 로그인 실패: " + result.error);
    }
  }
  
  async function revealRealNames() {
    const res = await fetch('/admin/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...adminInfo, reveal: true })
    });
    const result = await res.json();
    if (res.ok) {
      renderResult(result.data, true);
    }
  }
  
  function renderResult(data, reveal) {
    let html = `<h3>${reveal ? "✅ 실명 결과" : "🙈 익명 상태"}</h3>`;
    for (const team in data) {
      html += `<h4>${team}</h4><ul>`;
      for (const person in data[team]) {
        html += `<li>${person} 👉 ${data[team][person]}</li>`;
      }
      html += "</ul>";
    }
    if (!reveal) html += `<button onclick="revealRealNames()">✅ 최종 결과 보기</button>`;
    html += `<br><button onclick="resetAll()">🔄 전체 초기화</button>`;
    document.getElementById('adminResult').innerHTML = html;
  }
  
  async function resetAll() {
    const confirmReset = confirm("정말 전체 초기화하시겠습니까?");
    if (!confirmReset) return;
  
    const res = await fetch('/admin/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminInfo)
    });
  
    const result = await res.json();
    if (res.ok) {
      alert("🔄 전체 초기화 완료!");
      location.reload();
    } else {
      alert("❌ 초기화 실패: " + result.error);
    }
  }
  