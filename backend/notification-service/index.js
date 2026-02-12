const express = require('express');
const { Kafka } = require('kafkajs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8006;

const kafka = new Kafka({
    clientId: 'notification-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});
const consumer = kafka.consumer({ groupId: 'notification-group' });

const sendPushNotification = async (userId, title, body) => {
    console.log(`🔔 Sending Push Notification to ${userId}: [${title}] ${body}`);
    // In production, call FCM or Apple Push Notification Service (APNS)
};

const run = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'messages', fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ message }) => {
            const { type, payload } = JSON.parse(message.value.toString());

            if (type === 'message_send') {
                const { senderId, content, conversationId } = payload;
                // Fetch participants from Chat Service and send push to non-senders
                console.log(`📩 Processing notification for new message in ${conversationId}`);
                await sendPushNotification('other_user_id', 'New Message', content);
            }
        }
    });
};

run().catch(console.error);

app.get('/health', (req, res) => res.json({ status: 'Notification Service is healthy' }));

app.listen(PORT, () => {
    console.log(`🔔 Notification Service running on port ${PORT}`);
});
