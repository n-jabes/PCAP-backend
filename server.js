import express from 'express';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFilePaths = [
  path.join(__dirname, './files/list_subscribers_result_10.txt'),
  path.join(__dirname, './files/list_subscribers_result_12.txt'),
  path.join(__dirname, './files/list_subscribers_result_13.txt'),
  path.join(__dirname, './files/list_subscribers_result_14.txt'),
  // Add more file paths as needed
];

app.use(cors());

app.get('/api/subscriber-data', async (req, res) => {
  try {
    const allSubscribers = [];

    for (const filePath of inputFilePaths) {
      const data = await fsPromises.readFile(filePath, 'utf8');
      const subscribers = parseFileData(data);
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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
