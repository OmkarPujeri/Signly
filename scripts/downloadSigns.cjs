const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const signsDir = path.join(__dirname, '..', 'public', 'assets', 'signs');
const failedFile = path.join(__dirname, 'failed.txt');

const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');

if (!fs.existsSync(signsDir)) {
  fs.mkdirSync(signsDir, { recursive: true });
}

function download(letter, url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error(`Too many redirects for ${letter}`));
      return;
    }

    const filename = path.join(signsDir, `${letter}.gif`);
    const file = fs.createWriteStream(filename);

    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.lifeprint.com'
      }
    };

    protocol.get(url, options, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlink(filename, () => {});
        const nextUrl = new URL(response.headers.location, url).toString();
        resolve(download(letter, nextUrl, redirectCount + 1));
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(filename, () => {});
        reject(new Error(`Failed to download ${letter}: ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Successfully downloaded ${letter}.gif`);
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      fs.unlink(filename, () => {});
      reject(err);
    });
  });
}

async function run() {
  if (fs.existsSync(failedFile)) {
    fs.unlinkSync(failedFile);
  }

  console.log('Starting ASL Alphabet download from Lifeprint...');

  for (const letter of letters) {
    const url = `https://www.lifeprint.com/asl101/fingerspelling/abc-gifs/${letter}.gif`;
    try {
      await download(letter, url);
    } catch (err) {
      console.error(`Error downloading ${letter}: ${err.message}`);
      fs.appendFileSync(failedFile, `${letter}: ${err.message}\n`);
    }
  }
  
  console.log('Download process complete.');
}

run();
