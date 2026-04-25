const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/consultar-dni/:dni", async (req, res) => {
  const { dni } = req.params;

  try {

    const url = `${process.env.RENIEC_API_URL}/${dni}`;

    console.log("Consultando RENIEC:", url);

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${process.env.RENIEC_TOKEN}`
      }
    });

    res.json(response.data);

  } catch (error) {

    console.error("Error consultando DNI:", error.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: "No se pudo consultar el DNI"
    });

  }
});

module.exports = router;