import { useState, useEffect } from 'react';
import { Plus, Calendar, TrendingDown } from 'lucide-react';
import { fetchWithAuth } from '../services/api';

interface Expense {
  id: number;
  description: string;
  amount: number;
  expense_date: string;
  category: string;
  notes?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const EXPENSE_CATEGORIES = [
  { value: 'inventory', label: 'Inventory/Raw Materials', color: 'bg-blue-100 text-blue-800' },
  { value: 'utilities', label: 'Utilities (Electric/Water)', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'rent', label: 'Rent/Lease', color: 'bg-purple-100 text-purple-800' },
  { value: 'salary', label: 'Staff Salaries', color: 'bg-green-100 text-green-800' },
  { value: 'marketing', label: 'Marketing/Ads', color: 'bg-pink-100 text-pink-800' },
  { value: 'miscellaneous', label: 'Miscellaneous', color: 'bg-gray-100 text-gray-800' }
];

export default function ExpenseTracker({ isOpen, onClose }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    category: 'miscellaneous',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchExpenses();
    }
  }, [isOpen]);

  const fetchExpenses = async () => {
    try {
      const data = await fetchWithAuth('/features/admin/expenses');
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await fetchWithAuth('/features/admin/expenses', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });
      
      setFormData({
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        category: 'miscellaneous',
        notes: ''
      });
      setShowAddForm(false);
      fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (value: string) => {
    return EXPENSE_CATEGORIES.find(c => c.value === value)?.label || value;
  };

  const getCategoryColor = (value: string) => {
    return EXPENSE_CATEGORIES.find(c => c.value === value)?.color || 'bg-gray-100';
  };

  const totalExpenses = expenses.reduce((sum: number, exp: Expense) => sum + parseFloat(String(exp.amount)), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-[#1B4332] text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Expense Tracker</h2>
            <p className="text-white/70 text-sm mt-1">Track daily store expenses</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Summary Card */}
          <div className="bg-red-50 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-red-700">₱{Number(totalExpenses).toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <TrendingDown className="text-red-600" size={24} />
            </div>
          </div>

          {/* Add Button */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full mb-4 py-3 border-2 border-dashed border-[#F4A261] text-[#F4A261] rounded-xl font-semibold hover:bg-[#F4A261]/10 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            {showAddForm ? 'Cancel' : 'Add New Expense'}
          </button>

          {/* Add Form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-4 mb-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F4A261] outline-none"
                    placeholder="e.g., Electricity Bill, Gas for Delivery"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F4A261] outline-none"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F4A261] outline-none"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F4A261] outline-none"
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F4A261] outline-none resize-none"
                    rows={2}
                    placeholder="Additional details..."
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-[#F4A261] text-[#1B4332] rounded-lg font-semibold hover:bg-[#E76F51] hover:text-white transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Expense'}
              </button>
            </form>
          )}

          {/* Expenses List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-[#1B4332] flex items-center gap-2">
              <Calendar size={18} />
              Recent Expenses
            </h3>
            {expenses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No expenses recorded yet</p>
            ) : (
              expenses.map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#1B4332]">{expense.description}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getCategoryColor(expense.category)}`}>
                        {getCategoryLabel(expense.category)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{new Date(expense.expense_date).toLocaleDateString()}</p>
                    {expense.notes && <p className="text-xs text-gray-400 mt-1">{expense.notes}</p>}
                  </div>
                  <p className="font-bold text-red-600">-₱{Number(expense.amount).toFixed(2)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
