// const express = require("express");
// const { login ,register,forgotPassword,
//   verifyResetToken,
//   resetPassword,
//   changePassword} = require("../controllers/auth.controller");
// const { verifyToken } = require('../middleware/auth.middleware');

// const router = express.Router();

// router.post("/login", login);
// router.post("/register",register);

// router.post("/forgot-password", forgotPassword);
// router.get("/verify-reset-token", verifyResetToken);
// router.post("/reset-password", resetPassword);

// // Ruta protegida - requiere token
// router.post("/change-password", verifyToken, changePassword);
// router.put("/update", verifyToken, updateUser);
// router.delete("/delete", verifyToken, deleteUser);
// router.get("/me", verifyToken, getUserById);


// module.exports = router;

const express = require("express");
const path = require("path"); // 👈 IMPORTA PATH

const { 
  login,
  register,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  changePassword,
  updateUser,
  deleteUser,
  getUserById,
  getall
} = require("../controllers/auth.controller");

const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Auth
router.post("/login", login);
router.post("/register", register);

// Recuperar contraseña
router.post("/forgot-password", forgotPassword);
router.get("/verify-reset-token", verifyResetToken);
router.post("/reset-password", resetPassword);

// ✅ Servir el HTML de reset password
router.get("/reset-password", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/reset-password.html"));
});

router.get("/reset-password/:token", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/reset-password.html"));
});

// Rutas protegidas
router.post("/change-password", verifyToken, changePassword);
router.put("/update/:id", verifyToken, updateUser);
router.delete("/delete", verifyToken, deleteUser);
router.get("/me", verifyToken, getUserById);
router.get("/users", verifyToken, getall);

module.exports = router;