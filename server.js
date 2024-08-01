// import express from 'express';
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { exec } from 'child_process';
// import cors from 'cors';

// const app = express();
// const port = 3000;

// // Derive __dirname from import.meta.url
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const pcapFilePath = path.join(__dirname, 'Mypcap.pcap');
// const outputFilePath = path.join(__dirname, 'output.txt'); // Path for the output file

// // Full path to tshark executable
// const tsharkPath = `C:\\Program Files\\Wireshark\\tshark.exe`; // Update this path if necessary

// // Enable CORS
// app.use(cors());

// // Endpoint to read and parse the .pcap file using tshark
// app.get('/api/pcap-data', (req, res) => {
//   const command = `"${tsharkPath}" -r "${pcapFilePath}" -T json > "${outputFilePath}"`;

//   exec(command, (error, stdout, stderr) => {
//     if (error) {
//       res.status(500).send(`Error executing tshark: ${error.message}`);
//       return;
//     }
//     if (stderr) {
//       res.status(500).send(`Error: ${stderr}`);
//       return;
//     }

//     // Read the output file and send its content as response
//     fs.readFile(outputFilePath, 'utf8', (readError, data) => {
//       if (readError) {
//         res.status(500).send(`Error reading output file: ${readError.message}`);
//         return;
//       }

//       try {
//         //   const packets = JSON.parse(data).map(packet => {
//         //     console.log('array: ', packet._source?.layers)
//         //   const time = packet._source?.layers?.frame?.['frame.time'];
//         //   const callingPartyNumber = packet._source?.layers?.bicc?.['Parameter'];
//         //   return { time, callingPartyNumber };
//         // });
//         // res.json(packets);

//         const packets = JSON.parse(data);
//         if (packets.length > 0) {
//           const firstPacket = packets[0];
//           const biccData = firstPacket._source?.layers?.bicc;
//           console.log('first packet: ', firstPacket);

//           const time = firstPacket._source?.layers?.frame?.['frame.time'];

//           // Calling Party Number
//           const callingPartyNumber =
//             biccData?.[
//               'Parameter: (t=10, l=7) Calling party number: Calling party numberCalling Party Number: 933259422'
//             ]?.['isup.calling'];

//           // Called Party Number and Country Code
//           const calledPartyNumber =
//             biccData['Called Party NumberCalled Party Number: 244920200591F']?.[
//               'isup.called'
//             ];
//           const countryCode = calledPartyNumber
//             ? calledPartyNumber.slice(0, 3)
//             : null;

//           // MSISDN
//           const msisdn =
//             biccData['Called Party NumberCalled Party Number: 244920200591F']?.[
//               'isup.called_tree'
//             ]?.['e164.msisdn'];

//           // Location Number
//           const locationNumber =
//             biccData[
//               'Parameter: (t=63, l=8) Location number: Location numberLocation number: 244920043401'
//             ]?.['isup.location_number'];
//           const locationCountryCode = locationNumber
//             ? locationNumber.slice(0, 3)
//             : null;

//           res.json({
//             time,
//             callingPartyNumber,
//             calledPartyNumber,
//             countryCode,
//             msisdn,
//             locationNumber,
//             locationCountryCode,
//           });
//         }
//       } catch (parseError) {
//         res
//           .status(500)
//           .send(`Error parsing output file: ${parseError.message}`);
//       }
//     });
//   });
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process'; // used to execute the tshark command to read from .pcap and write to .txt
import cors from 'cors';

const app = express();
const port = 3000;

// Derive __dirname from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pcapFilePath = path.join(__dirname, 'Mypcap.pcap');
const outputFilePath = path.join(__dirname, 'output.txt'); // Path for the output file

// Full path to tshark executable
const tsharkPath = process.platform === 'win32' ? 'C:\\Program Files\\Wireshark\\tshark.exe' : '/usr/bin/tshark';

// Enable CORS
app.use(cors());

// Endpoint to read and parse the .pcap file using tshark
app.get('/api/pcap-data', (req, res) => {
  const command = `"${tsharkPath}" -r "${pcapFilePath}" -T json > "${outputFilePath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Error executing tshark: ${error.message}`);
      return;
    }
    if (stderr) {
      res.status(500).send(`Error: ${stderr}`);
      return;
    }

    // Read the output file and send its content as response
    fs.readFile(outputFilePath, 'utf8', (readError, data) => {
      if (readError) {
        res.status(500).send(`Error reading output file: ${readError.message}`);
        return;
      }

      try {
        const packets = JSON.parse(data);
        const formattedPackets = packets.map((packet) => {
          const biccData = packet._source?.layers?.bicc;
          const time = packet._source?.layers?.frame?.['frame.time'];

          // Safely access the properties
          const callingPartyNumber =
            biccData?.[
              'Parameter: (t=10, l=7) Calling party number: Calling party numberCalling Party Number: 933259422'
            ]?.['isup.calling'] || 'N/A';

          const calledPartyNumber =
            biccData?.[
              'Called Party NumberCalled Party Number: 244920200591F'
            ]?.['isup.called'] || 'N/A';

          const countryCode =
            calledPartyNumber !== 'N/A' ? calledPartyNumber.slice(0, 3) : 'N/A';

          const msisdn =
            biccData?.[
              'Called Party NumberCalled Party Number: 244920200591F'
            ]?.['isup.called_tree']?.['e164.msisdn'] || 'N/A';

          const locationNumber =
            biccData?.[
              'Parameter: (t=63, l=8) Location number: Location numberLocation number: 244920043401'
            ]?.['isup.location_number'] || 'N/A';

          const locationCountryCode =
            locationNumber !== 'N/A' ? locationNumber.slice(0, 3) : 'N/A';

          return {
            time: time || 'N/A',
            callingPartyNumber,
            calledPartyNumber,
            countryCode,
            msisdn,
            locationNumber,
            locationCountryCode,
          };
        });

        res.json(formattedPackets);
      } catch (parseError) {
        res
          .status(500)
          .send(`Error parsing output file: ${parseError.message}`);
      }
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
