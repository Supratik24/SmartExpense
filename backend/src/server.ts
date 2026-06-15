import { app } from './app.js';
import { env } from './config/env.js';
import { seedClerkUser } from './db/seed.js';

await seedClerkUser();

app.listen(env.PORT, () => {
  console.log(`SmartExpense AI API listening on ${env.PORT}`);
});
