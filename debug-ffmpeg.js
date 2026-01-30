
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const os = require('os');

console.log('Platform:', os.platform());
console.log('Arch:', os.arch());
console.log('ffmpeg-static path:', ffmpegPath);

if (ffmpegPath) {
  try {
    if (fs.existsSync(ffmpegPath)) {
      console.log('File exists!');
      try {
          fs.accessSync(ffmpegPath, fs.constants.X_OK);
          console.log('File is executable');
      } catch (e) {
          console.log('File is NOT executable:', e.message);
      }
    } else {
      console.log('File does NOT exist.');
      // Try to list the directory to see what's there
      const dir = require('path').dirname(ffmpegPath);
      if (fs.existsSync(dir)) {
          console.log(`Listing dir ${dir}:`, fs.readdirSync(dir));
      } else {
          console.log(`Directory ${dir} does not exist.`);
      }
    }
  } catch (err) {
    console.error('Error checking file:', err);
  }
} else {
  console.log('ffmpeg-static returned null/undefined');
}
