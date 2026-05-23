const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080; 

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ success: true, message: "Vibe Cloud Proxy Bypass Is Active! 🚀" });
});

app.get('/download', (req, res) => {
    let videoUrl = req.query.url;
    const format = req.query.format || 'mp3';

    if (!videoUrl) {
        return res.status(400).json({ success: false, message: 'Встав посилання!' });
    }

    // Очищаємо посилання від сміття (?si=...)
    if (videoUrl.includes('?')) videoUrl = videoUrl.split('?')[0];
    if (videoUrl.includes('&')) videoUrl = videoUrl.split('&')[0];

    console.log(`📡 Хмара Railway обробляє запит з обходом: ${videoUrl}`);

    // ХАК: Додаємо --geo-bypass та маскування під плеєр Android-додатка, щоб обдурити перевірку на бота
    const bypassArgs = '--geo-bypass --user-agent "Mozilla/5.0 (Android 15; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0" --no-warnings';
    let ytDlpArgs = format === 'mp3' ? `${bypassArgs} -f "ba" -g` : `${bypassArgs} -f "bv*[height<=720]+ba/b[height<=720]" -g`;
    
    const command = `yt-dlp ${ytDlpArgs} "${videoUrl}"`;

    exec(command, (error, stdout) => {
        const urls = stdout ? stdout.trim().split('\n') : [];
        const directUrl = urls[0];

        if (directUrl) {
            const filename = format === 'mp3' ? 'vibe_track.mp3' : 'vibe_video.mp4';
            
            // Заголовки примусового скачування
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : 'video/mp4');

            // Проксіюємо потік через внутрішній curl сервера
            const downloadStream = exec(`curl -L "${directUrl}"`);
            downloadStream.stdout.pipe(res);
        } else {
            console.error(`❌ Захист YouTube все одно відхилив запит хмари.`);
            res.status(500).json({ 
                success: false, 
                message: 'YouTube заблокував IP хмари. Якщо цей спосіб не спрацював, доведеться переходити на локальний Termux-сервер.' 
            });
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер успішно запущено на порту ${PORT}`);
});
