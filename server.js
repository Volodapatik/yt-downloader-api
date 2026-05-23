const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('fs/promises');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const DOWNLOADS_DIR = './downloads';
if (!fs.existsSync(DOWNLOADS_DIR)){
    fs.mkdirSync(DOWNLOADS_DIR);
}

app.get('/', (req, res) => {
    res.json({ success: true, message: "TuneBox Clone API 24/7 Active! 💾🚀" });
});

// Головний ендпоінт для завантаження
app.get('/download', async (req, res) => {
    let videoUrl = req.query.url;
    const format = req.query.format || 'mp3';

    if (!videoUrl) return res.status(400).json({ success: false, message: 'Встав лінк!' });

    // Витягуємо ID відео
    let videoId = "";
    if (videoUrl.includes('v=')) {
        videoId = videoUrl.split('v=')[1].split('&')[0];
    } else if (videoUrl.includes('youtu.be/')) {
        videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
    } else {
        videoId = videoUrl.substring(videoUrl.lastIndexOf('/') + 1);
    }

    console.log(`📡 Отримано запит для відео ID: ${videoId}`);

    try {
        // Крок 1: Беремо відкрите стабільне дзеркало Invidious, яке не банить Railway
        const invidiousInstance = "https://invidious.nerdvpn.de"; 
        const apiUrl = `${invidiousInstance}/api/v1/videos/${videoId}`;

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Invidious дзеркало не відповіло");
        
        const data = await response.json();
        
        // Крок 2: Шукаємо чистий аудіопотік або відеопотік
        let directUrl = "";
        if (format === 'mp3') {
            const audioStream = data.adaptiveFormats?.find(f => f.type.includes('audio/webm') || f.type.includes('audio/mp4'));
            directUrl = audioStream ? audioStream.url : null;
        } else {
            const videoStream = data.formatStreams?.find(f => f.quality === '720p' || f.quality === '360p');
            directUrl = videoStream ? videoStream.url : null;
        }

        if (!directUrl) {
            throw new Error("Не вдалося знайти пряме посилання на потік");
        }

        console.log(`💾 Потік знайдено. Починаємо скачування на жорсткий диск Railway...`);

        const filename = `vibe_${videoId}_${Date.now()}.${format === 'mp3' ? 'mp3' : 'mp4'}`;
        const outputPath = `${DOWNLOADS_DIR}/${filename}`;

        // Крок 3: Записуємо файл на диск хмари через curl (як у TuneBox)
        exec(`curl -L "${directUrl}" -o "${outputPath}"`, (error) => {
            if (error) {
                console.error(`❌ Помилка curl: ${error.message}`);
                return res.status(500).json({ success: false, message: 'Помилка запису на диск хмари' });
            }

            console.log(`✅ Файл на диску хмари! Віддаємо користувачу: ${filename}`);

            // Крок 4: Стрімимо готовий файл з диска прямо в телефон (ОБХІД ПОМИЛКИ 403)
            res.download(outputPath, filename, async (err) => {
                try {
                    await path.unlink(outputPath);
                    console.log(`扫 Тимчасовий файл видалено з диска хмари.`);
                } catch (cleanupError) {
                    console.error(`Не вдалося видалити файл:`, cleanupError.message);
                }
            });
        });

    } catch (e) {
        console.error(`❌ Помилка бекенду:`, e.message);
        res.status(500).json({ success: false, message: e.message || 'Помилка сервера' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер TuneBox-style запущено на порту ${PORT}`);
});
