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
            <h3 class="section-title">📚 ข้อมูลนักศึกษา (จากฐานข้อมูล) - ${rows.length} คน</h3>
            <div style="overflow-x: auto;">
                <table class="custom-table">
                    <thead>
                        <tr>
                            <th>รหัสนักศึกษา</th>
                            <th>ชื่อ-นามสกุล</th>
                        </tr>
                    </thead>
                    <tbody>`;

  for (const row of rows) {
    const id = row.students_id ?? '-';
    const name = row.students_name ?? '-';
    html += `
                        <tr>
                            <td>${escapeHtml(id)}</td>
                            <td>${escapeHtml(name)}</td>
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
      'SELECT students_id, students_name FROM students ORDER BY students_id'
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
      'INSERT INTO students (students_id, students_name) VALUES ($1, $2) RETURNING *',
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

// สร้าง HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // ตั้งค่า CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
        const result = await addStudent(
          data.students_id || data.student_id, 
          data.students_name || data.student_name
        );
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
        
        body { 
            background: linear-gradient(-45deg, #FCE144, #FFF44F, #FFD700, #FFA500); 
            background-size: 400% 400%; 
            animation: gradientShift 15s ease infinite; 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            min-height: 100vh; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            padding: 30px 20px; 
        }

        .bubble { position: fixed; border-radius: 50%; background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), rgba(255,255,255,0.1)); animation: floatingBubbles linear infinite; pointer-events: none; }
        .bubble:nth-child(1) { width: 80px; height: 80px; left: 10%; animation-duration: 8s; }
        .bubble:nth-child(2) { width: 60px; height: 60px; left: 20%; animation-duration: 10s; animation-delay: 2s; }
        .bubble:nth-child(3) { width: 100px; height: 100px; left: 30%; animation-duration: 12s; animation-delay: 4s; }
        .bubble:nth-child(4) { width: 70px; height: 70px; left: 70%; animation-duration: 9s; animation-delay: 1s; }
        .bubble:nth-child(5) { width: 90px; height: 90px; left: 85%; animation-duration: 11s; animation-delay: 3s; }

        .card { 
            background: rgba(255,255,255,0.96); 
            backdrop-filter: blur(10px); 
            border-radius: 30px; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 0 40px rgba(255,215,0,0.3); 
            padding: 40px 50px; 
            text-align: center; 
            width: 100%;
            max-width: 1050px; /* ขยายความกว้างแนวนอน */
            z-index: 10; 
            position: relative; 
        }

        .goggle-strap { background: linear-gradient(90deg,#222,#444,#222); height:22px; width:100%; position:absolute; top:35px; left:0; border-radius: 15px; }
        .goggles-container { display:flex; justify-content:center; gap:15px; position:relative; z-index:1; }
        .goggle { background: radial-gradient(circle at 30% 30%, #F0F0F0, #D0D0D0); border:6px solid #7F8C8D; border-radius:50%; width:70px; height:70px; display:inline-flex; justify-content:center; align-items:center; }
        .pupil { background: radial-gradient(circle at 35% 35%, #8B4513, #6F4E37); border-radius:50%; width:26px; height:26px; position:relative; }
        .pupil::after { content:''; background-color:white; border-radius:50%; width:8px; height:8px; position:absolute; top:5px; left:5px; }

        .bello { font-size:1.8rem; font-weight:bold; color:#E67E22; margin:10px 0; }
        h1 { color:#23508C; font-size:1.8rem; margin-bottom:2px; }
        h2 { color:#23508C; font-size:1.5rem; font-weight:700; background: linear-gradient(135deg,#23508C,#E67E22); -webkit-background-clip:text; -webkit-text-fill-color:transparent; margin-bottom:25px; }

        /* จัด Layout เป็นแนวนอนแบบ Dashboard Grid */
        .grid-container {
            display: grid;
            grid-template-columns: 1fr 1.4fr; /* แบ่งซ้าย-ขวา */
            gap: 25px;
            text-align: left;
            margin-top: 15px;
        }

        .info-section { 
            background: linear-gradient(135deg, rgba(35,80,140,0.04), rgba(230,126,34,0.04)); 
            padding:25px; 
            border-radius:20px; 
            border-left:5px solid #E67E22; 
            height: 100%;
        }

        .section-title { color:#23508C; font-size: 1.2rem; margin-bottom: 15px; font-weight:bold; }
        .info-text { font-size:1.05rem; margin:12px 0; color:#555; font-weight:500; }
        .highlight { color:#E67E22; font-weight:bold; font-size:1.1rem; }

        /* ตารางสไตล์ใหม่สวยงาม */
        .custom-table {
            width: 100%; 
            border-collapse: separate; 
            border-spacing: 0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .custom-table th {
            background: linear-gradient(135deg,#23508C,#E67E22); 
            color: white;
            padding: 12px 15px;
            font-size: 0.95rem;
            text-align: left;
        }
        .custom-table td {
            padding: 12px 15px;
            background: white;
            border-bottom: 1px solid #eee;
            color: #444;
            font-size: 0.95rem;
        }
        .custom-table tbody tr:hover td {
            background-color: #fdf8e6;
        }

        .footer-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 25px;
            gap: 15px;
            flex-wrap: wrap;
        }

        .api-info { 
            background: #e3f2fd; 
            padding: 12px 20px; 
            border-radius: 12px; 
            text-align: left; 
            font-size: 0.85rem; 
            color: #1565c0; 
            flex: 1;
        }
        .api-info code { background: #fff; padding: 2px 6px; border-radius: 4px; font-family: monospace; }

        .status { 
            background: linear-gradient(135deg, #23508C 0%, #1a3a5c 100%); 
            color:white; 
            padding:12px 25px; 
            border-radius:50px; 
            font-weight:bold; 
            font-size:0.95rem; 
            white-space: nowrap;
        }

        /* Responsive เมื่อเปิดบนมือถือ */
        @media (max-width: 850px) { 
            .grid-container { grid-template-columns: 1fr; }
            .card { padding: 30px 20px; }
            .footer-bar { flex-direction: column; text-align: center; }
            .api-info { width: 100%; }
        }
    </style>
</head>
<body>
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
        <h1>สวัสดีค่ะ Web Server ของ</h1>
        <h2>นางสาวชนกนันท์ ภู่มาลา (อุ้ม)</h2>
        
        <!-- แบ่ง Layout ซ้าย-ขวา แนวนอน -->
        <div class="grid-container">
            <!-- ฝั่งซ้าย: ข้อมูลส่วนตัว -->
            <div class="info-section">
                <div class="section-title">👤 ข้อมูลส่วนตัว</div>
                <p class="info-text">📚 รหัสนักศึกษา: <span class="highlight">69319010020</span></p>
                <p class="info-text">🎓 ระดับชั้น: <span class="highlight">HIT.1/1 (VB)</span></p>
                <p class="info-text">💻 สาขา: <span class="highlight">เทคโนโลยีสารสนเทศ</span></p>
            </div>

            <!-- ฝั่งขวา: ตารางฐานข้อมูล -->
            ${studentsHtml}
        </div>

        <!-- แถบด้านล่าง -->
        <div class="footer-bar">
            <div class="api-info">
                <strong>📡 API Endpoints:</strong> 
                GET <code>/api/students</code> | POST <code>/api/students</code>
            </div>

            <div class="status">🚀 เครื่องแม่ข่ายทำงานปกติแล้วนะคะ!</div>
        </div>
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
  console.log(`Server is running on port ${port}`);
});

process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});
