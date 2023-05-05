/** Common config for message.ly */

// read .env files and make environmental variables

require("dotenv").config();

const DB_URI = (process.env.NODE_ENV === "test")
  ? "postgresql:///messagely_test"
  : "postgresql:///messagely";

const SECRET_KEY = process.env.SECRET_KEY || "TheLifeOfStrangeZebras";
const SECRET_KEY_2 = process.env.SECRET_KEY || "CatInABaseBallHat";

const BCRYPT_WORK_FACTOR = 12;


module.exports = {
  DB_URI,
  SECRET_KEY,
  SECRET_KEY_2,
  BCRYPT_WORK_FACTOR,
};