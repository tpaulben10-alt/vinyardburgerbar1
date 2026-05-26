import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import { fetchWithAuth } from '../services/api';

export default function ProfitAnalytics() {
  const salesChartRef = useRef<HTMLCanvasElement>(null);
  const pieChartRef = useRef<HTMLCanvasElement>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const data = await fetchWithAuth(
        `/features/admin/profit-analytics?start_date=${dateRange.start}&end_date=${dateRange.end}`
      );
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  useEffect(() => {
    if (!analytics) return;

    // Sales vs Expenses Chart
    if (salesChartRef.current) {
      const ctx = salesChartRef.current.getContext('2d');
      if (ctx) {
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: analytics.daily_sales?.map((d: any) => new Date(d.date).toLocaleDateString()) || [],
            datasets: [
              {
                label: 'Gross Sales',
                data: analytics.daily_sales?.map((d: any) => d.gross_sales) || [],
                backgroundColor: '#F4A261',
                borderRadius: 4
              },
              {
                label: 'Expenses',
                data: analytics.daily_sales?.map((d: any) => 
                  analytics.expenses_by_category
                    ?.filter((e: any) => e.date === d.date)
                    ?.reduce((sum: number, e: any) => sum + Number(e.total), 0) || 0
                ) || [],
                backgroundColor: '#E76F51',
                borderRadius: 4
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: 'Sales vs Expenses' }
            },
            scales: {
              y: { beginAtZero: true }
            }
          }
        });
      }
    }

    // Expense Distribution Pie Chart
    if (pieChartRef.current && analytics.expenses_by_category) {
      const ctx = pieChartRef.current.getContext('2d');
      if (ctx) {
        const categoryTotals = analytics.expenses_by_category.reduce((acc: any, exp: any) => {
          acc[exp.category] = (acc[exp.category] || 0) + Number(exp.total);
          return acc;
        }, {});

        new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: Object.keys(categoryTotals).map(c => c.charAt(0).toUpperCase() + c.slice(1)),
            datasets: [{
              data: Object.values(categoryTotals),
              backgroundColor: ['#1B4332', '#F4A261', '#E76F51', '#2A9D8F', '#E9C46A', '#264653']
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'right' },
              title: { display: true, text: 'Expenses by Category' }
            }
          }
        });
      }
    }
  }, [analytics]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#1B4332] flex items-center gap-2">
          <PieChart className="text-[#F4A261]" />
          Profit Analytics
        </h2>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            className="px-3 py-2 border rounded-lg text-sm"
          />
          <span className="self-center">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            className="px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      </div>

      {analytics && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-green-600" size={20} />
                <span className="text-sm text-green-700 font-medium">Gross Sales</span>
              </div>
              <p className="text-2xl font-bold text-green-800">
                ₱{Number(analytics.summary.gross_sales).toLocaleString('en-PH', {minimumFractionDigits: 2})}
              </p>
            </div>

            <div className="bg-red-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="text-red-600" size={20} />
                <span className="text-sm text-red-700 font-medium">Total Expenses</span>
              </div>
              <p className="text-2xl font-bold text-red-800">
                ₱{Number(analytics.summary.expenses + analytics.summary.cost_of_goods).toLocaleString('en-PH', {minimumFractionDigits: 2})}
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="text-blue-600" size={20} />
                <span className="text-sm text-blue-700 font-medium">Net Profit</span>
              </div>
              <p className={`text-2xl font-bold ${analytics.summary.net_profit >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                ₱{Number(analytics.summary.net_profit).toLocaleString('en-PH', {minimumFractionDigits: 2})}
              </p>
            </div>

            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <PieChart className="text-purple-600" size={20} />
                <span className="text-sm text-purple-700 font-medium">Profit Margin</span>
              </div>
              <p className={`text-2xl font-bold ${parseFloat(analytics.summary.profit_margin) >= 0 ? 'text-purple-800' : 'text-red-800'}`}>
                {analytics.summary.profit_margin}%
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <canvas ref={salesChartRef}></canvas>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <canvas ref={pieChartRef}></canvas>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
