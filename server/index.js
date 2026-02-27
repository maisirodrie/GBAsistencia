import app from './app.js';
import { connectDB } from './db.js';
import dotenv from 'dotenv';

dotenv.config();

connectDB();
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server on port ${PORT}`);
});
