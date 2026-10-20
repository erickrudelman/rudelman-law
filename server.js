// Local / long-running server. On Vercel the same app runs from api/index.js.
const app = require('./app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Rudelman Law running at http://localhost:${PORT}  (admin: /admin)`);
});
