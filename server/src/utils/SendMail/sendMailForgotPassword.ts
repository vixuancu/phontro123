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

const SendMailForgotPassword = async (email: string, otp: string): Promise<void> => {
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
            subject: 'Mã OTP đặt lại mật khẩu',
            html: `
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { background-color: #3498db; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; margin: -30px -30px 30px -30px; }
                    .content { line-height: 1.6; color: #333; text-align: center; }
                    .otp { background-color: #f8f9fa; border: 2px solid #3498db; padding: 20px; margin: 20px 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3498db; border-radius: 8px; }
                    .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; color: #856404; }
                    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>Đặt lại mật khẩu</h2>
                    </div>
                    <div class="content">
                        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản phongtro123.</p>
                        <p>Mã OTP của bạn là:</p>
                        <div class="otp">${otp}</div>
                        <div class="warning">
                            <strong>Lưu ý:</strong> Mã OTP này có hiệu lực trong 10 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.
                        </div>
                        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
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

export default SendMailForgotPassword;