const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI('AIzaSyByISdNYHb8BPY-nSXARR2B30UyANF8QJw');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const modelPost = require('../../models/post.model');
async function askQuestion(question) {
    try {
        const products = await modelPost.find({});
        const productData = products.map((product) => `Tên ${product.title}, Giá : ${product.price}`).join('\n');

        const prompt = `
         Bạn là một trợ lý bán hàng chuyên nghiệp. 
        Đây là danh sách sản phẩm hiện có trong cửa hàng:
        ${productData}

        câu hỏi của khách hàng ${question}
        Hãy trả lời một cách tự nhiên và thân thiện
        `;

        const result = await model.generateContent(prompt);
        const answer = result.response.text();
        return answer;
    } catch (error) {
        console.log(error);
    }
}

module.exports = { askQuestion };
