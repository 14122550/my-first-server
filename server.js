// 1. เรียกใชงาน Module ที่ชื่อวา 'http' ซึ่งเปนระบบพื้นฐานของ Node.js สําหรับทําเซิรฟ เวอร
const http = require('http');

// 2. กําหนดชองทาง (Port) ที่เซิรฟเวอรจะใชสื่อสาร โดยใหใชของที่ Cloud กําหนดมา(process.env.PORT) ถาไมมีใหใช 3000
const port = process.env.PORT || 3000;

// 3. สรางเครื่องแมขาย (Server) ที่คอยรับคําขอ (req) และตอบกลับ (res)
const server = http.createServer((req, res) => {

// 3.1 ตั้งรหัสสถานะ 200 หมายถึง "ทํางานสําเร็จ (OK)"
res.statusCode = 200;

// 3.2 บอกเบราวเซอรของผูใชวา สิ่งที่สงกลับไปคือไฟลขอความแบบ HTML และรองรับภาษาไทย (utf-8)
res.setHeader('Content-Type', 'text/html; charset=utf-8');

// 3.3 สงขอมูลหนาเว็บกลับไปหาผูใช (*** ใหนักศึกษาแกชื่อ-นามสกุลตรงนี้ ***)
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
            font-size: 2rem;
        }
        .status {
            background-color: #23508C;
            color: white;
            padding: 12px 25px;
            border-radius: 50px;
            display: inline-block;
            font-weight: bold;
            font-size: 1.1rem;
            margin-top: 15px;
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
        <h2 style="color: #E67E22; margin: 0;">นางสาวกนกนันท์ ภูมาลา 69319010020</h2>
        
        <p class="status">🚀 เครื่องแม่ข่ายทำงานปกติบนระบบ Railway แล้วนะคะ!</p>
    </div>

</body>
</html>
`);

});

// 4. สั่งใหเซิรฟเวอรเริ่มตนเปดรับฟงการเชื่อมตอตาม Port ที่กําหนดไว
server.listen(port, () => {
console.log(`Server is running! เครื่องแม่ข่ายเปิดทำงานแล้วที่ช่องทาง: ${port}`);
});
