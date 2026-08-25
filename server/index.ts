import 'dotenv/config';
import { app } from './app.js';
import { startBot } from './discord.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n  kio.lol API running on http://localhost:${PORT}\n`);
  startBot();
});
