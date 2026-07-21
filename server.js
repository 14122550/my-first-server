// 1. เรียกใช้งาน Module ที่ชื่อว่า 'http' ซึ่งเป็นระบบพื้นฐานของ Node.js สำหรับทำเซิร์ฟเวอร์
const http = require('http');

// 2. กำหนดช่องทาง (Port) ที่เซิร์ฟเวอร์จะใช้สื่อสาร โดยให้ใช้ของที่ Cloud กำหนดมา
const port = process.env.PORT || 3000;

// 3. สร้างเครื่องแม่ข่าย (Server) ที่คอยรับคำขอ (req) และตอบกลับ (res)
const server = http.createServer((req, res) => {

    // 3.1 ตั้งรหัสสถานะ 200 หมายถึง "ทำงานสำเร็จ (OK)"
    res.statusCode = 200;

    // 3.2 บอกเบราว์เซอร์ของผู้ใช้ว่า สิ่งที่ส่งกลับไปคือไฟล์ข้อความแบบ HTML แบบ UTF-8
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
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        /* พื้นหลังแบบเคลื่อนไหว */
        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        @keyframes floatingBubbles {
            0% {
                transform: translateY(100vh) translateX(0);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateY(-100vh) translateX(100px);
                opacity: 0;
            }
        }

        @keyframes twinkling {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
        }

        body {
            background: linear-gradient(-45deg, #FCE144, #FFF44F, #FFD700, #FFA500);
            background-size: 400% 400%;
            animation: gradientShift 15s ease infinite;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: #333;
            position: relative;
            overflow: hidden;
        }

        /* ฟองลอยแบบเคลื่อนไหว */
        .bubble {
            position: absolute;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.1));
            animation: floatingBubbles linear infinite;
            pointer-events: none;
        }

        .bubble:nth-child(1) {
            width: 80px;
            height: 80px;
            left: 10%;
            animation-duration: 8s;
            animation-delay: 0s;
        }

        .bubble:nth-child(2) {
            width: 60px;
            height: 60px;
            left: 20%;
            animation-duration: 10s;
            animation-delay: 2s;
        }

        .bubble:nth-child(3) {
            width: 100px;
            height: 100px;
            left: 30%;
            animation-duration: 12s;
            animation-delay: 4s;
        }

        .bubble:nth-child(4) {
            width: 70px;
            height: 70px;
            left: 50%;
            animation-duration: 9s;
            animation-delay: 1s;
        }

        .bubble:nth-child(5) {
            width: 90px;
            height: 90px;
            left: 70%;
            animation-duration: 11s;
            animation-delay: 3s;
        }

        .bubble:nth-child(6) {
            width: 50px;
            height: 50px;
            left: 80%;
            animation-duration: 10s;
            animation-delay: 2.5s;
        }

        /* ดาวเรืองแสงเคลื่อนไหว */
        .star {
            position: absolute;
            color: #FFD700;
            font-size: 20px;
            animation: twinkling 3s infinite;
            pointer-events: none;
        }

        .card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 30px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2), 0 0 40px rgba(255, 215, 0, 0.3);
            padding: 50px 40px;
            text-align: center;
            max-width: 500px;
            width: 90%;
            border: 8px solid #23508C;
            position: relative;
            z-index: 10;
            animation: cardFloat 3s ease-in-out infinite;
            transform: translateY(0);
        }

        @keyframes cardFloat {
            0%, 100% {
                transform: translateY(0px);
            }
            50% {
                transform: translateY(-15px);
            }
        }

        /* แถบสายรัดแว่นมินเนียนด้านบน */
        .goggle-strap {
            background: linear-gradient(90deg, #222, #444, #222);
            height: 25px;
            width: 100%;
            position: absolute;
            top: 40px;
            left: 0;
            animation: goggleStrapPulse 2s ease-in-out infinite;
        }

        @keyframes goggleStrapPulse {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(1.1); }
        }

        /* เนื้อที่ใส่แว่น */
        .goggles-container {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 10px;
            position: relative;
            z-index: 1;
        }

        /* แว่นตามินเนียน */
        .goggle {
            background: radial-gradient(circle at 30% 30%, #F0F0F0, #D0D0D0);
            border: 8px solid #7F8C8D;
            border-radius: 50%;
            width: 80px;
            height: 80px;
            display: inline-flex;
            justify-content: center;
            align-items: center;
            position: relative;
            box-shadow: inset -5px -5px 15px rgba(0, 0, 0, 0.2), 0 10px 25px rgba(0, 0, 0, 0.1);
            animation: goggleFloat 3s ease-in-out infinite;
        }

        .goggle:nth-child(1) {
            animation-delay: 0s;
        }

        .goggle:nth-child(2) {
            animation-delay: 0.2s;
        }

        @keyframes goggleFloat {
            0%, 100% {
                transform: translateY(0px) rotateZ(0deg);
            }
            50% {
                transform: translateY(-10px) rotateZ(5deg);
            }
        }

        .pupil {
            background: radial-gradient(circle at 35% 35%, #8B4513, #6F4E37);
            border-radius: 50%;
            width: 30px;
            height: 30px;
            position: relative;
            box-shadow: inset -2px -2px 5px rgba(0, 0, 0, 0.3);
            animation: eyeLook 4s ease-in-out infinite;
        }

        @keyframes eyeLook {
            0%, 100% {
                transform: translate(0, 0);
            }
            25% {
                transform: translate(8px, 0);
            }
            50% {
                transform: translate(0, 8px);
            }
            75% {
                transform: translate(-8px, 0);
            }
        }

        .pupil::after {
            content: '';
            background-color: white;
            border-radius: 50%;
            width: 10px;
            height: 10px;
            position: absolute;
            top: 6px;
            left: 6px;
            box-shadow: inset -1px -1px 3px rgba(0, 0, 0, 0.2);
        }

        h1 {
            color: #23508C;
            margin-top: 20px;
            font-size: 2rem;
            margin-bottom: 5px;
            animation: textGlow 2s ease-in-out infinite;
            text-shadow: 0 0 10px rgba(35, 80, 140, 0.3);
        }

        @keyframes textGlow {
            0%, 100% {
                text-shadow: 0 0 10px rgba(35, 80, 140, 0.3);
            }
            50% {
                text-shadow: 0 0 20px rgba(35, 80, 140, 0.6);
            }
        }

        h2 {
            color: #23508C;
            margin: 5px 0 20px 0;
            font-size: 1.6rem;
            font-weight: 700;
            background: linear-gradient(135deg, #23508C, #E67E22);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: nameShine 3s ease-in-out infinite;
        }

        @keyframes nameShine {
            0%, 100% {
                filter: brightness(1);
            }
            50% {
                filter: brightness(1.2);
            }
        }

        .info-section {
            background: linear-gradient(135deg, rgba(35, 80, 140, 0.05), rgba(230, 126, 34, 0.05));
            padding: 20px;
            border-radius: 20px;
            margin: 20px 0;
            border-left: 5px solid #E67E22;
            animation: slideIn 0.8s ease-out;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .info-text {
            font-size: 1.1rem;
            margin: 8px 0;
            color: #555;
            font-weight: 500;
        }

        .highlight {
            color: #E67E22;
            font-weight: bold;
            font-size: 1.15rem;
            background: linear-gradient(135deg, #FFD700, #FFA500);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% {
                filter: drop-shadow(0 0 0px rgba(230, 126, 34, 0.5));
            }
            50% {
                filter: drop-shadow(0 0 10px rgba(230, 126, 34, 0.8));
            }
        }

        .status {
            background: linear-gradient(135deg, #23508C 0%, #1a3a5c 100%);
            color: white;
            padding: 15px 30px;
            border-radius: 50px;
            display: inline-block;
            font-weight: bold;
            font-size: 1.1rem;
            margin-top: 20px;
            box-shadow: 0 8px 20px rgba(35, 80, 140, 0.4);
            animation: bounce 2s ease-in-out infinite;
            position: relative;
            overflow: hidden;
        }

        .status::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            animation: shine 3s infinite;
        }

        @keyframes shine {
            0% { left: -100%; }
            100% { left: 100%; }
        }

        @keyframes bounce {
            0%, 100% {
                transform: translateY(0);
            }
            50% {
                transform: translateY(-10px);
            }
        }

        .bello {
            font-size: 2rem;
            font-weight: bold;
            color: #E67E22;
            margin: 15px 0;
            animation: rotate 2s ease-in-out infinite;
        }

        @keyframes rotate {
            0%, 100% {
                transform: rotate(0deg) scale(1);
            }
            50% {
                transform: rotate(10deg) scale(1.1);
            }
        }

        /* Responsive */
        @media (max-width: 600px) {
            .card {
                padding: 35px 25px;
            }

            h1 {
                font-size: 1.6rem;
            }

            h2 {
                font-size: 1.3rem;
            }

            .info-text {
                font-size: 1rem;
            }

            .goggle {
                width: 70px;
                height: 70px;
            }
        }
    </style>
</head>
<body>
    <!-- ฟองลอยแบบเคลื่อนไหว -->
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
