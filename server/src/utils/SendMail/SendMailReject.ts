import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const SendMailReject = async (email: string, post: string, reason: string): Promise<void> => {
    try {
        const accessToken = await oAuth2Client.getAccessToken();
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.EMAIL_USER,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken.token || '',
            },
        });

        await transport.sendMail({
            from: `"phongtro123" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Thông báo từ chối duyệt bài đăng',
            html: `
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { background-color: #e74c3c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; margin: -30px -30px 30px -30px; }
                    .content { line-height: 1.6; color: #333; }
                    .reason { background-color: #fff5f5; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0; }
                    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>Thông báo từ chối duyệt bài đăng</h2>
                    </div>
                    <div class="content">
                        <p>Xin chào,</p>
                        <p>Chúng tôi rất tiếc phải thông báo rằng bài đăng "<strong>${post}</strong>" của bạn đã không được duyệt.</p>
                        <div class="reason">
                            <strong>Lý do từ chối:</strong><br>
                            ${reason}
                        </div>
                        <p>Bạn có thể chỉnh sửa và đăng lại bài viết sau khi khắc phục các vấn đề trên.</p>
                        <p>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi.</p>
                    </div>
                    <div class="footer">
                        <p>Trân trọng,<br><strong>phongtro123</strong></p>
                    </div>
                </div>
            </body>
            </html>
            `,
        });
    } catch (error) {
        console.log('Error sending email:', error);
    }
};

export default SendMailReject;