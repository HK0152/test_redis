const express = require("express");
const redis = require("redis");

// Redisクライアントの作成（v4系）
const client = redis.createClient({
    url: 'redis://redis:6379'
});

const app = express();

// Redis接続状態を追跡
let isRedisConnected = false;

// webサーバ接続確認    
app.get("/", (req, res) => {
    res.send("Hello World");
});

// メッセージをキューに追加
app.get('/message', async (req, res) => {
    try {
        // Redis接続状態を確認
        if (!isRedisConnected) {
            return res.status(503).json({
                status: 503,
                error: "Redisに接続されていません"
            });
        }

        const message = req.query.message;

        if (!message) {
            return res.status(400).json({
                status: 400,
                error: "messageパラメータが必要です"
            });
        }

        // v4系では lPush を使用（大文字始まり）
        await client.lPush('message', message);

        res.status(200).json({
            status: 200,
            result: "メッセージキューに追加しました",
            message: message
        });
    } catch (error) {
        console.error('Redisエラー:', error);
        res.status(500).json({
            status: 500,
            error: "サーバーエラーが発生しました"
        });
    }
});

// 最新のメッセージ（0番目）を取得
app.get('/check_message', async (req, res) => {
    try {
        // Redis接続状態を確認
        if (!isRedisConnected) {
            return res.status(503).json({
                status: 503,
                error: "Redisに接続されていません"
            });
        }

        // v4系では lRange を使用（大文字始まり）
        const messages = await client.lRange('message', 0, 0);

        res.status(200).json({
            status: 200,
            result: messages
        });
    } catch (error) {
        console.error('Redisエラー:', error);
        res.status(500).json({
            status: 500,
            error: "サーバーエラーが発生しました"
        });
    }
});

// APIポート指定
const port = process.env.PORT || 3000;

// Redis接続確認後にサーバーを起動
async function startServer() {
    try {
        // v4系では connect() で接続
        await client.connect();
        isRedisConnected = true;
        console.log("Connected to Redis");

        // APIサーバ起動
        app.listen(port, () => {
            console.log("Express WebApi listening on port " + port);
        });
    } catch (err) {
        console.log("Error connecting to Redis:", err);
        process.exit(1);
    }
}

startServer();
