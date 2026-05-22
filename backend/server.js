const express = require("express");
const cors = require("cors");

const translateRoutes = require("./routes/translateRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/translate", translateRoutes);

app.get("/", (req, res) => {
  res.send("Ainthamizh AI Backend Running");
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});