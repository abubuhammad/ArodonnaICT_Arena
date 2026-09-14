import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// Mapping of country codes to currencies
const countryToCurrency: { [key: string]: { currency: string; locale: string } } = {
  'NG': { currency: 'NGN', locale: 'en-NG' },
  'US': { currency: 'USD', locale: 'en-US' },
  'GB': { currency: 'GBP', locale: 'en-GB' },
  'CA': { currency: 'CAD', locale: 'en-CA' },
  'AU': { currency: 'AUD', locale: 'en-AU' },
  'IN': { currency: 'INR', locale: 'en-IN' },
  'ZA': { currency: 'ZAR', locale: 'en-ZA' },
  'KE': { currency: 'KES', locale: 'en-KE' },
  'GH': { currency: 'GHS', locale: 'en-GH' },
  'EU': { currency: 'EUR', locale: 'en-EU' },
};

/**
 * Complete instructor onboarding: update profile with location, currency, and bank details
 * PUT /api/instructors/onboarding/:userId
 */
export const completeInstructorOnboarding = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { country, countryCode, bankDetails } = req.body;

    if (!userId || !country || !countryCode) {
      res.status(400).json({ error: 'Missing required fields: userId, country, countryCode' });
      return;
    }

    // Look up currency from country code
    const currencyMapping = countryToCurrency[countryCode.toUpperCase()];
    if (!currencyMapping) {
      res.status(400).json({ error: `Unknown country code: ${countryCode}` });
      return;
    }

    const { currency, locale } = currencyMapping;

    // Update user with onboarding data
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        country,
        countryCode: countryCode.toUpperCase(),
        currency,
        locale,
        bankDetails: bankDetails || {},
        onboardingCompleted: true
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      message: 'Instructor onboarding completed',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        country: user.country,
        currency: user.currency,
        locale: user.locale,
        onboardingCompleted: user.onboardingCompleted
      }
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ error: 'Onboarding failed', details: (error as any).message });
  }
};

/**
 * Get instructor profile with onboarding status
 * GET /api/instructors/profile/:userId
 */
export const getInstructorProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      country: user.country,
      countryCode: user.countryCode,
      currency: user.currency,
      locale: user.locale,
      bankDetails: user.bankDetails,
      onboardingCompleted: user.onboardingCompleted
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

/**
 * Get list of supported countries and their currencies for onboarding dropdown
 * GET /api/instructors/countries
 */
export const getSupportedCountries = async (req: Request, res: Response) => {
  try {
    const countries = [
      { code: 'NG', name: 'Nigeria', currency: 'NGN' },
      { code: 'US', name: 'United States', currency: 'USD' },
      { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
      { code: 'CA', name: 'Canada', currency: 'CAD' },
      { code: 'AU', name: 'Australia', currency: 'AUD' },
      { code: 'IN', name: 'India', currency: 'INR' },
      { code: 'ZA', name: 'South Africa', currency: 'ZAR' },
      { code: 'KE', name: 'Kenya', currency: 'KES' },
      { code: 'GH', name: 'Ghana', currency: 'GHS' },
      { code: 'EU', name: 'Europe', currency: 'EUR' }
    ];

    res.json({ countries });
  } catch (error) {
    console.error('Countries fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
};
