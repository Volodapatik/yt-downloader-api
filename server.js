const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
// Railway автоматично видає порт через змінну оточення PROCESS.ENV.PORT
const PORT = process.env.PORT || 8080; 

app.use(cors());
app.use(express.json());

// Базовий ендпоінт для перевірки працездатності сервера
app.get('/', (req, res) => {
    res.json({ success: true, message: "Vibe Downloader API Is Active on Railway! 🚀" });
});

// Головний ендпоінт для витягування посилань
app.get('/download', (req, res) => {
    const videoUrl = req.query.url;
    const format = req.query.format || 'mp3';

    if (!videoUrl) {
        return res.status(400).json({ success: false, message: 'Встав посилання на відео!' });
    }

    console.log(`📡 Хмара Railway обробляє запит для: ${videoUrl}, формат: ${format}`);

    let ytDlpArgs = '';
    if (format === 'mp3') {
        ytDlpArgs = '-f "ba" -g';
    } else {
        ytDlpArgs = `-f "bv*[height<=${format}]+ba/b[height<=${format}]" -g`;
    }

    const command = `yt-dlp ${ytDlpArgs} "${videoUrl}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Помилка yt-dlp: ${error.message}`);
            return res.status(500).json({ success: false, message: 'yt-dlp не зміг обробити лінк у хмарі', error: error.message });
        }

        const urls = stdout.trim().split('\n');
        
        if (urls.length > 0) {
            res.json({
                success: true,
                download_url: urls[0]
            });
        } else {
            res.status(500).json({ success: false, message: 'Не вдалося згенерувати посилання' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер успішно запущено на порту ${PORT}`);
});
