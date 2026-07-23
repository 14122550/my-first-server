// รวมการทำงานของเว็บเซิร์ฟเวอร์และการเชื่อมต่อ PostgreSQL
const http = require('http');
const { Pool } = require('pg');
const url = require('url');

// อ่านการตั้งค่าจาก Environment
const port = process.env.PORT || 3000;
const connectionString = process.env.DATABASE_URL || null;
const nodeEnv = process.env.NODE_ENV || 'development';

// สร้าง Pool สำหรับเชื่อมต่อ PostgreSQL
const pool = new Pool(
  connectionString
    ? {
        connectionString,
        // บริการบางแห่ง (เช่น Railway/Heroku) ต้องการ SSL แต่ไม่ต้องการตรวจสอบใบรับรอง
        ssl: nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
        // ตั้งค่า pool เพื่อจัดการการเชื่อมต่อ
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
    : {}
);

// Event listeners สำหรับ Pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
  console.log('✅ Database connection established');
});

// ฟังก์ชันช่วยสร้างตาราง HTML จากผลลัพธ์
function buildStudentsTable(rows) {
  if (!rows || rows.length === 0) {
    return `
        <div class="info-section">
            <h3 class="info-text">📚 ข้อมูลนักศึกษา</h3>
            <p class="info-text">ยังไม่มีข้อมูลนักศึกษาในตาราง <strong>students</strong></p>
        </div>`;
  }

  let html = `
        <div class="info-section">
            <h3 class="info-text">📚 ข้อมูลนักศึกษา (จากฐานข้อมูล) - ${rows.length} คน</h3>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <thead style="background: linear-gradient(135deg,#23508C,#E67E22); color: white;">
                        <tr>
                            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">รหัสนักศึกษา</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">ชื่อ-นามสกุล</th>
                        </tr>
                    </thead>
                    <tbody>`;

  for (const row of rows) {
    const id = row.student_id ?? '-';
    const name = row.student_name ?? '-';
    html += `
                        <tr style="background: ${rows.indexOf(row) % 2 === 0 ? '#f9f9f9' : 'white'};">
                            <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(id)}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(name)}</td>
                        </tr>`;
  }

  html += `
                    </tbody>
                </table>
            </div>
        </div>`;
  return html;
}

// ฟังก์ชันช่วยหลีกเลี่ยง XSS สำหรับข้อมูลจากฐานข้อมูล
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ฟังก์ชันดึงข้อมูลนักศึกษา
async function getStudents() {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      'SELECT student_id, student_name FROM students ORDER BY student_id'
    );
    return { success: true, data: result.rows, error: null };
  } catch (err) {
    console.error('Database error:', err.message);
    return {
      success: false,
      data: [],
      error: err.message,
    };
  } finally {
    if (client) client.release();
  }
}

// ฟังก์ชันเพิ่มนักศึกษา
async function addStudent(studentId, studentName) {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      'INSERT INTO students (student_id, student_name) VALUES ($1, $2) RETURNING *',
      [studentId, studentName]
    );
    return { success: true, data: result.rows[0], error: null };
  } catch (err) {
    console.error('Database error:', err.message);
    return {
      success: false,
      data: null,
      error: err.message,
    };
  } finally {
    if (client) client.release();
  }
}

// ฟังก์ชันดึงข้อมูล query string
function parseQueryString(query) {
  const params = new URLSearchParams(query);
  const obj = {};
  for (const [key, value] of params) {
    obj[key] = value;
  }
  return obj;
}

// สร้าง HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // ตั้งค่า CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API: ดึงข้อมูลนักศึกษา (JSON)
  if (pathname === '/api/students' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const result = await getStudents();
    res.statusCode = result.success ? 200 : 500;
    res.end(JSON.stringify(result));
    return;
  }

  // API: เพิ่มนักศึกษา
  if (pathname === '/api/students' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const result = await addStudent(data.student_id, data.student_name);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.statusCode = result.success ? 201 : 400;
        res.end(JSON.stringify(result));
      } catch (err) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // หน้าหลัก HTML
  if (pathname === '/' || pathname === '') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    let studentsHtml =
      '<p class="info-text">⚠️ ไม่สามารถเชื่อมต่อฐานข้อมูลได้ โปรดตั้งค่า DATABASE_URL</p>';

    if (connectionString) {
      const studentsResult = await getStudents();
      if (studentsResult.success) {
        studentsHtml = buildStudentsTable(studentsResult.data);
      } else {
        studentsHtml = `
          <div class="info-section" style="background: #ffebee; border-left-color: #f44336;">
            <p class="info-text" style="color: #c62828;">❌ เกิดข้อผิดพลาด: ${escapeHtml(
          studentsResult.error
        )}</p>
            <p class="info-text" style="color: #d32f2f; font-size: 0.9rem; margin-top: 8px;">
              ✓ ตรวจสอบว่าตาราง students มีอยู่ในฐานข้อมูลแล้ว<br>
              ✓ ตรวจสอบว่า DATABASE_URL ถูกต้อง
            </p>
          </div>`;
      }
    }

    // HTML หลัก
    res.end(`<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minion Web Server</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes floatingBubbles { 0% { transform: translateY(100vh) translateX(0); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(-100vh) translateX(100px); opacity: 0; } }
        @keyframes twinkling { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        body { background: linear-gradient(-45deg, #FCE144, #FFF44F, #FFD700, #FFA500); background-size: 400% 400%; animation: gradientShift 15s ease infinite; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px; }
        .bubble { position: fixed; border-radius: 50%; background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), rgba(255,255,255,0.1)); animation: floatingBubbles linear infinite; pointer-events: none; }
        .bubble:nth-child(1) { width: 80px; height: 80px; left: 10%; animation-duration: 8s; animation-delay: 0s; }
        .bubble:nth-child(2) { width: 60px; height: 60px; left: 20%; animation-duration: 10s; animation-delay: 2s; }
        .bubble:nth-child(3) { width: 100px; height: 100px; left: 30%; animation-duration: 12s; animation-delay: 4s; }
        .bubble:nth-child(4) { width: 70px; height: 70px; left: 50%; animation-duration: 9s; animation-delay: 1s; }
        .bubble:nth-child(5) { width: 90px; height: 90px; left: 70%; animation-duration: 11s; animation-delay: 3s; }
        .bubble:nth-child(6) { width: 50px; height: 50px; left: 80%; animation-duration: 10s; animation-delay: 2.5s; }
        .card { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-radius: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.2), 0 0 40px rgba(255,215,0,0.3); padding: 50px 40px; text-align: center; max-width: 800px; z-index: 10; position: relative; }
        @keyframes cardFloat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        .goggle-strap { background: linear-gradient(90deg,#222,#444,#222); height:25px; width:100%; position:absolute; top:40px; left:0; animation: goggleStrapPulse 2s ease-in-out infinite; border-radius: 15px; }
        @keyframes goggleStrapPulse { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(1.1); } }
        .goggles-container { display:flex; justify-content:center; gap:20px; margin-top:10px; position:relative; z-index:1; }
        .goggle { background: radial-gradient(circle at 30% 30%, #F0F0F0, #D0D0D0); border:8px solid #7F8C8D; border-radius:50%; width:80px; height:80px; display:inline-flex; justify-content:center; align-items:center; animation: goggleFloat 2s ease-in-out infinite; }
        .goggle:nth-child(1) { animation-delay: 0s; }
        .goggle:nth-child(2) { animation-delay: 0.2s; }
        @keyframes goggleFloat { 0%,100% { transform: translateY(0px) rotateZ(0deg); } 50% { transform: translateY(-10px) rotateZ(5deg); } }
        .pupil { background: radial-gradient(circle at 35% 35%, #8B4513, #6F4E37); border-radius:50%; width:30px; height:30px; position:relative; box-shadow: inset -2px -2px 5px rgba(0,0,0,0.3); animation: eyeLook 3s ease-in-out infinite; }
        @keyframes eyeLook { 0%,100% { transform: translate(0,0); } 25% { transform: translate(8px,0); } 50% { transform: translate(0,8px); } 75% { transform: translate(-8px,0); } }
        .pupil::after { content:''; background-color:white; border-radius:50%; width:10px; height:10px; position:absolute; top:6px; left:6px; box-shadow: inset -1px -1px 3px rgba(0,0,0,0.2); }
        h1 { color:#23508C; margin-top:20px; font-size:2rem; margin-bottom:5px; animation:textGlow 2s ease-in-out infinite; text-shadow: 0 0 10px rgba(35,80,140,0.3); }
        @keyframes textGlow { 0%,100% { text-shadow: 0 0 10px rgba(35,80,140,0.3); } 50% { text-shadow: 0 0 20px rgba(35,80,140,0.6); } }
        h2 { color:#23508C; margin:5px 0 20px 0; font-size:1.6rem; font-weight:700; background: linear-gradient(135deg,#23508C,#E67E22); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        h3 { color:#23508C; font-size: 1.3rem; margin-bottom: 15px; }
        @keyframes nameShine { 0%,100% { filter:brightness(1); } 50% { filter:brightness(1.2); } }
        .info-section { background: linear-gradient(135deg, rgba(35,80,140,0.05), rgba(230,126,34,0.05)); padding:20px; border-radius:20px; margin:20px 0; border-left:5px solid #E67E22; animation:slideIn 0.5s ease-out; }
        @keyframes slideIn { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
        .info-text { font-size:1.1rem; margin:8px 0; color:#555; font-weight:500; text-align: left; }
        .highlight { color:#E67E22; font-weight:bold; font-size:1.15rem; background: linear-gradient(135deg,#FFD700,#FFA500); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        @keyframes pulse { 0%,100% { filter: drop-shadow(0 0 0px rgba(230,126,34,0.5)); } 50% { filter: drop-shadow(0 0 10px rgba(230,126,34,0.8)); } }
        .status { background: linear-gradient(135deg, #23508C 0%, #1a3a5c 100%); color:white; padding:15px 30px; border-radius:50px; display:inline-block; font-weight:bold; font-size:1.1rem; margin-top:20px; position:relative; overflow:hidden; }
        .status::before { content:''; position:absolute; top:0; left:-100%; width:100%; height:100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); animation:shine 2s infinite; }
        @keyframes shine { 0%{ left:-100%; } 100%{ left:100%; } }
        .bello { font-size:2rem; font-weight:bold; color:#E67E22; margin:15px 0; animation:rotate 2s ease-in-out infinite; }
        @keyframes rotate { 0%,100% { transform:rotate(0deg) scale(1); } 50% { transform:rotate(10deg) scale(1.1); } }
        .api-info { background: #e3f2fd; padding: 15px; border-radius: 10px; margin-top: 20px; text-align: left; font-size: 0.9rem; color: #1565c0; }
        .api-info code { background: #fff; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
        @media (max-width:600px) { .card { padding:35px 25px; } h1 { font-size:1.6rem; } h2 { font-size:1.3rem; } .info-text { font-size:1rem; } .goggle { width:70px; height:70px; } }
    </style>
</head>
<body>
    <div class="bubble"></div>
    <div class="bubble"></div>
    <div class="bubble"></div>
    <div class="bubble"></div>
    <div class="bubble"></div>
    <div class="bubble"></div>

    <div class="card">
        <div class="goggle-strap"></div>
        <div class="goggles-container">
            <div class="goggle"><div class="pupil"></div></div>
            <div class="goggle"><div class="pupil"></div></div>
        </div>
        
        <div class="bello">🍌 BELLO! 🍌</div>
        <h1>สวัสดีค่ะ</h1>
        <h1 style="font-size: 1.3rem; margin: 0 0 15px 0;">Web Server ของ</h1>
        <h2>นางสาวชนกนันท์ ภู่มาลา (อุ้ม)</h2>
        
        <div class="info-section">
            <p class="info-text">📚 รหัสนักศึกษา: <span class="highlight">69319010020</span></p>
            <p class="info-text">🎓 ระดับชั้น: <span class="highlight">HIT.1/1 (VB)</span></p>
            <p class="info-text">💻 สาขา: <span class="highlight">เทคโนโลยีสารสนเทศ</span></p>
        </div>

        ${studentsHtml}

        <div class="api-info">
            <strong>📡 API Endpoints:</strong><br>
            • GET <code>/api/students</code> - ดึงข้อมูลนักศึกษา (JSON)<br>
            • POST <code>/api/students</code> - เพิ่มนักศึกษา<br>
        </div>

        <p class="status">🚀 เครื่องแม่ข่ายทำงานปกติแล้วนะคะ!</p>
    </div>

</body>
</html>`);
    return;
  }

  // 404 Not Found
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('404 Not Found');
});

// เริ่มต้น Server
server.listen(port, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║   🍌 Minion Web Server เปิดทำงานแล้ว                       ║
╠════════════════════════════════════════════════════════════╣
║   🌐 URL: http://localhost:${port}
║   📡 API: http://localhost:${port}/api/students
║   🔧 Environment: ${nodeEnv}
║   🗄️ Database: ${connectionString ? '✅ Connected' : '❌ Not configured'}
╚════════════════════════════════════════════════════════════╝
  `);
});

// ปิด Pool เมื่อ process ถูกยกเลิก
process.on('SIGINT', async () => {
  console.log('\n⏹️ SIGINT received: closing pool and exiting');
  try {
    await pool.end();
    console.log('✅ Database pool closed');
  } catch (e) {
    console.error('❌ Error closing pool:', e);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️ SIGTERM received: closing pool and exiting');
  try {
    await pool.end();
    console.log('✅ Database pool closed');
  } catch (e) {
    console.error('❌ Error closing pool:', e);
  }
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});
