// 1. เรียกใช้งาน Module ที่ชื่อว่า 'http' ซึ่งเป็นระบบพื้นฐานของ Node.js สำหรับทำเซิร์ฟเวอร์
const http = require('http');

// 2. กำหนดช่องทาง (Port) ที่เซิร์ฟเวอร์จะใช้สื่อสาร โดยให้ใช้ของที่ Cloud กำหนดมา(process.env.PORT) ถ้าไม่มีให้ใช้ 3000
const port = process.env.PORT || 3000;

// 3. สร้างเครื่องแม่ข่าย (Server) ที่คอยรับคำขอ (req) และตอบกลับ (res)
const server = http.createServer((req, res) => {

    // 3.1 ตั้งรหัสสถานะ 200 หมายถึง "ทำงานสำเร็จ (OK)"
    res.statusCode = 200;

    // 3.2 บอกเบราว์เซอร์ของผู้ใช้ว่า สิ่งที่ส่งกลับไปคือไฟล์ข้อความแบบ HTML และรองรับภาษาไทย (utf-8)
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    // 3.3 ส่งข้อมูลหน้าเว็บกลับไปหาผู้ใช้
    res.end(`
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minion Web Server</title>
    <style>
        body {
            background-color: #FCE144; /* สีเหลืองมินเนียน */
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            color: #333;
        }
        .card {
            background-color: white;
            border-radius: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            padding: 40px;
            text-align: center;
            max-width: 450px;
            width: 90%;
            border: 8px solid #23508C; /* สีกางเกงยีนส์มินเนียน */
            position: relative;
            overflow: hidden;
        }
        /* แถบสายรัดแว่นมินเนียนด้านบน */
        .goggle-strap {
            background-color: #222;
            height: 25px;
            width: 100%;
            position: absolute;
            top: 40px;
            left: 0;
        }
        /* แว่นตามินเนียน */
        .goggle {
            background-color: #E0E0E0;
            border: 8px solid #7F8C8D;
            border-radius: 50%;
            width: 70px;
            height: 70px;
            display: inline-block;
            position: relative;
            margin-top: 10px;
            z-index: 2;
            box-shadow: inset 0 0 10px rgba(0,0,0,0.2);
        }
        .pupil {
            background-color: #6F4E37; /* ตาเทา/น้ำตาล */
            border-radius: 50%;
            width: 25px;
            height: 25px;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
        .pupil::after {
            content: '';
            background-color: white;
            border-radius: 50%;
            width: 8px;
            height: 8px;
            position: absolute;
            top: 4px;
            left: 4px;
        }
        h1 {
            color: #23508C;
            margin-top: 25px;
            font-size: 1.8rem;
            margin-bottom: 10px;
        }
        .info-text {
            font-size: 1.1rem;
            margin: 5px 0;
            color: #555;
        }
        .highlight {
            color: #E67E22;
            font-weight: bold;
        }
        .status {
            background-color: #23508C;
            color: white;
            padding: 12px 25px;
            border-radius: 50px;
            display: inline-block;
            font-weight: bold;
            font-size: 1rem;
            margin-top: 20px;
            box-shadow: 0 4px 10px rgba(35, 80, 140, 0.3);
        }
        .bello {
            font-size: 1.5rem;
            font-weight: bold;
            color: #E67E22;
            margin: 10px 0;
        }
    </style>
</head>
<body>

    <div class="card">
        <div class="goggle-strap"></div>
        <div class="goggles-container">
            <div class="goggle"><div class="pupil"></div></div>
            <div class="goggle"><div class="pupil"></div></div>
        </div>
        
        <div class="bello">🍌 BELLO! 🍌</div>
        <h1>สวัสดีค่ะ Web Server ของ</h1>
        <h2 style="color: #23508C; margin: 0 0 15px 0; font-size: 1.5rem;">นางสาวกนกนันท์ ภูมาลา (อุ้ม)</h2>
        
        <p class="info-text">รหัสนักศึกษา: <span class="highlight">69319010020</span></p>
        <p class="info-text">ระดับชั้น: <span class="highlight">HIT.1/1 (VB)</span></p>
        <p class="info-text">สาขา: <span class="highlight">เทคโนโลยีสารสนเทศ</span></p>
        
        <p class="status">🚀 เครื่องแม่ข่ายทำงานปกติบนระบบ Railway แล้วนะคะ!</p>
    </div>

</body>
</html>
    `);

});

// 4. สั่งให้เซิร์ฟเวอร์เริ่มต้นเปิดรับฟังการเชื่อมต่อตาม Port ที่กำหนดไว้
server.listen(port, () => {
    console.log(`Server is running! เครื่องแม่ข่ายเปิดทำงานแล้วที่ช่องทาง: ${port}`);
});
