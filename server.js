import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFilePath = path.join(__dirname, 'list_subscribers_result_10.txt');

app.use(cors());

app.get('/api/subscriber-data', (req, res) => {
  fs.readFile(inputFilePath, 'utf8', (readError, data) => {
    if (readError) {
      res.status(500).send(`Error reading input file: ${readError.message}`);
      return;
    }

    try {
      const lines = data.split('\n');
      const headerIndex = lines.findIndex((line) => line.startsWith('IMSI'));
      const statisticsIndex = lines.findIndex((line) =>
        line.includes('Subscriber statistics')
      );

      // If statisticsIndex is not found, use the entire rest of the file
      const dataLines = lines.slice(
        headerIndex + 1,
        statisticsIndex !== -1 ? statisticsIndex : undefined
      );

      // Extract the start time from the file
      const startTimeLine = lines.find((line) =>
        line.startsWith('Start time:')
      );
      const startTime = startTimeLine
        ? startTimeLine.split(': ')[1].trim()
        : '';

      const subscribers = dataLines
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

      res.json(subscribers);
    } catch (parseError) {
      res.status(500).send(`Error parsing input file: ${parseError.message}`);
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
