const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const mime = require("mime-types");



dotenv.config();

const app = express();

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

const upload = multer({
  dest: "uploads/",
});

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

app.get("/", (req, res) => {
  res.send("AI Study Assistant Backend Running");
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an AI Study Assistant for engineering students. Explain concepts simply and clearly.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    res.json({
      reply: completion.choices[0].message.content,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Something went wrong",
    });
  }
});

app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  try {

    const dataBuffer = fs.readFileSync(req.file.path);

    const pdfData = await pdfParse(dataBuffer);

    const extractedText = pdfData.text;
    const userPrompt = req.body.prompt || "Summarize this PDF";

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",

      messages: [
        {
          role: "system",
          content:
            "You are an AI Study Assistant. Summarize uploaded study notes clearly for students.",
        },
        {
          role: "user",
          content: `
User Request:
${userPrompt}

PDF Content:
${extractedText}
`,
        },
      ],
    });

    fs.unlinkSync(req.file.path);

    res.json({
      summary: completion.choices[0].message.content,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "PDF processing failed",
    });
  }
});

app.post("/upload-image", upload.single("image"), async (req, res) => {

  try {

    const imagePath = req.file.path;
    

    const imageBuffer = fs.readFileSync(imagePath);

    const base64Image = imageBuffer.toString("base64");

    const mimeType = req.file.mimetype;

    const userPrompt =
  req.body.prompt ||
  "Explain this study-related image clearly";

    const completion = await openai.chat.completions.create({

      model: "openai/gpt-4o-mini",

      messages: [
        {
          role: "user",
          content: [
           {
  type: "text",
  text: userPrompt,
},
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    });

    fs.unlinkSync(imagePath);

    res.json({
      reply: completion.choices[0].message.content,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      error: "Image processing failed",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});