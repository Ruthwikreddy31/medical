import app from "./app.js";

// Trigger nodemon reload to pick up new env changes
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Medical triage API running on http://localhost:${port}`);
});
