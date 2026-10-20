// Local / long-running server. On Vercel, app.js is deployed directly as an Express app.
const app = require('./app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Rudelman Law running at http://localhost:${PORT}  (admin: /admin)`);
});
