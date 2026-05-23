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

app.get('/download', (req, res) => {
    let videoUrl = req.query.url;
    const format = req.query.format || 'mp3';

    if (!videoUrl) {
        return res.status(400).json({ success: false, message: 'Встав посилання на відео!' });
    }

    // Хак: Очищаємо посилання від сміття типу ?si=... або &feature=...
    if (videoUrl.includes('?')) {
        videoUrl = videoUrl.split('?')[0];
    }
    if (videoUrl.includes('&')) {
        videoUrl = videoUrl.split('&')[0];
    }

    console.log(`📡 Хмарний проксі обробляє очищений лінк: ${videoUrl}, формат: ${format}`);

    // Додаємо прапори --no-warnings, щоб дрібні варнінги не ламали процес виконання команди exec
    let ytDlpArgs = format === 'mp3' ? '--no-warnings -f "ba" -g' : `--no-warnings -f "bv*[height<=720]+ba/b[height<=720]" -g`;
    const command = `yt-dlp ${ytDlpArgs} "${videoUrl}"`;

    exec(command, (error, stdout) => {
        // Якщо є помилка, але при цьому stdout не порожній (лінк все одно прийшов), ігноруємо помилку
        const urls = stdout ? stdout.trim().split('\n') : [];
        const directUrl = urls[0];

        if (!directUrl && error) {
            console.error(`❌ Критична помилка yt-dlp: ${error.message}`);
            return res.status(500).json({ success: false, message: 'yt-dlp не зміг отримати лінк з серверів YouTube' });
        }

        if (directUrl) {
            const filename = format === 'mp3' ? 'vibe_track.mp3' : 'vibe_video.mp4';
            
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : 'video/mp4');

            // Транслюємо потік через curl
            const downloadStream = exec(`curl -L "${directUrl}"`);
            downloadStream.stdout.pipe(res);
        } else {
            res.status(500).json({ success: false, message: 'Не вдалося згенерувати потік медіа' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер успішно запущено на порту ${PORT}`);
});
