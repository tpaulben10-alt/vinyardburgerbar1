import { useState, useEffect } from 'react';
import { menuAPI, adminAPI } from '../services/api';
import { Plus, Edit2, Loader2 } from 'lucide-react';

export default function AdminMenu() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const data = await menuAPI.getMenu();
      setCategories(data);
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (item: any) => {
    try {
      await adminAPI.updateMenuItem(item.id, {
        ...item,
        is_available: !item.is_available
      });
      loadMenu();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#1B4332]">Menu Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#F4A261] text-[#1B4332] rounded-lg font-semibold hover:bg-[#E76F51] hover:text-white transition-colors"
        >
          <Plus size={18} />
          Add Item
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-[#F4A261]" size={48} />
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-[#1B4332] text-white px-6 py-4">
                <h2 className="text-xl font-bold">{category.name}</h2>
                <p className="text-gray-300 text-sm">{category.description}</p>
              </div>
              <div className="divide-y">
                {category.items?.map((item: any) => (
                  <div key={item.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={item.image_url || `https://source.unsplash.com/100x100/?food&sig=${item.id}`}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop';
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#1B4332]">{item.name}</h3>
                        <p className="text-sm text-gray-600">{item.description}</p>
                        <p className="text-[#E76F51] font-bold mt-1">₱{item.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          item.is_available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </button>
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-2 text-gray-400 hover:text-[#F4A261] transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal would go here */}
      {(editingItem || showAddModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-[#1B4332] mb-4">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h2>
            <p className="text-gray-600 mb-4">
              Menu editing functionality would be implemented here with full form fields for name, description, price, image, etc.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setEditingItem(null); setShowAddModal(false); }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => { setEditingItem(null); setShowAddModal(false); }}
                className="flex-1 px-4 py-2 bg-[#F4A261] text-[#1B4332] rounded-lg font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}