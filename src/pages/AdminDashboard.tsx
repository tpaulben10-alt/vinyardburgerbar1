import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
import { 
  LayoutDashboard, ShoppingBag, Users, MapPin, 
  DollarSign, Package, Clock, CheckCircle,
  TrendingUp, AlertCircle, Loader2
} from 'lucide-react';
import AdminOrders from '../components/AdminOrders';
import AdminCustomers from '../components/AdminCustomers';
import AdminMenu from '../components/AdminMenu';
import POS from '../components/POS';
import KDS from '../components/KDS';
import DeliveryRouteMap from '../components/DeliveryRouteMap';
import ProfitAnalytics from '../components/ProfitAnalytics';

export default function AdminDashboard() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin]);

  const loadStats = async () => {
    try {
      const data = await adminAPI.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview stats={stats} loading={loading} />;
      case 'orders':
        return <AdminOrders />;
      case 'customers':
        return <AdminCustomers />;
      case 'menu':
        return <AdminMenu />;
      case 'pos':
        return <POS />;
      case 'kds':
        return <KDS />;
      case 'delivery':
        return <DeliveryRouteMap />;
      case 'analytics':
        return <ProfitAnalytics />;
      default:
        return <DashboardOverview stats={stats} loading={loading} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1B4332] text-white flex-shrink-0 fixed h-full overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <img
              src="/images/logo.jpg"
              alt="Vinyard Burger Bar"
              className="w-11 h-11 rounded-full object-cover ring-2 ring-[#F4A261] bg-white"
            />
            <span className="font-bold text-lg">Admin Panel</span>
          </div>

          <nav className="space-y-2">
            <SidebarButton 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')}
              icon={<LayoutDashboard size={20} />}
              label="Dashboard"
            />
            <SidebarButton 
              active={activeTab === 'pos'} 
              onClick={() => setActiveTab('pos')}
              icon={<DollarSign size={20} />}
              label="POS System"
            />
            <SidebarButton 
              active={activeTab === 'orders'} 
              onClick={() => setActiveTab('orders')}
              icon={<ShoppingBag size={20} />}
              label="Orders"
            />
            <SidebarButton 
              active={activeTab === 'customers'} 
              onClick={() => setActiveTab('customers')}
              icon={<Users size={20} />}
              label="Customers"
            />
            <SidebarButton 
              active={activeTab === 'menu'} 
              onClick={() => setActiveTab('menu')}
              icon={<Package size={20} />}
              label="Menu Management"
            />
            <SidebarButton 
              active={activeTab === 'kds'} 
              onClick={() => setActiveTab('kds')}
              icon={<Clock size={20} />}
              label="Kitchen Display"
            />
            <SidebarButton 
              active={activeTab === 'delivery'} 
              onClick={() => setActiveTab('delivery')}
              icon={<MapPin size={20} />}
              label="Delivery Routes"
            />
            <SidebarButton 
              active={activeTab === 'analytics'} 
              onClick={() => setActiveTab('analytics')}
              icon={<TrendingUp size={20} />}
              label="Profit Analytics"
            />
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F4A261] rounded-full flex items-center justify-center">
              <span className="text-[#1B4332] font-bold">{user?.name?.[0]}</span>
            </div>
            <div>
              <p className="font-semibold text-sm">{user?.name}</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {renderContent()}
      </main>
    </div>
  );
}

function SidebarButton({ active, onClick, icon, label }: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        active 
          ? 'bg-[#F4A261] text-[#1B4332] font-semibold' 
          : 'hover:bg-white/10 text-gray-300'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function DashboardOverview({ stats, loading }: { stats: any; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#F4A261]" size={48} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#1B4332] mb-8">Dashboard Overview</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Today's Orders"
          value={stats?.today_orders || 0}
          icon={<ShoppingBag className="text-[#F4A261]" size={24} />}
          trend="+12%"
        />
        <StatCard 
          title="Today's Revenue"
          value={`₱${(stats?.today_revenue || 0).toFixed(2)}`}
          icon={<DollarSign className="text-green-500" size={24} />}
          trend="+8%"
        />
        <StatCard 
          title="Online Customers"
          value={stats?.online_customers || 0}
          icon={<Users className="text-blue-500" size={24} />}
          subtitle={`of ${stats?.total_customers || 0} total`}
        />
        <StatCard 
          title="Pending Orders"
          value={stats?.pending_orders || 0}
          icon={<Clock className="text-orange-500" size={24} />}
          alert={stats?.pending_orders > 5}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-[#1B4332] mb-4">Monthly Performance</h2>
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <TrendingUp size={48} className="mx-auto text-[#F4A261] mb-4" />
              <p className="text-3xl font-bold text-[#1B4332]">
                ₱{(stats?.monthly_revenue || 0).toFixed(2)}
              </p>
              <p className="text-gray-500">Total Revenue This Month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-[#1B4332] mb-4">Store Information</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="text-[#E76F51] mt-1" size={20} />
              <div>
                <p className="font-semibold text-[#1B4332]">Address</p>
                <p className="text-gray-600 text-sm">Catmonan St., Poblacion, Hinunangan, Philippines, 6608</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="text-[#E76F51] mt-1" size={20} />
              <div>
                <p className="font-semibold text-[#1B4332]">Operating Hours</p>
                <p className="text-gray-600 text-sm">Mon - Sun: 2PM - 10:30PM</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="text-[#E76F51] mt-1" size={20} />
              <div>
                <p className="font-semibold text-[#1B4332]">Status</p>
                <p className="text-green-600 text-sm font-medium">Open Now</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, subtitle, alert }: any) {
  return (
    <div className={`bg-white rounded-xl shadow-md p-6 ${alert ? 'border-2 border-red-200' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold text-[#1B4332] mt-1">{value}</p>
          {trend && (
            <p className="text-green-500 text-sm mt-1 flex items-center gap-1">
              <TrendingUp size={14} />
              {trend} from yesterday
            </p>
          )}
          {subtitle && (
            <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
          )}
          {alert && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle size={14} />
              Needs attention
            </p>
          )}
        </div>
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}
