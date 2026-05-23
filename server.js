const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('fs/promises');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Створюємо папку для тимчасових файлів на Railway
const DOWNLOADS_DIR = './downloads';
if (!fs.existsSync(DOWNLOADS_DIR)){
    fs.mkdirSync(DOWNLOADS_DIR);
}

app.get('/', (req, res) => {
    res.json({ success: true, message: "Vibe Hard Drive Server Is Active! 💾🚀" });
});

// Ендпоінт, який приймає ВЖЕ РОЗПАРСЕНЕ посилання від твого локального yt-dlp
app.get('/cloud-download', async (req, res) => {
    const directUrl = req.query.direct_url;
    const format = req.query.format || 'mp3';

    if (!directUrl) {
        return res.status(400).json({ success: false, message: 'Немає прямого потоку!' });
    }

    console.log(`💾 Хмара завантажує потік на свій диск...`);

    const filename = `track_${Date.now()}.${format === 'mp3' ? 'mp3' : 'mp4'}`;
    const outputPath = `${DOWNLOADS_DIR}/${filename}`;

    // Скачуємо файл на диск Railway за допомогою curl всередині хмари
    exec(`curl -L "${directUrl}" -o "${outputPath}"`, (error) => {
        if (error) {
            console.error(`❌ Помилка скачування на диск хмари: ${error.message}`);
            return res.status(500).json({ success: false, message: 'Хмара не змогла зберегти файл' });
        }

        console.log(`✅ Файл успішно збережено на диск Railway: ${filename}`);

        // Віддаємо файл користувачу прямо з жорсткого диска Railway
        res.download(outputPath, filename, async (err) => {
            // Після того як користувач скачав файл, видаляємо його з диска Railway, щоб не забивати пам'ять
            try {
                await path.unlink(outputPath);
                console.log(`🧹 Тимчасовий файл видалено з хмари.`);
            } catch (cleanupError) {
                console.error(`Не вдалося видалити файл:`, cleanupError.message);
            }
        });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Дисковий сервер успішно запущено на порту ${PORT}`);
});
