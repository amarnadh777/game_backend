const crypto = require("crypto");

const HASH_PREFIX = "pbkdf2";
const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

const safeCompare = (first, second) => {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);

  if (firstBuffer.length !== secondBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(firstBuffer, secondBuffer);
};

const hashPassword = (password) => {
  if (!password || typeof password !== "string") {
    throw new Error("Password is required");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)
    .toString("hex");

  return `${HASH_PREFIX}$${ITERATIONS}$${salt}$${hash}`;
};

const verifyPassword = (password, storedPassword) => {
  if (!password || !storedPassword) {
    return false;
  }

  const parts = String(storedPassword).split("$");

  if (parts.length === 4 && parts[0] === HASH_PREFIX) {
    const [, iterationValue, salt, storedHash] = parts;
    const iterations = Number(iterationValue);

    if (!Number.isInteger(iterations) || iterations <= 0 || !salt || !storedHash) {
      return false;
    }

    const hash = crypto
      .pbkdf2Sync(String(password), salt, iterations, KEY_LENGTH, DIGEST)
      .toString("hex");

    return safeCompare(hash, storedHash);
  }

  return safeCompare(String(password), String(storedPassword));
};

module.exports = {
  hashPassword,
  verifyPassword,
};
