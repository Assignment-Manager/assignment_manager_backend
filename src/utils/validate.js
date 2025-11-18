const Joi = require("joi");

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,25}$/;

const registerSchema = Joi.object({
  firstname: Joi.string().trim().min(1).max(100).required(),
  lastname: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().pattern(passwordPattern).required().messages({
    "string.pattern.base":
      "Password must be 8–25 characters and include uppercase, lowercase, a number and a special character.",
  }),
  role: Joi.string().valid("user", "admin").optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
});

async function validateRegister(data) {
  return registerSchema.validateAsync(data, { abortEarly: false });
}

async function validateLogin(data) {
  return loginSchema.validateAsync(data, { abortEarly: false });
}

function handleValidationError(err, res) {
  if (err && err.isJoi) {
    const details = err.details
      ? err.details.map((d) => d.message)
      : [err.message];
    res.status(400).json({ message: "Validation failed", details });
    return true;
  }
  return false;
}

module.exports = {
  validateRegister,
  validateLogin,
  handleValidationError,
};
