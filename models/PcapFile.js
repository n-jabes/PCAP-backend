// models/PcapFile.js
import mongoose from 'mongoose';

//create a schema to store my pcap files
const PcapFileSchema = new mongoose.Schema({
  filename: String,
  data: Buffer,
  contentType: String,
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('PcapFile', PcapFileSchema);
