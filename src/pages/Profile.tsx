import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, loyaltyAPI } from '../services/api';
import { User, Phone, MapPin, Award, Gift, Loader2, Save } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [rewards, setRewards] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    loadProfile();
    loadRewards();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await userAPI.getProfile();
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        address: data.address || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadRewards = async () => {
    try {
      const data = await loyaltyAPI.getRewards();
      setRewards(data);
    } catch (error) {
      console.error('Error loading rewards:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await userAPI.updateProfile(formData);
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (rewardId: number) => {
    try {
      await loyaltyAPI.redeemReward(rewardId);
      setMessage('Reward redeemed successfully!');
      loadProfile();
    } catch (error: any) {
      setMessage(error.message || 'Failed to redeem reward');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-[#1B4332] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-gray-300 mt-2">Manage your account and loyalty rewards</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-[#1B4332] mb-6 flex items-center gap-2">
                <User className="text-[#E76F51]" />
                Personal Information
              </h2>

              {message && (
                <div className={`px-4 py-3 rounded-lg mb-6 ${
                  message.includes('success') 
                    ? 'bg-green-50 border border-green-200 text-green-600' 
                    : 'bg-red-50 border border-red-200 text-red-600'
                }`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4A261] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Phone size={16} />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4A261] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <MapPin size={16} />
                    Default Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4A261] outline-none resize-none"
                    rows={3}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-[#F4A261] text-[#1B4332] rounded-lg font-semibold hover:bg-[#E76F51] hover:text-white transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  Save Changes
                </button>
              </form>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-[#1B4332] mb-4">Account Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Email</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-medium">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Account Type</span>
                  <span className="font-medium capitalize">{user?.role}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Loyalty Program */}
          <div>
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-[#F4A261] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award size={40} className="text-[#1B4332]" />
                </div>
                <h2 className="text-2xl font-bold text-[#1B4332]">Loyalty Points</h2>
                <p className="text-4xl font-bold text-[#E76F51] mt-2">
                  {user?.loyalty_points || 0}
                </p>
                <p className="text-gray-500 text-sm mt-1">points available</p>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-bold text-[#1B4332] mb-4 flex items-center gap-2">
                  <Gift size={18} className="text-[#E76F51]" />
                  Available Rewards
                </h3>
                <div className="space-y-3">
                  {rewards.map((reward) => (
                    <div key={reward.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-[#1B4332]">{reward.name}</h4>
                        <span className="text-sm font-bold text-[#E76F51]">
                          {reward.points_required} pts
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                      <button
                        onClick={() => handleRedeem(reward.id)}
                        disabled={(user?.loyalty_points || 0) < reward.points_required}
                        className="w-full py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[#1B4332] text-white hover:bg-[#2D6A4F]"
                      >
                        {(user?.loyalty_points || 0) >= reward.points_required 
                          ? 'Redeem Now' 
                          : `Need ${reward.points_required - (user?.loyalty_points || 0)} more pts`}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 bg-[#F4A261]/10 rounded-lg">
                <p className="text-sm text-[#1B4332]">
                  <strong>Earn more points!</strong> Get 1 point for every ₱50 spent on orders.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}