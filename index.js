const { Client } = require("@line/bot-sdk");
require("dotenv").config();
const moment = require("moment-timezone");

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new Client(config);

// 마디수와 사용자 기록을 저장할 변수 (일단 메모리 내에서만 사용)
let userMessageCount = {};  // { userId: { messageCount: number, lastUpdated: date } }

// 관리자의 userId (관리자가 받을 메시지)
const adminUserId = "98둘리🎃";  // 관리자의 LINE 사용자 ID로 설정

module.exports = async (req, res) => {
  // Webhook URL을 /webhook으로 설정해야 합니다.
  if (req.method === "POST") {
    try {
      const body = req.body;
      const events = body.events;

      for (let event of events) {
        if (event.type === "message" && event.message.type === "text") {
          const userId = event.source.userId;
          const messageText = event.message.text;
          const messageLength = messageText.length;

          const currentDate = moment().tz('Asia/Seoul').format('YYYY-MM-DD'); // 대한민국 시간 (KST)
          const userStats = userMessageCount[userId] || { messageCount: 0, lastUpdated: currentDate };

          // 하루가 변경되었으면 카운트 리셋
          if (userStats.lastUpdated !== currentDate) {
            userStats.messageCount = 0;
            userStats.lastUpdated = currentDate;
          }

          // 마디수 카운트 증가
          userStats.messageCount += messageLength;

          // 사용자의 메시지에 따라 응답을 다르게 처리
          if (messageText.includes("마디수") || messageText.includes("내 마디수")) {
            await client.replyMessage(event.replyToken, {
              type: "text",
              text: `오늘까지의 총 마디수: ${userStats.messageCount}`,
            });
          }

          // 하루가 새로 시작되면 관리자가 받을 수 있도록 마디수를 알려주기
          if (userStats.lastUpdated === currentDate && userStats.messageCount === messageLength) {
            await client.pushMessage(adminUserId, {
              type: "text",
              text: `새로운 하루가 시작되었어요! 어제까지의 마디수는 ${userStats.messageCount}였습니다.`,
            });
          }

          // 사용자 마디수 기록 업데이트
          userMessageCount[userId] = userStats;

          // 일반적인 메시지 처리 (메시지 보내는 코드)
          const replyMessage = `당신이 보낸 메시지의 마디수: ${messageLength} (오늘까지의 총 마디수: ${userStats.messageCount})`;
          await client.replyMessage(event.replyToken, { type: "text", text: replyMessage });
        }
      }

      return res.status(200).send('OK'); // 200 상태 코드 응답
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).send('Internal Server Error');
    }
  } else {
    res.status(405).send('Method Not Allowed'); // POST가 아닌 요청에 대해서는 405 오류 반환
  }
};