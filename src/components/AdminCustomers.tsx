import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { MapPin, Phone, Loader2, Circle } from 'lucide-react';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [customersData, onlineData] = await Promise.all([
        adminAPI.getCustomers(),
        adminAPI.getOnlineUsers()
      ]);
      setCustomers(customersData);
      setOnlineUsers(onlineData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setCustomers(customers.map(c => c.id === userId ? { ...c, role: newRole } : c));
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#1B4332] mb-6">User Management</h1>

      {/* Online Users */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-[#1B4332] mb-4 flex items-center gap-2">
          <Circle className="text-green-500 fill-green-500" size={12} />
          Currently Online ({onlineUsers.length})
        </h2>
        {onlineUsers.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {onlineUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-[#1B4332]">{user.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No customers currently online</p>
        )}
      </div>

      {/* All Customers */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-[#F4A261]" size={48} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Address</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Orders</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Points</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#F4A261] rounded-full flex items-center justify-center">
                          <span className="text-[#1B4332] font-bold">{customer.name[0]}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-[#1B4332]">{customer.name}</p>
                          <p className="text-sm text-gray-500">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={14} />
                        {customer.phone || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2 text-sm text-gray-600 max-w-xs">
                        <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                        <span className="truncate">{customer.address || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-[#1B4332]">{customer.total_orders}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-[#E76F51]">{customer.loyalty_points}</span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={customer.role || 'customer'}
                        onChange={(e) => handleRoleChange(customer.id, e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-[#1B4332] text-sm rounded-lg focus:ring-[#F4A261] focus:border-[#F4A261] block p-1.5 outline-none font-medium"
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      {customer.is_online ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                          <Circle size={8} className="fill-green-500" />
                          Online
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">
                          {customer.last_login ? 
                            new Date(customer.last_login).toLocaleDateString() : 
                            'Never'
                          }
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}