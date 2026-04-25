const crypto = require("crypto");

const token = crypto.randomBytes(32).toString("hex");

// guardar token en la base de datos

const resetLink = `http://localhost:3000/reset-password?token=${token}`;