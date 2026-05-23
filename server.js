const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// МАГІЯ БЕЗПЕКИ: Сервер візьме токен із налаштувань Railway
const API_KEY = process.env.VIDEO_API_KEY;

app.get('/', (req, res) => {
    res.json({ success: true, message: "Vibe Universal API Bridge Ready! 👑" });
});

app.get('/download', async (req, res) => {
    const videoUrl = req.query.url;
    const format = req.query.format || 'mp3';

    if (!videoUrl) return res.status(400).json({ success: false, message: 'Встав лінк!' });
    if (!API_KEY) return res.status(500).json({ success: false, message: 'Помилка конфігурації: Токен не знайдено в Railway!' });

    try {
        const encodedUrl = encodeURIComponent(videoUrl);
        const targetUrl = `https://p.savenow.to/ajax/download.php?format=${format}&url=${encodedUrl}&add_info=1&apikey=${API_KEY}`;
        
        const response = await fetch(targetUrl);
        const data = await response.json();
        
        res.json(data);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.get('/progress', async (req, res) => {
    const progressUrl = req.query.url;
    if (!progressUrl) return res.status(400).json({ success: false, message: 'Немає URL для перевірки' });

    try {
        const response = await fetch(progressUrl);
        const data = await response.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер працює на порту ${PORT}`);
});
