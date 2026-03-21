const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateReminder = async (tenantName, propertyName, rentAmount, dueDate) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Write a polite but firm rent reminder for a tenant named ${tenantName} who lives at ${propertyName}. Their rent of $${rentAmount} was due on ${dueDate}. Please encourage them to pay as soon as possible to avoid late fees. Keep it professional and helpful.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error("AI Reminder Generation Error:", err);
    return `Dear ${tenantName}, this is a reminder that your rent for ${propertyName} of $${rentAmount} was due on ${dueDate}. Please settle the payment at your earliest convenience.`;
  }
};

module.exports = { generateReminder };
