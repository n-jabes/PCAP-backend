import xlsx from 'xlsx';
import fs from 'fs/promises';
// import { parseString } from 'xml2js';
// import { promisify } from 'util';
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

// New endpoint to upload and process locations file
app.post('/api/upload-locations', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }

  try {
    // Read the uploaded Excel file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    // Generate KML
    const kml = generateKML(jsonData);

    // Store KML in database
    const result = await db.collection('kml_locations').insertOne({
      filename: req.file.originalname,
      kml: kml,
      createdAt: new Date(),
    });

    res.status(200).json({
      message: 'Locations file processed and stored successfully',
      kmlId: result.insertedId,
    });
  } catch (error) {
    console.error('Error processing locations file:', error);
    res.status(500).send('Error processing locations file');
  }
});

// Function to generate KML from JSON data
function generateKML(locations) {
  let placemarksContent = '';

  locations.forEach((location) => {
    placemarksContent += `
    <Placemark>
      <name>${location['Site Name']}</name>
      <description>
        Core Location: ${location['Core Location']}
        MCC: ${location['MCC']}
        MNC: ${location['MNC']}
        LAC: ${location['LAC(*)']}
        RAC: ${location['RAC']}
        CI: ${location['CI(*)']}
        Sector Location: ${location['Sector Location']}
        Azimuth: ${location['Azimuth(*)']}
      </description>
      <Point>
        <coordinates>${location['Longitude']},${location['Latitude']},0</coordinates>
      </Point>
    </Placemark>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>2G Core Areas</name>
    <description>2G Core Areas in KML format</description>
    ${placemarksContent}
  </Document>
</kml>`;
}

// New endpoint to retrieve KML data
app.get('/api/kml/:id', async (req, res) => {
  try {
    const kmlDoc = await db.collection('kml_locations').findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!kmlDoc) {
      return res.status(404).send('KML not found');
    }

    res.set('Content-Type', 'application/vnd.google-earth.kml+xml');
    res.set(
      'Content-Disposition',
      `attachment; filename="${kmlDoc.filename}.kml"`
    );
    res.send(kmlDoc.kml);
  } catch (error) {
    console.error('Error retrieving KML:', error);
    res.status(500).send('Error retrieving KML');
  }
});

// Function to covert xlsx to js
// convertExcelToJs(
//   './files/core_areas/4G_core_areas.xlsx',
//   './files/core_areas/4G_core_areas.js'
// );

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
