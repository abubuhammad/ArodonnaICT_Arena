import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import api from '../../utils/api';
import { Button } from '../ui/button';
import ErrorMessage from '../ui/ErrorMessage';
import { LoadingSpinner } from '../ui/LoadingSpinner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface Country {
  code: string;
  name: string;
  currency: string;
}

interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
}

interface OnboardingData {
  country: string;
  countryCode: string;
  bankDetails: BankDetails;
}

interface InstructorOnboardingProps {
  userId: string;
  onComplete: () => void;
}

const InstructorOnboarding: React.FC<InstructorOnboardingProps> = ({ userId, onComplete }) => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<OnboardingData>({
    country: '',
    countryCode: '',
    bankDetails: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      bankCode: ''
    }
  });

  // Fetch supported countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await api.get(`/instructors/onboarding/countries`);
        setCountries(response.data.countries);
      } catch (err) {
        console.error('Failed to fetch countries:', err);
        setError('Failed to load countries list');
      }
    };
    fetchCountries();
  }, []);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = countries.find(c => c.code === e.target.value);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        country: selected.name,
        countryCode: selected.code
      }));
    }
  };

  const handleBankDetailChange = (field: keyof BankDetails, value: string) => {
    setFormData(prev => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.country || !formData.countryCode) {
      setError('Please select a country');
      return;
    }

    try {
      setLoading(true);
      await api.post(`/instructors/onboarding/${userId}`, formData);
      onComplete();
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.response?.data?.error || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-2">Instructor Onboarding</h2>
      <p className="text-gray-600 mb-6">Complete your profile to start earning on our platform</p>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Country Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Your Country <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.countryCode}
            onChange={handleCountryChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- Select Country --</option>
            {countries.map(country => (
              <option key={country.code} value={country.code}>
                {country.name} ({country.currency})
              </option>
            ))}
          </select>
        </div>

        {/* Bank Details */}
        {formData.countryCode && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Bank Details (for payouts)</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  value={formData.bankDetails?.accountName || ''}
                  onChange={e => handleBankDetailChange('accountName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your account name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.bankDetails?.accountNumber || ''}
                  onChange={e => handleBankDetailChange('accountNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your account number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bankDetails?.bankName || ''}
                  onChange={e => handleBankDetailChange('bankName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your bank name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Code
                </label>
                <input
                  type="text"
                  value={formData.bankDetails?.bankCode || ''}
                  onChange={e => handleBankDetailChange('bankCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your bank code"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={loading || !formData.country}
            className="flex-1"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Complete Onboarding'}
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Note: Earnings will be displayed in your selected country's currency
        </p>
      </form>
    </div>
  );
};

export default InstructorOnboarding;
