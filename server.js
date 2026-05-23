const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080; 

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ success: true, message: "Vibe Proxy Downloader API is Active! 🚀" });
});

// Нова логіка: сервер сам проксіює потік, вирішуючи проблему помилки 403
app.get('/download', (req, res) => {
    const videoUrl = req.query.url;
    const format = req.query.format || 'mp3';

    if (!videoUrl) {
        return res.status(400).json({ success: false, message: 'Встав посилання на відео!' });
    }

    console.log(`📡 Хмарний проксі обробляє запит для: ${videoUrl}, формат: ${format}`);

    let ytDlpArgs = format === 'mp3' ? '-f "ba" -g' : `-f "bv*[height<=720]+ba/b[height<=720]" -g`;
    const command = `yt-dlp ${ytDlpArgs} "${videoUrl}"`;

    exec(command, (error, stdout) => {
        if (error) {
            console.error(`❌ Помилка yt-dlp: ${error.message}`);
            return res.status(500).json({ success: false, message: 'yt-dlp не зміг отримати лінк' });
        }

        const urls = stdout.trim().split('\n');
        const directUrl = urls[0];
        
        if (directUrl) {
            const filename = format === 'mp3' ? 'vibe_track.mp3' : 'vibe_video.mp4';
            
            // Заголовки, які змушують Chrome саме СКАЧАТИ файл, а не крутити плеєр
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : 'video/mp4');

            // Запускаємо внутрішній curl в Railway, який качає потік і відразу передає його користувачу
            const downloadStream = exec(`curl -L "${directUrl}"`);
            downloadStream.stdout.pipe(res);
        } else {
            res.status(500).json({ success: false, message: 'Не вдалося згенерувати потік' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер успішно запущено на порту ${PORT}`);
});
