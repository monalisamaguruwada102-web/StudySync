const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testUpload() {
    console.log('Testing Upload Endpoint...');
    try {
        const filePath = path.join(__dirname, 'test_audio.txt'); // Dummy file, pretending to be supported or filtered?
        // Server filters for PDF or audio/* mimetype.
        // We'll rename it to .webm for the test passing multer extension check?
        // Server checks: file.mimetype.startsWith('audio/') OR application/pdf.
        // Form-data allows setting mimetype.

        fs.writeFileSync(filePath, 'dummy audio content');

        const form = new FormData();
        form.append('file', fs.createReadStream(filePath), {
            filename: 'test_audio.webm',
            contentType: 'audio/webm'
        });

        const response = await axios.post('http://localhost:3001/api/upload', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log('✅ Upload Success!');
        console.log('Status:', response.status);
        console.log('Data:', response.data);

        // Clean up
        fs.unlinkSync(filePath);

    } catch (error) {
        console.error('❌ Upload Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testUpload();
