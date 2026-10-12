import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import { extractText } from '../utils/extractText.js';
import { buildPrompt } from '../utils/groqPrompt.js';
import { optionalAuth } from '../middleware/auth.js';
import db from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// --------------- Multer Config ---------------
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .pdf and .docx files are allowed'));
    }
  },
});

// --------------- Groq Client (lazy init) ---------------
let groq = null;

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set. Please add it to your .env file.');
  }
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

// --------------- POST /api/analyze ---------------
router.post('/analyze', optionalAuth, upload.single('resume'), async (req, res) => {
  const startTime = Date.now();

  try {
    const client = getGroqClient();
    // Validate inputs
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded. Please upload a PDF or DOCX file.' });
    }

    const targetRole = req.body.targetRole?.trim();
    if (!targetRole) {
      return res.status(400).json({ error: 'Target role is required.' });
    }

    const jobDescription = req.body.jobDescription?.trim() || '';

    // Extract text from resume
    console.log(`Extracting text from: ${req.file.originalname}`);
    const resumeText = await extractText(req.file.path);

    if (!resumeText || resumeText.length < 50) {
      return res.status(400).json({
        error: 'Could not extract meaningful text from the resume. Please ensure the file is not scanned/image-based.',
      });
    }

    console.log(` Extracted ${resumeText.length} characters from resume`);

    // Build prompt
    const { systemMessage, userMessage } = buildPrompt(resumeText, targetRole, jobDescription);

    // Call Groq API
    console.log(` Calling Groq API (openai/gpt-oss-120b) for role: "${targetRole}"...`);

    const chatCompletion = await client.chat.completions.create({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      model: 'openai/gpt-oss-120b',
      temperature: 0.3,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    });

    const rawContent = chatCompletion.choices[0]?.message?.content;

    if (!rawContent) {
      throw new Error('Empty response from Groq API');
    }

    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(rawContent);
    } catch (parseError) {
      console.error('Failed to parse Groq response as JSON:', rawContent.substring(0, 500));
      throw new Error('AI returned invalid JSON. Please try again.');
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(` Analysis complete in ${elapsed}s`);

    // Save to DB if user is authenticated
    let savedId = null;
    if (req.user) {
      try {
        const result = db
          .prepare(
            `INSERT INTO analyses (user_id, target_role, file_name, model, analysis)
             VALUES (?, ?, ?, ?, ?)`
          )
          .run(
            req.user.id,
            targetRole,
            req.file.originalname,
            'openai/gpt-oss-120b',
            JSON.stringify(analysis)
          );
        savedId = result.lastInsertRowid;
        console.log(` Analysis saved to DB (id=${savedId}) for user ${req.user.email}`);
      } catch (dbErr) {
        console.warn('Failed to save analysis to DB:', dbErr.message);
      }
    }

    // Return the analysis
    res.json({
      success: true,
      data: analysis,
      meta: {
        targetRole,
        fileName: req.file.originalname,
        analysisTime: `${elapsed}s`,
        model: 'openai/gpt-oss-120b',
        provider: 'Groq',
        savedId,
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);

    // Handle Groq-specific errors
    if (error?.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Groq free tier allows ~30 requests/min. Please wait a moment and try again.',
      });
    }

    if (error?.status === 401) {
      return res.status(500).json({
        error: 'Invalid Groq API key. Please check your GROQ_API_KEY in the .env file.',
      });
    }

    res.status(500).json({
      error: error.message || 'An unexpected error occurred during analysis.',
    });
  } finally {
    // Clean up uploaded file
    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.warn('Failed to clean up uploaded file:', err.message);
      });
    }
  }
});

// --------------- Multer Error Handler ---------------
router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5 MB.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  if (err.message === 'Only .pdf and .docx files are allowed') {
    return res.status(400).json({ error: err.message });
  }

  next(err);
});

export default router;
