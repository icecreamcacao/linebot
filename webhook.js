const { Client, middleware } = require("@line/bot-sdk");
require("dotenv").config();

const client = new Client({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
});

module.exports = async function (req, res) {
  // HTTP 메소드가 POST가 아니면 405 반환
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const body = req.body; // event.body를 body로 수정
    const events = body.events;

    // 각 이벤트를 순차적으로 처리
    for (let event of events) {
      if (event.type === "message" && event.message.type === "text") {
        const replyToken = event.replyToken;
        const message = {
          type: "text",
          text: `당신이 보낸 메시지: ${event.message.text}`,
        };

        await client.replyMessage(replyToken, message);
      }
    }

    return res.status(200).send("OK"); // HTTP 200 상태 코드로 응답
  } catch (error) {
    return res.status(500).send(`Internal Server Error: ${error.message}`);
  }
};