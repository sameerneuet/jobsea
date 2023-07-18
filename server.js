import express from "express";
import morgan from "morgan";
import connectDB from "./db.js";
import authRoutes from './routes/authRoutes.js';

import cors from 'cors';
import path from 'path';
import {fileURLToPath} from 'url';
//es module fix
const _filename =fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);
// database config
connectDB();

// rest object
const app = express();

// middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname,'./build')))
// routes
app.use("/api/v1/auth", authRoutes);


// rest api
app.use('*',function(req,res) {
  res.sendFile(path.join(__dirname,'./build/index.html'));
}) 
const PORT = process.env.port || 8080;
//serving the front end 
//aap.use(express.static(path.join(_)))
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
