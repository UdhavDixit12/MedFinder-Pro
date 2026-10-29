import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/http.js';
import { checkSymptoms, symptomCatalog } from '../services/symptomService.js';
import AppError from '../utils/AppError.js';

export const getCatalog = (_req, res) => sendSuccess(res, symptomCatalog());

export const check = asyncHandler(async (req, res) => {
  const { symptoms = [], redFlags = [], description = '', ageGroup, duration } = req.valid;
  if (!symptoms.length && !redFlags.length && !description.trim()) {
    throw new AppError('Select at least one symptom or describe how you feel.', 400, 'VALIDATION_ERROR');
  }
  const result = await checkSymptoms({ symptoms, redFlags, description, ageGroup, duration });
  sendSuccess(res, result);
});
