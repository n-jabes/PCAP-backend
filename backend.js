

// 
// 
// 
// THIS IS THE BACKUP FOR THE CODES I USED WHEN WORKING WITH .PCAP FILES
// 
// 
// 
// 
// 
// 



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
const tsharkPath = 'C:\\Program Files\\Wireshark\\tshark.exe';

// Enable CORS
app.use(cors());

// Endpoint to read and parse the .pcap file using tshark
app.get('/api/pcap-data', (req, res) => {
  // const command = `"${tsharkPath}" -r "${pcapFilePath}" -T json > "${outputFilePath}"`;
  const command = `"${tsharkPath}" -r "${pcapFilePath}" -T json`;

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
        const packets = JSON.parse(stdout);
        const formattedPackets = packets.map((packet) => {
          const biccData = packet._source?.layers?.bicc;
          const time = packet._source?.layers?.frame?.['frame.time'];

          // Safely access the properties
          const callingPartyNumber =
            biccData?.[
              'Parameter: (t=10, l=7) Calling party number: Calling party numberCalling Party Number: 933259422'
            ]?.['isup.calling'] || '';

          const calledPartyNumber =
            biccData?.[
              'Called Party NumberCalled Party Number: 244920200591F'
            ]?.['isup.called'] || '';

          const countryCode =
            calledPartyNumber !== 'N/A' ? calledPartyNumber.slice(0, 3) : '';

          const msisdn =
            biccData?.[
              'Called Party NumberCalled Party Number: 244920200591F'
            ]?.['isup.called_tree']?.['e164.msisdn'] || '';

          const locationNumber =
            biccData?.[
              'Parameter: (t=63, l=8) Location number: Location numberLocation number: 244920043401'
            ]?.['isup.location_number'] || '';

          const locationCountryCode =
            locationNumber !== 'N/A' ? locationNumber.slice(0, 3) : '';

          return {
            time: time || '',
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

  // Read the output file and send its content as response
  // fs.readFile(outputFilePath, 'utf8', (readError, data) => {
  //   if (readError) {
  //     res.status(500).send(`Error reading output file: ${readError.message}`);
  //     return;
  //   }

  //   try {
  //     const packets = JSON.parse(data);
  //     const formattedPackets = packets.map((packet) => {
  //       const biccData = packet._source?.layers?.bicc;
  //       const time = packet._source?.layers?.frame?.['frame.time'];

  //       // Safely access the properties
  //       const callingPartyNumber =
  //         biccData?.[
  //           'Parameter: (t=10, l=7) Calling party number: Calling party numberCalling Party Number: 933259422'
  //         ]?.['isup.calling'] || '';

  //       const calledPartyNumber =
  //         biccData?.['Called Party NumberCalled Party Number: 244920200591F']?.[
  //           'isup.called'
  //         ] || '';

  //       const countryCode =
  //         calledPartyNumber !== 'N/A' ? calledPartyNumber.slice(0, 3) : '';

  //       const msisdn =
  //         biccData?.['Called Party NumberCalled Party Number: 244920200591F']?.[
  //           'isup.called_tree'
  //         ]?.['e164.msisdn'] || '';

  //       const locationNumber =
  //         biccData?.[
  //           'Parameter: (t=63, l=8) Location number: Location numberLocation number: 244920043401'
  //         ]?.['isup.location_number'] || '';

  //       const locationCountryCode =
  //         locationNumber !== 'N/A' ? locationNumber.slice(0, 3) : '';

  //       return {
  //         time: time || '',
  //         callingPartyNumber,
  //         calledPartyNumber,
  //         countryCode,
  //         msisdn,
  //         locationNumber,
  //         locationCountryCode,
  //       };
  //     });

  //     res.json(formattedPackets);
  //   } catch (parseError) {
  //     res.status(500).send(`Error parsing output file: ${parseError.message}`);
  //   }
  // });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});










// // Reading directly from the .pcap file

// import express from 'express';
// import { exec } from 'child_process'; // used to execute the tshark command to read from .pcap and write to .txt
// import cors from 'cors';
// import { fileURLToPath } from 'url';
// import path from 'path';

// const app = express();
// const port = 3000;

// // Derive __dirname from import.meta.url
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const pcapFilePath = path.join(__dirname, 'Mypcap.pcap');

// // Full path to tshark executable
// const tsharkPath = 'C:\\Program Files\\Wireshark\\tshark.exe';

// // Enable CORS
// app.use(cors());

// // Endpoint to read and parse the .pcap file using tshark
// app.get('/api/pcap-data', (req, res) => {
//   const command = `"${tsharkPath}" -r "${pcapFilePath}" -T json`;

//   exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
//     // Increase buffer size to 10MB
//     if (error) {
//       res.status(500).send(`Error executing tshark: ${error.message}`);
//       return;
//     }
//     if (stderr) {
//       res.status(500).send(`Error: ${stderr}`);
//       return;
//     }

//     try {
//       const packets = JSON.parse(stdout);
//       const formattedPackets = packets.map((packet) => {
//         const biccData = packet._source?.layers?.bicc;
//         const time = packet._source?.layers?.frame?.['frame.time'];

//         // Safely access the properties
//         const callingPartyNumber =
//           biccData?.[
//             'Parameter: (t=10, l=7) Calling party number: Calling party numberCalling Party Number: 933259422'
//           ]?.['isup.calling'] || '';

//         const calledPartyNumber =
//           biccData?.['Called Party NumberCalled Party Number: 244920200591F']?.[
//             'isup.called'
//           ] || '';

//         const countryCode =
//           calledPartyNumber !== 'N/A' ? calledPartyNumber.slice(0, 3) : '';

//         const msisdn =
//           biccData?.['Called Party NumberCalled Party Number: 244920200591F']?.[
//             'isup.called_tree'
//           ]?.['e164.msisdn'] || '';

//         const locationNumber =
//           biccData?.[
//             'Parameter: (t=63, l=8) Location number: Location numberLocation number: 244920043401'
//           ]?.['isup.location_number'] || '';

//         const locationCountryCode =
//           locationNumber !== 'N/A' ? locationNumber.slice(0, 3) : '';

//         return {
//           time: time || '',
//           callingPartyNumber,
//           calledPartyNumber,
//           countryCode,
//           msisdn,
//           locationNumber,
//           locationCountryCode,
//         };
//       });

//       res.json(formattedPackets);
//     } catch (parseError) {
//       res
//         .status(500)
//         .send(`Error parsing tshark output: ${parseError.message}`);
//     }
//   });
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });





// // connecting to the database

// import express from 'express';
// import mongoose from 'mongoose';
// import multer from 'multer';
// import { exec } from 'child_process';
// import cors from 'cors';
// import { fileURLToPath } from 'url';
// import path from 'path';
// import fs from 'fs';
// import PcapFile from './models/PcapFile.js';

// const app = express();
// const port = 3000;

// // MongoDB connection with better error handling and logging
// mongoose
//   .connect(
//     'mongodb+srv://jabes:nshtui42@jabesdatabases.cthh7.mongodb.net/PcapStorage?retryWrites=true&w=majority&appName=jabesDatabases',
//     {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
//     }
//   )
//   .then(() => console.log('MongoDB connected...'))
//   .catch((err) => console.log(`MongoDB connection error: ${err.message}`));

// mongoose.connection.on('connected', () => {
//   console.log('Mongoose connected to DB');
// });

// mongoose.connection.on('error', (err) => {
//   console.log(`Mongoose connection error: ${err.message}`);
// });

// mongoose.connection.on('disconnected', () => {
//   console.log('Mongoose disconnected from DB');
// });

// // Multer setup for file uploads
// const storage = multer.memoryStorage();
// const upload = multer({ storage }).single('file'); // Ensure 'file' matches client request field name

// // Enable CORS
// app.use(cors());

// // Define __dirname
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Endpoint to upload .pcap files
// app.post('/api/upload', (req, res) => {
//   upload(req, res, async (err) => {
//     if (err instanceof multer.MulterError) {
//       res.status(500).send(`Multer error: ${err.message}`);
//     } else if (err) {
//       res.status(500).send(`Error: ${err.message}`);
//     } else {
//       const { originalname, buffer, mimetype } = req.file;
//       const newFile = new PcapFile({
//         filename: originalname,
//         data: buffer,
//         contentType: mimetype,
//       });

//       try {
//         await newFile.save();
//         res.status(200).send('File uploaded successfully');
//       } catch (error) {
//         res.status(500).send(`Error saving file: ${error.message}`);
//       }
//     }
//   });
// });

// // Endpoint to read and parse the .pcap file using tshark
// app.get('/api/pcap-data/:filename', async (req, res) => {
//   try {
//     const pcapFile = await PcapFile.findOne({ filename: req.params.filename });

//     if (!pcapFile) {
//       res.status(404).send('File not found');
//       return;
//     }

//     // Write the file to the disk temporarily for tshark to process
//     const tmpFilePath = path.join(__dirname, `tmp_${pcapFile.filename}`);
//     fs.writeFileSync(tmpFilePath, pcapFile.data);

//     const command = `tshark -r "${tmpFilePath}" -T json`;

//     exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
//       // Increase buffer size to 10MB
//       fs.unlinkSync(tmpFilePath); // Clean up the temporary file

//       if (error) {
//         res.status(500).send(`Error executing tshark: ${error.message}`);
//         return;
//       }
//       if (stderr) {
//         res.status(500).send(`Error: ${stderr}`);
//         return;
//       }

//       try {
//         const packets = JSON.parse(stdout);
//         const formattedPackets = packets.map((packet) => {
//           const biccData = packet._source?.layers?.bicc;
//           const time = packet._source?.layers?.frame?.['frame.time'];

//           const callingPartyNumber = biccData?.['isup.calling'] || '';
//           console.log('calling party: ', packet._source?.layers?.bicc?.['isup.calling'])
//           const calledPartyNumber = biccData?.['isup.called'] || '';
//           const countryCode = calledPartyNumber.slice(0, 3) || '';
//           const msisdn = biccData?.['isup.called_tree']?.['e164.msisdn'] || '';
//           const locationNumber = biccData?.['isup.location_number'] || '';
//           const locationCountryCode = locationNumber.slice(0, 3) || '';

//           return {
//             time: time || '',
//             callingPartyNumber,
//             calledPartyNumber,
//             countryCode,
//             msisdn,
//             locationNumber,
//             locationCountryCode,
//           };
//         });

//         res.json(formattedPackets);
//       } catch (parseError) {
//         res
//           .status(500)
//           .send(`Error parsing tshark output: ${parseError.message}`);
//       }
//     });
//   } catch (error) {
//     res.status(500).send(`Error retrieving file: ${error.message}`);
//   }
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });
