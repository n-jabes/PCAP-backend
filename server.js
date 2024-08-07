
import express from 'express';
import { MongoClient, GridFSBucket } from 'mongodb';
import multer from 'multer';
import { Readable } from 'stream';
import cors from 'cors';
import dotenv from 'dotenv';
import { convertExcelToJs } from './excelToJSON.js';
dotenv.config();

const app = express();
const port = 3000;

const mongoUrl = process.env.MONGO_URL;
const dbName = 'LocationUpdateSubscriberFiles';
// console.log('MONGO_URL:', process.env.MONGO_URL);

let db;
let bucket;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
MongoClient.connect(mongoUrl, { useUnifiedTopology: true })
  .then((client) => {
    console.log('Connected to MongoDB');
    db = client.db(dbName);
    bucket = new GridFSBucket(db);
  })
  .catch((error) => console.error('Error connecting to MongoDB:', error));

// Multer setup for file upload
const upload = multer({ storage: multer.memoryStorage() });

// Endpoint to upload a file
app.post(
  '/api/upload-subscriber-file',
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }

    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);

    const uploadStream = bucket.openUploadStream(req.file.originalname);

    readableStream.pipe(uploadStream);

    uploadStream.on('error', () => {
      return res.status(500).send('Error uploading file');
    });

    uploadStream.on('finish', () => {
      return res.status(200).send('File uploaded successfully');
    });
  }
);

// Endpoint to retrieve and parse data from all files
app.get('/api/subscriber-data', async (req, res) => {
  try {
    const files = await bucket.find().toArray();
    const allSubscribers = [];

    for (const file of files) {
      const downloadStream = bucket.openDownloadStream(file._id);
      let fileContent = '';

      for await (const chunk of downloadStream) {
        fileContent += chunk.toString('utf8');
      }

      const subscribers = parseFileData(fileContent);
      allSubscribers.push(...subscribers);
    }

    res.json(allSubscribers);
  } catch (error) {
    res.status(500).send(`Error processing files: ${error.message}`);
  }
});

function parseFileData(data) {
  const lines = data.split('\n');
  const headerIndex = lines.findIndex((line) => line.startsWith('IMSI'));
  const statisticsIndex = lines.findIndex((line) =>
    line.includes('Subscriber statistics')
  );

  const dataLines = lines.slice(
    headerIndex + 1,
    statisticsIndex !== -1 ? statisticsIndex : undefined
  );

  const startTimeLine = lines.find((line) => line.startsWith('Start time:'));
  const startTime = startTimeLine ? startTimeLine.split(': ')[1].trim() : '';

  return dataLines
    .filter((line) => line.trim() !== '' && !line.startsWith('---'))
    .map((line) => {
      const [
        IMSI,
        MSISDN,
        IMEI,
        AP,
        DP,
        R,
        LteM,
        MM,
        NB,
        RANId,
        Location,
        UeUsageType,
        HssRealm,
        HssResetId,
      ] = line.split(/\s+/);

      return {
        time: startTime,
        IMSI,
        MSISDN,
        IMEI,
        AP,
        DP,
        R,
        LteM,
        MM,
        NB,
        RANId,
        Location,
        UeUsageType,
        HssRealm,
        HssResetId,
      };
    });
}

// |Function to convert a certain excel file into a json file
// const inputPath = 'D:\\work\\Ernest\\server\\files\\core_areas\\2G_core_areas.xls';
// const outputPath = 'D:\\work\\Ernest\\server\\files\\core_areas\\2G_core_areas.js';
// convertExcelToJs(inputPath, outputPath);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
