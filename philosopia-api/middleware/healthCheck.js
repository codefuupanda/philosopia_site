import mongoose from "mongoose";

export default function healthCheck(req, res) {
  const dbReady = mongoose.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({ db: dbReady });
}
