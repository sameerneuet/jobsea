// Import the necessary libraries
import crypto from 'crypto';

// Function to generate a verification token
const generateVerificationToken = () => {
  // Generate a random buffer of 32 bytes
  const buffer = crypto.randomBytes(32);
  // Convert the buffer to a hexadecimal string
  const token = buffer.toString('hex');
  return token;
};

export default generateVerificationToken;
